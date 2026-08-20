import { View, Text, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { COLORS } from '../../lib/constants';
export default function StoryView(){ const {id}=useLocalSearchParams<{id:string}>(); const {data}=useQuery({queryKey:['story',id],queryFn:async()=>{ const r=await api.get<any>(`/api/stories/${id}`); if(r.data) api.post(`/api/stories/${id}/view`,{}); return r.data; }}); if(!data) return null; return (<View style={{flex:1,backgroundColor:'#000',justifyContent:'center',alignItems:'center'}}>{data.mediaUrl? <Image source={{uri:data.mediaUrl}} style={{width:'100%',height:'100%'}} resizeMode="contain"/> : <Text style={{color:'#fff',fontSize:24}}>{data.text}</Text>}<Text style={{position:'absolute',bottom:40,color:COLORS.muted}}>Views: {data.views?.length||0}</Text></View>); }
