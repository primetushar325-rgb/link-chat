import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createFileStore } from './db/fileStore.js';
import { signTicket, verifyAccess } from './lib/jwt.js';
import { authenticate } from './middleware/auth.js';
import { csrf } from './middleware/csrf.js';
import authRoutes from './routes/auth.js';
import badgeRoutes from './routes/badge.js';
import convRoutes from './routes/conversations.js';
import mediaRoutes from './routes/media.js';
import storyRoutes from './routes/stories.js';
import adminRoutes from './routes/admin.js';
import friendsRoutes from './routes/friends.js';
import { ok } from './lib/response.js';
import { createWsServer, attachWsToServer } from './ws/server.js';

const app=express();
const PORT=Number(process.env.PORT||4000);
const WS_PORT=Number(process.env.WS_PORT || process.env.PORT || 4001);

app.use(helmet());
app.use(cors({origin:(process.env.CORS_ORIGIN||'*').split(','), credentials:true}));
app.use(express.json({limit:'10mb'}));
app.use(cookieParser());
app.use(csrf);

// rate limiters
const authLimiter=rateLimit({windowMs:60*1000, max:10, standardHeaders:true, legacyHeaders:false});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/health', (_req,res)=> res.json(ok({status:'ok', time:new Date().toISOString()})));

// public badge + health
app.use('/api', badgeRoutes);

// auth
app.use('/api/auth', authRoutes);

// protected
app.get('/api/me', authenticate, async(req,res)=>{
  const u=(req as any).user; const db=createFileStore(); const full=await db.users.findById(u.id); if(!full) return res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'User not found'}});
  const {passwordHash,...safe}=full; res.json(ok(safe));
});
app.post('/api/ws/ticket', authenticate, async(req,res)=>{
  const u=(req as any).user; const ticket=signTicket({id:u.id, email:u.email, role:u.role}); res.json(ok({ticket}));
});
app.post('/api/push/token', authenticate, async(req,res)=>{
  // store push token in user (fileStore)
  const u=(req as any).user; const db=createFileStore(); await db.users.update(u.id,{pushToken:req.body.token}); res.json(ok({ok:true}));
});

app.use('/api/conversations', convRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/admin', adminRoutes);

// seed admin + purge stories cron
async function seed(){
  const db=createFileStore();
  const email=process.env.ADMIN_SEED_EMAIL||'admin@link.app';
  const existing=await db.users.findByEmail(email);
  if(!existing){
    const bcrypt=(await import('bcryptjs')).default;
    const hash=await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD||'Admin123!',10);
    const {v4:uuid}=await import('uuid');
    await db.users.create({id:uuid(), name:'Admin', email, passwordHash:hash, role:'admin', status:'active', avatarUrl:'', createdAt:new Date().toISOString()});
    console.log(`[seed] admin ${email} created`);
  }
}
seed();

// purge expired stories hourly
setInterval(async()=>{ const db=createFileStore(); const n=await db.stories.purgeExpired(); if(n>0) console.log(`[cron] purged ${n} expired stories`); }, 60*60*1000);

app.use((req,res)=> res.status(404).json({success:false,error:{code:'NOT_FOUND',message:`${req.method} ${req.path} not found`}}));

const httpServer = app.listen(PORT, '0.0.0.0', ()=> console.log(`[api] listening on :${PORT}`));
// If WS_PORT equals PORT (single-port hosts like Render), attach the WebSocket
// server to the same HTTP server so one public port serves both API + WS.
if (WS_PORT === PORT) {
  attachWsToServer(httpServer);
} else {
  createWsServer(WS_PORT);
}
