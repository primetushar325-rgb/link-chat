import { createFileStore } from '../db/fileStore.js';
const db=createFileStore();
export const badgeService={
  get:()=> db.settings.getBadge(),
  set:async(b:any, adminId:string)=>{ const next={...b, updatedAt:new Date().toISOString(), updatedBy:adminId}; return db.settings.setBadge(next); }
};
