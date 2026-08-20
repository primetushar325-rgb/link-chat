import { View, Text, FlatList, TextInput, Pressable, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useChatStore } from '../../stores/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../stores/authStore';
import { ChatBubble } from '../../components/ChatBubble';
import { BadgeIcon } from '../../components/BadgeIcon';
import { COLORS, API_URL } from '../../lib/constants';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';

export default function ChatScreen(){
  const {id}=useLocalSearchParams<{id:string}>(); const user=useAuthStore(s=>s.user);
  const msgs=useChatStore(s=>s.messages[id as string]||[]); const upsert=useChatStore(s=>s.upsertMessage); const typing=useChatStore(s=>s.typing[id as string]||[]);
  const {send}=useWebSocket(true);
  const [text,setText]=useState(''); const [replyTo,setReplyTo]=useState<string|undefined>();
  useQuery({queryKey:['messages',id],queryFn:async()=>{ const r=await api.get<any[]>(`/api/conversations/${id}/messages`); (r.data||[]).forEach(upsert); return r.data; }});
  const onSend=async()=>{ if(!text.trim()) return; const r=await api.post<any>(`/api/conversations/${id}/messages`,{text,replyToId:replyTo}); if(r.success&&r.data) upsert(r.data); setText(''); setReplyTo(undefined); };
  const pickImage=async()=>{
    const res=await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.All, base64:true});
    if(!res.canceled){
      const asset=res.assets[0];
      // Upload via Cloudinary signed server endpoint
      const token=await SecureStore.getItemAsync('accessToken');
      const form=new FormData();
      // Use base64 dataUri for Cloudinary server upload to avoid native file complexities
      if(asset.base64){
        const dataUri=`data:${asset.mimeType||'image/jpeg'};base64,${asset.base64}`;
        const r=await fetch(`${API_URL}/api/media/upload`,{
          method:'POST',
          headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
          body: JSON.stringify({ dataUri, conversationId: id, text: '' })
        });
        const j=await r.json();
        if(j.success && j.data?.message) upsert(j.data.message);
        else if(j.success && j.data?.secure_url){
          // fallback if message not auto-created
          const msgRes=await api.post<any>(`/api/media/confirm`,{ conversationId: id, secure_url: j.data.secure_url, public_id: j.data.public_id, thumbnailUrl: j.data.thumbnailUrl, resourceType: j.data.resource_type });
          if(msgRes.success) upsert(msgRes.data);
        }
      } else {
        // fallback: multipart
        const uriParts=asset.uri.split('.'); const ext=uriParts[uriParts.length-1];
        (form as any).append('file', { uri: asset.uri, name: `upload.${ext}`, type: asset.mimeType } as any);
        (form as any).append('conversationId', String(id));
        await fetch(`${API_URL}/api/media/upload`,{ method:'POST', headers:{ Authorization:`Bearer ${token}` } as any, body: form as any });
      }
    }
  };
  const onTyping=(t:string)=>{ setText(t); send('typing:start',{conversationId:id}); };
  return (<View style={{flex:1,backgroundColor:COLORS.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',padding:12,borderBottomWidth:1,borderBottomColor:'#1F2937',backgroundColor:'#0A0A0F'}}>
      <Image source={require('../../assets/images/icon.png')} style={{width:32,height:32,borderRadius:16}} /><Text style={{color:'#fff',fontWeight:'700',marginLeft:8,flex:1}}>Chat {String(id).slice(0,8)}</Text><BadgeIcon />
    </View>
    <FlatList data={msgs} keyExtractor={m=>m.id} contentContainerStyle={{padding:12}} renderItem={({item})=> <ChatBubble m={item} isMe={item.senderId===user?.id} onReply={()=>setReplyTo(item.id)} />} />
    {typing.length>0 && <Text style={{color:COLORS.muted,paddingHorizontal:12,paddingBottom:4}}>{typing.length===1?'typing…':'several typing…'}</Text>}
    {replyTo && <View style={{padding:8,backgroundColor:'#1F2937',flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:COLORS.muted}}>Replying to {replyTo.slice(0,6)}</Text><Pressable onPress={()=>setReplyTo(undefined)}><Text style={{color:COLORS.primary}}>✕</Text></Pressable></View>}
    <View style={{flexDirection:'row',padding:8,gap:8,borderTopWidth:1,borderTopColor:'#1F2937'}}>
      <Pressable onPress={pickImage} style={{padding:12}}><Text>📎</Text></Pressable>
      <TextInput value={text} onChangeText={onTyping} placeholder="Message…" placeholderTextColor="#6B7280" style={{flex:1,backgroundColor:COLORS.card,color:'#fff',padding:12,borderRadius:20}}/>
      <Pressable onPress={onSend} style={{backgroundColor:COLORS.primary,paddingHorizontal:18,borderRadius:20,justifyContent:'center'}}><Text style={{color:'#fff',fontWeight:'700'}}>Send</Text></Pressable>
    </View>
  </View>);
}
