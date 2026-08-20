'use client';
import { useEffect, useState } from 'react';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export default function Users(){
  const [users,setUsers]=useState<any[]>([]); const [token,setToken]=useState('');
  useEffect(()=>{ setToken(localStorage.getItem('adminToken')||''); },[]);
  const load=async()=>{ const r=await fetch(`${API}/api/admin/users`,{headers:{Authorization:`Bearer ${token||localStorage.getItem('adminToken')}`}}); const j=await r.json(); if(j.success) setUsers(j.data); };
  useEffect(()=>{ if(token) load(); },[token]);
  const setStatus=async(id:string,status:string)=>{ await fetch(`${API}/api/admin/users/${id}/status`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({status})}); load(); };
  return (<div><h2>Users</h2><button onClick={load} style={btn}>Refresh</button><table style={{width:'100%',marginTop:16,borderCollapse:'collapse'}}><thead><tr style={{textAlign:'left',color:'#9CA3AF'}}><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{users.map(u=> <tr key={u.id} style={{borderTop:'1px solid #1F2937'}}><td>{u.email}</td><td>{u.name}</td><td>{u.role}</td><td>{u.status}</td><td style={{display:'flex',gap:8,padding:8}}><button onClick={()=>setStatus(u.id,'active')} style={btn}>Active</button><button onClick={()=>setStatus(u.id,'suspended')} style={{...btn,background:'#F59E0B'}}>Suspend</button><button onClick={()=>setStatus(u.id,'banned')} style={{...btn,background:'#EF4444'}}>Ban</button></td></tr>)}</tbody></table></div>);
}
const btn={background:'#6C5CE7',color:'#fff',padding:'6px 10px',borderRadius:6,border:0,cursor:'pointer'} as any;
