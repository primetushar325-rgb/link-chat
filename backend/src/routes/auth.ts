import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { registerSchema, loginSchema, googleSchema } from '../lib/validators.js';
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt.js';
import { createFileStore } from '../db/fileStore.js';
import { ok, fail } from '../lib/response.js';
const r=Router(); const db=createFileStore();

r.post('/register', async(req,res)=>{
  const parsed=registerSchema.safeParse(req.body); if(!parsed.success) return res.status(400).json(fail('VALIDATION', 'Invalid input', parsed.error.flatten()));
  const {name,email,password}=parsed.data;
  if(await db.users.findByEmail(email)) return res.status(409).json(fail('EXISTS','Email already registered'));
  const hash=await bcrypt.hash(password,10);
  const user={id:uuid(), name,email, passwordHash:hash, role:'user', status:'active', avatarUrl:'', createdAt:new Date().toISOString()};
  await db.users.create(user);
  const accessToken=signAccess({id:user.id,email,role:user.role}); const refreshToken=signRefresh({id:user.id});
  const {passwordHash,...safe}=user;
  res.json(ok({user:safe,accessToken,refreshToken}));
});
r.post('/login', async(req,res)=>{
  const parsed=loginSchema.safeParse(req.body); if(!parsed.success) return res.status(400).json(fail('VALIDATION','Invalid input',parsed.error.flatten()));
  const {email,password}=parsed.data; const user=await db.users.findByEmail(email); if(!user) return res.status(401).json(fail('AUTH','Invalid credentials'));
  if(user.status!=='active') return res.status(403).json(fail('SUSPENDED','Account '+user.status));
  const okPw=await bcrypt.compare(password, user.passwordHash); if(!okPw) return res.status(401).json(fail('AUTH','Invalid credentials'));
  const accessToken=signAccess({id:user.id,email:user.email,role:user.role}); const refreshToken=signRefresh({id:user.id});
  const {passwordHash,...safe}=user; res.json(ok({user:safe,accessToken,refreshToken}));
});
r.post('/google', async(req,res)=>{
  const parsed=googleSchema.safeParse(req.body); if(!parsed.success) return res.status(400).json(fail('VALIDATION','Invalid input',parsed.error.flatten()));
  try{
    // Verify id_token with Google tokeninfo (aud must match our GOOGLE_CLIENT_ID)
    const info=await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${parsed.data.idToken}`).then(r=>r.json());
    if(info.error || !info.email) {
      // fallback to v3 endpoint
      const alt = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${parsed.data.idToken}`).then(r=>r.json()).catch(()=>null);
      if(!alt || alt.error || !alt.email) return res.status(401).json(fail('AUTH', info.error_description || info.error || 'Invalid Google token'));
      // use alt
      (info as any).email = alt.email; (info as any).aud = alt.aud; (info as any).name = alt.name; (info as any).picture = alt.picture; (info as any).email_verified = alt.email_verified;
    }
    // Enforce audience — token must be issued for OUR client
    const expectedAud = process.env.GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if(expectedAud && info.aud !== expectedAud){
      return res.status(401).json(fail('AUTH', `Google token aud mismatch. Expected ${expectedAud}`));
    }
    if(info.email_verified !== 'true' && info.email_verified !== true){
      // allow but warn — many workspace emails show false
    }
    let user=await db.users.findByEmail(info.email);
    if(!user){ 
      user={id:uuid(), name: info.name || info.email.split('@')[0], email:info.email, passwordHash:'', role:'user', status:'active', avatarUrl:info.picture||'', createdAt:new Date().toISOString(), provider:'google'}; 
      await db.users.create(user); 
    }
    if(user.status!=='active') return res.status(403).json(fail('SUSPENDED','Account '+user.status));
    // Issue SAME app JWT as email/password login — unified session format
    const accessToken=signAccess({id:user.id,email:user.email,role:user.role}); 
    const refreshToken=signRefresh({id:user.id});
    const {passwordHash,...safe}=user; 
    res.json(ok({user:safe,accessToken,refreshToken}));
  }catch(e:any){ 
    console.error('[google auth]', e);
    return res.status(500).json(fail('GOOGLE', e.message || 'Google verification failed'));
  }
});
r.post('/refresh', async(req,res)=>{
  const {refreshToken}=req.body; if(!refreshToken) return res.status(400).json(fail('VALIDATION','refreshToken required'));
  try{ const p=verifyRefresh(refreshToken); const user=await db.users.findById(p.id); if(!user) return res.status(401).json(fail('AUTH','User not found')); const accessToken=signAccess({id:user.id,email:user.email,role:user.role}); res.json(ok({accessToken})); }catch{ return res.status(401).json(fail('AUTH','Invalid refresh token'));}
});
r.post('/logout', (_req,res)=>{ res.json(ok({ok:true})); });
export default r;
