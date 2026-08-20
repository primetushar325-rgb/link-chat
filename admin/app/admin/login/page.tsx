'use client';
import { useState } from 'react';
export default function Login(){
  const [email,setEmail]=useState('admin@link.app'); const [password,setPassword]=useState('Admin123!'); const [token,setToken]=useState('');
  const submit=async()=>{
    const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000'}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const j=await r.json(); if(j.success){ setToken(j.data.accessToken); localStorage.setItem('adminToken', j.data.accessToken); alert('Logged in, token saved'); } else alert(j.error?.message||'failed');
  };
  return (<div style={{maxWidth:420}}><h2>Admin Login</h2><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" style={s.input}/><input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" style={s.input}/><button onClick={submit} style={s.btn}>Login</button>{token && <p style={{wordBreak:'break-all',background:'#1A1A23',padding:12,borderRadius:8}}>{token}</p>}</div>);
}
const s={input:{width:'100%',padding:12,borderRadius:8,background:'#1A1A23',color:'#fff',border:'1px solid #2A2A3A',marginTop:12} as any, btn:{background:'#6C5CE7',color:'#fff',padding:'12px 16px',borderRadius:8,border:0,marginTop:12,cursor:'pointer'} as any};
