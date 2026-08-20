import { useEffect, useRef } from 'react';
import { WS_URL } from '../lib/constants';
import { api } from '../lib/api';
import { useChatStore } from '../stores/chatStore';

export function useWebSocket(enabled:boolean){
  const wsRef=useRef<WebSocket|null>(null);
  const upsert=useChatStore(s=>s.upsertMessage);
  const setTyping=useChatStore(s=>s.setTyping);
  useEffect(()=>{
    if(!enabled) return;
    let closed=false;
    (async()=>{
      const t=await api.post<{ticket:string}>('/api/ws/ticket',{}); if(!t.success||!t.data) return;
      const ws=new WebSocket(`${WS_URL}?ticket=${t.data.ticket}`);
      wsRef.current=ws;
      ws.onmessage=(ev)=>{ try{ const msg=JSON.parse(ev.data); if(msg.type==='message:new') upsert(msg.payload); if(msg.type==='typing') setTyping(msg.payload.conversationId, msg.payload.userIds); if(msg.type==='message:edit'||msg.type==='message:delete') upsert(msg.payload);}catch{} };
      ws.onclose=()=>{ if(!closed) setTimeout(()=>{},2000); };
    })();
    return()=>{ closed=true; wsRef.current?.close(); };
  },[enabled]);
  const send=(type:string,payload:any)=> wsRef.current?.send(JSON.stringify({type,payload}));
  return { send };
}
