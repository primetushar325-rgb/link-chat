import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useChatStore } from '../../stores/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { COLORS } from '../../lib/constants';
import type { Conversation } from '../../lib/types';
export default function Chats(){
  const setConvs=useChatStore(s=>s.setConversations); const convs=useChatStore(s=>s.conversations);
  useWebSocket(true);
  const {refetch, isRefetching}=useQuery({queryKey:['convs'],queryFn:async()=>{ const r=await api.get<Conversation[]>('/api/conversations'); if(r.success&&r.data){ setConvs(r.data); return r.data;} return []; }});
  return (<View style={{flex:1,backgroundColor:COLORS.bg}}>
    <FlatList data={convs} keyExtractor={i=>i.id} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />} ListEmptyComponent={<Text style={{color:COLORS.muted,textAlign:'center',marginTop:40}}>No chats yet — start a conversation!</Text>} renderItem={({item})=>
      <Link href={`/chat/${item.id}`} asChild><Pressable style={{padding:16,flexDirection:'row',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#1F2937'}}><Text style={{color:'#fff',fontWeight:'600'}}>{item.isGroup? item.name : item.participantIds.join(', ')}</Text><Text style={{color:COLORS.muted,fontSize:12}}>{item.lastMessageAt? new Date(item.lastMessageAt).toLocaleTimeString():''}</Text></Pressable></Link>
    } />
  </View>);
}
