'use client';
import { useEffect, useState } from 'react';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export default function Badge(){
  const [badge,setBadge]=useState({imageUrl:'',linkUrl:'',enabled:false});
  const [token,setToken]=useState(''); const [file,setFile]=useState<File|null>(null); const [uploading,setUploading]=useState(false);
  useEffect(()=>{ setToken(localStorage.getItem('adminToken')||''); fetch(`${API}/api/settings/badge`).then(r=>r.json()).then(j=>{ if(j.success) setBadge(j.data); }); },[]);
  const uploadAndSave=async()=>{
    setUploading(true);
    let imageUrl=badge.imageUrl;
    if(file){
      const t=token||localStorage.getItem('adminToken')||'';
      // Cloudinary server-side upload via multipart
      const form=new FormData(); form.append('file', file);
      const up=await fetch(`${API}/api/media/upload`,{method:'POST',headers:{Authorization:`Bearer ${t}`} as any, body: form as any}).then(r=>r.json());
      if(up.success){ imageUrl = up.data.secure_url; }
      else { alert(up.error?.message||'Cloudinary upload failed'); setUploading(false); return; }
    }
    const r=await fetch(`${API}/api/admin/settings/badge`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token||localStorage.getItem('adminToken')||''}`},body:JSON.stringify({...badge,imageUrl})});
    const j=await r.json(); if(j.success){ setBadge(j.data); alert('Badge saved — app will fetch on next launch (no rebuild needed). Cloudinary URL: '+j.data.imageUrl); } else alert(j.error?.message||'save failed');
    setUploading(false);
  };
  return (<div style={{maxWidth:560}}><h2>App Badge (Chat header) — Cloudinary</h2><p style={{color:'#9CA3AF'}}>Uploads go to Cloudinary (folder link/media). Badge appears next to avatar.</p>
    {badge.imageUrl && <img src={badge.imageUrl} alt="badge" style={{width:64,height:64,borderRadius:12,marginTop:12,objectFit:'cover',border:'1px solid #2A2A3A'}}/>}
    <label style={{display:'block',marginTop:12}}>Badge Image<input type="file" accept="image/*" onChange={e=> setFile(e.target.files?.[0]||null)} style={{display:'block',marginTop:8}}/></label>
    <input value={badge.imageUrl} onChange={e=>setBadge({...badge,imageUrl:e.target.value})} placeholder="https://res.cloudinary.com/... (auto-filled after upload)" style={input}/>
    <input value={badge.linkUrl} onChange={e=>setBadge({...badge,linkUrl:e.target.value})} placeholder="https://promo.example.com" style={input}/>
    <label style={{display:'flex',gap:8,alignItems:'center',marginTop:12}}><input type="checkbox" checked={badge.enabled} onChange={e=>setBadge({...badge,enabled:e.target.checked})} /> Enabled</label>
    <button onClick={uploadAndSave} disabled={uploading} style={{marginTop:16,background:'#6C5CE7',color:'#fff',padding:'12px 16px',borderRadius:8,border:0,cursor:'pointer', opacity: uploading?0.6:1}}>{uploading?'Uploading to Cloudinary...':'Save Badge'}</button>
    <pre style={{background:'#1A1A23',padding:12,borderRadius:8,marginTop:16,overflow:'auto'}}>{JSON.stringify(badge,null,2)}</pre>
  </div>);
}
const input={width:'100%',padding:12,borderRadius:8,background:'#1A1A23',color:'#fff',border:'1px solid #2A2A3A',marginTop:12} as any;
