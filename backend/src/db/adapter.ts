// Adapter interface so file store can be swapped for hosted SQL (Prisma/Drizzle) without changing services
export type DbAdapter = {
  users: { findByEmail(email:string):Promise<any>; findById(id:string):Promise<any>; create(u:any):Promise<any>; list():Promise<any[]>; update(id:string,patch:any):Promise<any>; };
  conversations: { listForUser(userId:string):Promise<any[]>; findById(id:string):Promise<any>; create(c:any):Promise<any>; };
  messages: { list(conversationId:string, cursor?:string, limit?:number):Promise<any[]>; create(m:any):Promise<any>; findById(id:string):Promise<any>; update(id:string,patch:any):Promise<any>; };
  stories: { feedForUser(userId:string):Promise<any[]>; findById(id:string):Promise<any>; create(s:any):Promise<any>; addView(id:string, viewerId:string):Promise<any>; purgeExpired():Promise<number>; };
  settings: { getBadge():Promise<any>; setBadge(b:any):Promise<any>; };
  friends: { requestsFor(userId:string):Promise<any[]>; list(userId:string):Promise<any[]>; upsert(a:string,b:string,status:string):Promise<any>; find(a:string,b:string):Promise<any>; };
  auditLogs: { create(log:any):Promise<any>; list():Promise<any[]>; };
  reports: { list():Promise<any[]>; create(r:any):Promise<any>; };
}
