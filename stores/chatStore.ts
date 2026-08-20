import { create } from 'zustand';
import type { Message, Conversation } from '../lib/types';
type State = { conversations: Conversation[]; messages: Record<string, Message[]>; typing: Record<string,string[]>; setConversations:(c:Conversation[])=>void; upsertMessage:(m:Message)=>void; setTyping:(cid:string, userIds:string[])=>void; };
export const useChatStore = create<State>((set)=>({
  conversations:[], messages:{}, typing:{},
  setConversations:(c)=>set({conversations:c}),
  upsertMessage:(m)=>set(s=>{ const arr=s.messages[m.conversationId]||[]; const idx=arr.findIndex(x=>x.id===m.id); const next=idx>=0? arr.map(x=>x.id===m.id?m:x) : [...arr,m].sort((a,b)=>+new Date(a.createdAt)-+new Date(b.createdAt)); return { messages:{...s.messages, [m.conversationId]:next}};}),
  setTyping:(cid,userIds)=>set(s=>({typing:{...s.typing,[cid]:userIds}}))
}));
