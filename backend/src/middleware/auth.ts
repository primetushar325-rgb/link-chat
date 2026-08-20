import { Request,Response,NextFunction } from 'express';
import { verifyAccess } from '../lib/jwt.js';
export function authenticate(req:Request,res:Response,next:NextFunction){
  const h=req.headers.authorization; if(!h?.startsWith('Bearer ')) return res.status(401).json({success:false,error:{code:'UNAUTHORIZED',message:'Missing token'}});
  try{ (req as any).user=verifyAccess(h.slice(7)); next(); }catch{ return res.status(401).json({success:false,error:{code:'UNAUTHORIZED',message:'Invalid token'}}); }
}
export function requireAdmin(req:Request,res:Response,next:NextFunction){
  const u=(req as any).user; if(u?.role!=='admin') return res.status(403).json({success:false,error:{code:'FORBIDDEN',message:'Admin only'}}); next();
}
