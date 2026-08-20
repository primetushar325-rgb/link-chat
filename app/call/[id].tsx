import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../lib/constants';
import { useWebSocket } from '../../hooks/useWebSocket';
// Note: react-native-webrtc requires native build; stub UI for Expo Go + EAS build
export default function CallScreen(){
  const {id}=useLocalSearchParams<{id:string}>(); const {send}=useWebSocket(true); const [status,setStatus]=useState('Ready');
  const startCall=()=>{ setStatus('Calling…'); send('call:offer',{conversationId:id,sdp:'stub-offer'}); };
  return (<View style={{flex:1,backgroundColor:COLORS.bg,justifyContent:'center',alignItems:'center',padding:24}}><Text style={{color:'#fff',fontSize:20,fontWeight:'800'}}>Voice Call</Text><Text style={{color:COLORS.muted,marginTop:8}}>{status}</Text><Text style={{color:COLORS.muted,marginTop:4,fontSize:12}}>Conversation: {id}</Text><Pressable onPress={startCall} style={{backgroundColor:COLORS.primary,padding:16,borderRadius:30,marginTop:24}}><Text style={{color:'#fff'}}>📞 Start WebRTC Call</Text></Pressable><Text style={{color:'#6B7280',fontSize:12,marginTop:16,textAlign:'center'}}>WebRTC via react-native-webrtc + WS signaling (offer/answer/ice). Requires EAS dev build.</Text></View>);
}
