import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { storySchema } from '../lib/validators.js';
import { createFileStore } from '../db/fileStore.js';
import { ok, fail } from '../lib/response.js';
const r=Router(); const db=createFileStore();
r.use(authenticate);
r.post('/', async(req,res)=>{
  const p=storySchema.safeParse(req.body); if(!p.success) return res.status(400).json(fail('VALIDATION','Invalid story',p.error.flatten()));
  const u=(req as any).user;
  const now=new Date(); const expires=new Date(now.getTime()+24*60*60*1000);
  // mediaUrl is now Cloudinary secure_url + public_id for optimization
  const story={id:uuid(), userId:u.id, ...p.data, createdAt:now.toISOString(), expiresAt:expires.toISOString(), views:[]};
  await db.stories.create(story); res.json(ok(story));
});
r.get('/feed', async(req,res)=>{ const u=(req as any).user; const feed=await db.stories.feedForUser(u.id); res.json(ok(feed)); });
r.get('/:id', async(req,res)=>{ const s=await db.stories.findById(req.params.id); if(!s) return res.status(404).json(fail('NOT_FOUND','Story not found')); if(new Date(s.expiresAt).getTime()<Date.now()) return res.status(410).json(fail('GONE','Story expired')); res.json(ok(s)); });
r.post('/:id/view', async(req,res)=>{ const u=(req as any).user; const updated=await db.stories.addView(req.params.id, u.id); if(!updated) return res.status(404).json(fail('NOT_FOUND','Story not found')); res.json(ok(updated)); });
export default r;
