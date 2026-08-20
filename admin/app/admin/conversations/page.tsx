'use client';
import { useState } from 'react';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export default function Convs(){
  const [id,setId]=useState(''); const [data,setData]=useState<any>(null);
  const view=async()=>{
    const token=localStorage.getItem('adminToken')||'';
    const r=await fetch(`${API}/api/admin/conversations/${id}`,{headers:{Authorization:`Bearer ${token}`}});
    const j=await r.json(); if(j.success) setData(j.data); else alert(j.error?.message||'failed — every view is audit-logged');
  };
  return (<div><h2>Audit-logged Conversation Review</h2><p style={{color:'#9CA3AF'}}>Every view is logged with timestamp + admin ID. Use only for moderation.</p>
    <div style={{display:'flex',gap:8,marginTop:12}}><input value={id} onChange={e=>setId(e.target.value)} placeholder="Conversation ID" style={{flex:1,padding:12,borderRadius:8,background:'#1A1A23',color:'#fff',border:'1px solid #2A2A3A'}}/><button onClick={view} style={{background:'#6C5CE7',color:'#fff',padding:'10px 16px',borderRadius:8,border:0}}>View (logged)</button></div>
    {data && <div style={{marginTop:16}}><h3>Messages ({data.messages?.length||0})</h3><pre style={{background:'#1A1A23',padding:12,borderRadius:8,overflow:'auto',maxHeight:400}}>{JSON.stringify(data,null,2)}</pre></div>}
  </div>);
}
