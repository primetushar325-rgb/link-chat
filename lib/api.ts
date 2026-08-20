import * as SecureStore from 'expo-secure-store';
import { API_URL } from './constants';
import type { ApiEnvelope } from './types';

async function getToken(){ try{ return await SecureStore.getItemAsync('accessToken'); }catch{ return null; } }

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>>{
  const token = await getToken();
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(init.headers as any || {}) };
  if(token) headers['Authorization'] = `Bearer ${token}`;
  // CSRF double-submit: read from SecureStore if present
  try{ const csrf = await SecureStore.getItemAsync('csrfToken'); if(csrf) headers['x-csrf-token']=csrf; }catch{}
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const json = await res.json().catch(()=>({ success:false, error:{code:'PARSE',message:'Invalid JSON'}}));
  if(!res.ok && !json.error) json.error = { code: String(res.status), message: res.statusText };
  // auto refresh on 401 handled by caller via authStore
  return json as ApiEnvelope<T>;
}
export const api = { get:<T>(p:string)=>apiFetch<T>(p), post:<T>(p:string,b?:any)=>apiFetch<T>(p,{method:'POST',body:JSON.stringify(b)}), patch:<T>(p:string,b?:any)=>apiFetch<T>(p,{method:'PATCH',body:JSON.stringify(b)}), del:<T>(p:string)=>apiFetch<T>(p,{method:'DELETE'}), put:<T>(p:string,b?:any)=>apiFetch<T>(p,{method:'PUT',body:JSON.stringify(b)}) };
