import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { createFileStore } from '../db/fileStore.js';
import { ok, fail } from '../lib/response.js';
const r=Router(); const db=createFileStore();
r.use(authenticate, requireAdmin);
r.get('/users', async(_req,res)=>{ const users=await db.users.list(); const safe=users.map(({passwordHash,...u}:any)=>u); res.json(ok(safe)); });
r.patch('/users/:id/status', async(req,res)=>{
  const {status}=req.body; if(!['active','suspended','banned'].includes(status)) return res.status(400).json(fail('VALIDATION','Invalid status'));
  const u=await db.users.update(req.params.id,{status}); if(!u) return res.status(404).json(fail('NOT_FOUND','User not found')); const {passwordHash,...safe}=u; res.json(ok(safe));
});
r.get('/reports', async(_req,res)=>{ const list=await db.reports.list(); res.json(ok(list)); });
r.get('/audit-logs', async(_req,res)=>{ const logs=await db.auditLogs.list(); res.json(ok(logs)); });
// Audit-logged conversation review
r.get('/conversations/:id', async(req,res)=>{
  const admin=(req as any).user;
  const conv=await db.conversations.findById(req.params.id); if(!conv) return res.status(404).json(fail('NOT_FOUND','Conversation not found'));
  await db.auditLogs.create({id:`audit_${Date.now()}`, adminId:admin.id, conversationId:req.params.id, timestamp:new Date().toISOString(), action:'view_conversation'});
  const msgs=await db.messages.list(req.params.id, undefined, 200);
  res.json(ok({conversation:conv, messages:msgs}));
});
export default r;
