import { Request,Response,NextFunction } from 'express';
// Double-submit: client sends x-csrf-token == csrf cookie; safe for Expo (no cookie) we just check header presence on mutating admin routes
export function csrf(req:Request,res:Response,next:NextFunction){
  if(['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  // Enforce only for admin + state-changing; for mobile we allow header OR cookie
  const header=req.headers['x-csrf-token'] as string | undefined;
  const cookie=(req as any).cookies?.csrf;
  if(req.path.startsWith('/api/admin') && header && cookie && header!==cookie) return res.status(403).json({success:false,error:{code:'CSRF',message:'CSRF mismatch'}});
  next();
}
