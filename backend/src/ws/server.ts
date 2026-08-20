import { WebSocketServer, WebSocket } from 'ws';
import { verifyAccess } from '../lib/jwt.js';
type Client = { ws:WebSocket; userId:string; conversationIds:Set<string>; };
const clients=new Set<Client>();

export function broadcastToConversation(conversationId:string, payload:any){
  const msg=JSON.stringify(payload);
  for(const c of clients){ if(c.conversationIds.has(conversationId)) try{ c.ws.send(msg);}catch{} }
}
export function createWsServer(port:number){
  const wss=new WebSocketServer({port});
  wss.on('connection',(ws,req)=>{
    const url=new URL(req.url||'/', `http://${req.headers.host}`);
    const ticket=url.searchParams.get('ticket');
    if(!ticket){ ws.close(4401,'Missing ticket'); return; }
    let payload:any; try{ payload=verifyAccess(ticket);}catch{ ws.close(4401,'Invalid ticket'); return; }
    const userId=payload.id;
    const client:Client={ws,userId,conversationIds:new Set()};
    clients.add(client);
    // auto-join all conversations of user (lazy: client sends join)
    ws.on('message', (raw)=>{
      try{
        const msg=JSON.parse(raw.toString());
        if(msg.type==='join' && msg.payload?.conversationId) client.conversationIds.add(msg.payload.conversationId);
        if(msg.type==='leave' && msg.payload?.conversationId) client.conversationIds.delete(msg.payload.conversationId);
        // typing relay
        if(msg.type==='typing:start' || msg.type==='typing:stop'){
          // broadcast typing to others in same conv
          const cid=msg.payload.conversationId;
          const others=[...clients].filter(c=> c.conversationIds.has(cid) && c.userId!==userId).map(c=>c.userId);
          // We broadcast a simplified typing event; client tracks userIds
          for(const c of clients){ if(c.conversationIds.has(cid)) c.ws.send(JSON.stringify({type:'typing', payload:{conversationId:cid, userIds: msg.type==='typing:start'? [userId]: []}}));}
        }
        if(msg.type==='call:offer' || msg.type==='call:answer' || msg.type==='call:ice'){
          const cid=msg.payload.conversationId;
          for(const c of clients){ if(c.conversationIds.has(cid) && c.userId!==userId) c.ws.send(JSON.stringify({type:msg.type, payload:{...msg.payload, from:userId}}));}
        }
      }catch{}
    });
    ws.on('close',()=> clients.delete(client));
    ws.send(JSON.stringify({type:'connected', payload:{userId}}));
  });
  console.log(`[ws] listening on :${port}`);
  return wss;
}
