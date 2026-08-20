import { View, Text, Pressable, Image } from 'react-native';
import type { Message } from '../lib/types';
import { COLORS } from '../lib/constants';
export function ChatBubble({m,isMe,onReply}:{m:Message;isMe:boolean;onReply?:()=>void}){
  const thumb = (m as any).thumbnailUrl || m.mediaUrl;
  return (<Pressable onLongPress={onReply} style={{alignSelf:isMe?'flex-end':'flex-start',backgroundColor:isMe?COLORS.primary:'#232334',padding:10,borderRadius:16,marginVertical:4,maxWidth:'78%'}}>
    {m.replyToId && <Text style={{fontSize:11,color:COLORS.muted,marginBottom:4}}>↩ replying</Text>}
    {m.deletedAt? <Text style={{color:COLORS.muted,fontStyle:'italic'}}>Message deleted</Text> : m.text ? <Text style={{color:'#fff'}}>{m.text}{m.editedAt?' (edited)':''}</Text> : null}
    {m.mediaUrl && !m.deletedAt && (
      <View style={{marginTop: m.text?6:0, borderRadius:10, overflow:'hidden'}}>
        {m.mediaType==='video' ? (
          <Text style={{color:'#A5B4FC',fontSize:12}}>▶ video: {m.mediaUrl}</Text>
        ) : (
          <Image source={{uri: thumb}} style={{width:180, height:180, borderRadius:10, backgroundColor:'#111'}} resizeMode="cover" />
        )}
        {m.public_id && <Text style={{color:COLORS.muted,fontSize:9,marginTop:4}} numberOfLines={1}>{m.public_id}</Text>}
      </View>
    )}
    <View style={{flexDirection:'row',gap:6,marginTop:4}}>{m.reactions.map((r,i)=><Text key={i} style={{fontSize:12}}>{r.emoji}</Text>)}</View>
    <Text style={{fontSize:10,color:isMe?'#DDD':COLORS.muted,marginTop:4}}>{new Date(m.createdAt).toLocaleTimeString()} {m.seenBy.length>0?'✓✓':m.deliveredTo.length>0?'✓✓':'✓'}</Text>
  </Pressable>);
}
