import { View, Text, FlatList, Image, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { COLORS } from '../../lib/constants';
import type { Story } from '../../lib/types';
import { Link } from 'expo-router';
export default function Stories(){
  const {data}=useQuery({queryKey:['stories'],queryFn:async()=>{ const r=await api.get<Story[]>('/api/stories/feed'); return r.data||[]; }});
  return (<View style={{flex:1,backgroundColor:COLORS.bg,padding:16}}>
    <Text style={{color:'#fff',fontSize:20,fontWeight:'800',marginBottom:12}}>Stories (24h)</Text>
    <FlatList horizontal data={data} keyExtractor={i=>i.id} renderItem={({item})=> <Link href={`/story/${item.id}`} asChild><Pressable style={{marginRight:12,alignItems:'center'}}><View style={{width:64,height:64,borderRadius:32,borderWidth:2,borderColor:COLORS.primary,overflow:'hidden',backgroundColor:COLORS.card,justifyContent:'center',alignItems:'center'}}>{item.mediaUrl? <Image source={{uri:item.mediaUrl}} style={{width:64,height:64}}/> : <Text style={{color:'#fff'}}>{item.text?.slice(0,2)}</Text>}</View><Text style={{color:COLORS.muted,fontSize:12,marginTop:4}}>{item.userId.slice(0,6)}</Text></Pressable></Link>} />
  </View>);
}
