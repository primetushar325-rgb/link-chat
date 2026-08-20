'use client';
import { useEffect, useState } from 'react';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export default function Reports(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{ const t=localStorage.getItem('adminToken')||''; fetch(`${API}/api/admin/reports`,{headers:{Authorization:`Bearer ${t}`}}).then(r=>r.json()).then(j=>{ if(j.success) setItems(j.data); }); },[]);
  return (<div><h2>Reports Queue</h2><p style={{color:'#9CA3AF'}}>User reports for moderation.</p><pre style={{background:'#1A1A23',padding:12,borderRadius:8}}>{JSON.stringify(items,null,2)}</pre></div>);
}
