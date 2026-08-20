import { create } from 'zustand';
import type { User, AppBadge } from '../lib/types';
import { api } from '../lib/api';
import { saveAuth, clearAuth } from '../lib/auth';

type State = { user: User|null; badge: AppBadge|null; loading:boolean; login:(email:string,password:string)=>Promise<void>; loginGoogle:(idToken:string)=>Promise<void>; register:(name:string,email:string,password:string)=>Promise<void>; logout:()=>Promise<void>; fetchBadge:()=>Promise<void>; fetchMe:()=>Promise<void>; };

export const useAuthStore = create<State>((set)=>({
  user: null, badge: null, loading:false,
  login: async(email,password)=>{ set({loading:true}); const res=await api.post<{user:User;accessToken:string;refreshToken:string}>('/api/auth/login',{email,password}); if(!res.success||!res.data) throw new Error(res.error?.message||'Login failed'); await saveAuth(res.data.accessToken,res.data.refreshToken); set({user:res.data.user, loading:false}); },
  loginGoogle: async(idToken)=>{ set({loading:true}); const res=await api.post<{user:User;accessToken:string;refreshToken:string}>('/api/auth/google',{idToken}); if(!res.success||!res.data) throw new Error(res.error?.message||'Google login failed'); await saveAuth(res.data.accessToken,res.data.refreshToken); set({user:res.data.user, loading:false}); },
  register: async(name,email,password)=>{ set({loading:true}); const res=await api.post<{user:User;accessToken:string;refreshToken:string}>('/api/auth/register',{name,email,password}); if(!res.success||!res.data) throw new Error(res.error?.message||'Register failed'); await saveAuth(res.data.accessToken,res.data.refreshToken); set({user:res.data.user, loading:false}); },
  logout: async()=>{ await clearAuth(); set({user:null}); await api.post('/api/auth/logout',{}).catch(()=>{}); },
  fetchBadge: async()=>{ const res=await api.get<AppBadge>('/api/settings/badge'); if(res.success&&res.data) set({badge:res.data}); },
  fetchMe: async()=>{ const res=await api.get<User>('/api/me'); if(res.success&&res.data) set({user:res.data}); }
}));
