import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { createFileStore } from '../db/fileStore.js';
import { ok, fail } from '../lib/response.js';
import { messageSchema } from '../lib/validators.js';
const r=Router(); const db=createFileStore();

r.use(authenticate);
r.get('/', async(req,res)=>{ const u=(req as any).user; const list=await db.conversations.listForUser(u.id); res.json(ok(list)); });
r.post('/', async(req,res)=>{
  const u=(req as any).user; const {participantIds, isGroup, name}=req.body;
  if(!Array.isArray(participantIds)||participantIds.length===0) return res.status(400).json(fail('VALIDATION','participantIds required'));
  const ids=[...new Set([u.id, ...participantIds])];
  const conv={id:uuid(), isGroup:!!isGroup, name: name||null, participantIds:ids, createdAt:new Date().toISOString(), lastMessageAt:null};
  await db.conversations.create(conv); res.json(ok(conv));
});
r.get('/:id/messages', async(req,res)=>{
  const {id}=req.params; const {cursor,limit}=req.query;
  const conv=await db.conversations.findById(id); if(!conv) return res.status(404).json(fail('NOT_FOUND','Conversation not found'));
  const u=(req as any).user; if(!conv.participantIds.includes(u.id) && u.role!=='admin') return res.status(403).json(fail('FORBIDDEN','Not a participant'));
  const msgs=await db.messages.list(id, cursor as string, Number(limit)||50); res.json(ok(msgs));
});
r.post('/:id/messages', async(req,res)=>{
  const {id}=req.params; const parsed=messageSchema.safeParse(req.body); if(!parsed.success) return res.status(400).json(fail('VALIDATION','Invalid message',parsed.error.flatten()));
  const conv=await db.conversations.findById(id); if(!conv) return res.status(404).json(fail('NOT_FOUND','Conversation not found'));
  const u=(req as any).user;
  const msg={id:uuid(), conversationId:id, senderId:u.id, ...parsed.data, createdAt:new Date().toISOString(), reactions:[], seenBy:[], deliveredTo:[], editedAt:null, deletedAt:null};
  await db.messages.create(msg);
  // update lastMessageAt (fileStore doesn't have update for conv; patch in place)
  // broadcast via WS is handled by WS server polling or direct emit if imported; for now client will refetch via WS event stub
  res.json(ok(msg));
  // try to push via WS (fire-and-forget)
  try{ const { broadcastToConversation } = await import('../ws/server.js'); broadcastToConversation(id, {type:'message:new', payload:msg}); }catch{}
});
r.patch('/messages/:messageId', async(req,res)=>{
  const u=(req as any).user; const m=await db.messages.findById(req.params.messageId); if(!m) return res.status(404).json(fail('NOT_FOUND','Message not found'));
  if(m.senderId!==u.id) return res.status(403).json(fail('FORBIDDEN','Not owner'));
  const {text}=req.body; const updated=await db.messages.update(m.id,{text, editedAt:new Date().toISOString()}); res.json(ok(updated));
  try{ const { broadcastToConversation } = await import('../ws/server.js'); broadcastToConversation(updated.conversationId,{type:'message:edit',payload:updated}); }catch{}
});
r.delete('/messages/:messageId', async(req,res)=>{
  const u=(req as any).user; const m=await db.messages.findById(req.params.messageId); if(!m) return res.status(404).json(fail('NOT_FOUND','Message not found'));
  if(m.senderId!==u.id && u.role!=='admin') return res.status(403).json(fail('FORBIDDEN','Not owner'));
  const updated=await db.messages.update(m.id,{deletedAt:new Date().toISOString()}); res.json(ok(updated));
  try{ const { broadcastToConversation } = await import('../ws/server.js'); broadcastToConversation(updated.conversationId,{type:'message:delete',payload:updated}); }catch{}
});
r.post('/:id/reactions', async(req,res)=>{
  const u=(req as any).user; const {messageId, emoji}=req.body; const m=await db.messages.findById(messageId); if(!m) return res.status(404).json(fail('NOT_FOUND','Message not found'));
  const existing=m.reactions.find((r:any)=> r.userId===u.id && r.emoji===emoji);
  let reactions; if(existing) reactions=m.reactions.filter((r:any)=> !(r.userId===u.id && r.emoji===emoji)); else reactions=[...m.reactions,{emoji,userId:u.id,createdAt:new Date().toISOString()}];
  const updated=await db.messages.update(m.id,{reactions}); res.json(ok(updated));
});
r.post('/:id/read', async(req,res)=>{
  const u=(req as any).user; const {messageId}=req.body; const m=await db.messages.findById(messageId); if(!m) return res.status(404).json(fail('NOT_FOUND','Message not found'));
  const seenBy=[...new Set([...(m.seenBy||[]), u.id])]; const updated=await db.messages.update(m.id,{seenBy}); res.json(ok(updated));
});
export default r;
