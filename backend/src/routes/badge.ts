import { Router } from 'express';
import { badgeService } from '../services/badgeService.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { badgeSchema } from '../lib/validators.js';
import { ok, fail } from '../lib/response.js';
const r=Router();
r.get('/settings/badge', async(_req,res)=>{ const b=await badgeService.get(); res.json(ok(b)); });
r.put('/admin/settings/badge', authenticate, requireAdmin, async(req,res)=>{
  const parsed=badgeSchema.safeParse(req.body); if(!parsed.success) return res.status(400).json(fail('VALIDATION','Invalid badge',parsed.error.flatten()));
  const admin=(req as any).user; const next=await badgeService.set(parsed.data, admin.id); res.json(ok(next));
});
export default r;
