import jwt from 'jsonwebtoken';
const SECRET=process.env.JWT_SECRET||'dev-secret-replace-in-prod-please-64-chars';
const REFRESH_SECRET=process.env.JWT_REFRESH_SECRET||'dev-refresh-secret-replace';
export function signAccess(payload:object){ return jwt.sign(payload, SECRET, {expiresIn:'15m'}); }
export function signRefresh(payload:object){ return jwt.sign(payload, REFRESH_SECRET, {expiresIn:'7d'}); }
export function verifyAccess(token:string){ return jwt.verify(token, SECRET) as any; }
export function verifyRefresh(token:string){ return jwt.verify(token, REFRESH_SECRET) as any; }
export function signTicket(payload:object){ return jwt.sign(payload, SECRET, {expiresIn:'60s'}); }
