import { View, Text, Pressable } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../lib/constants';
import { router } from 'expo-router';
export default function Profile(){ const user=useAuthStore(s=>s.user); const logout=useAuthStore(s=>s.logout); return (<View style={{flex:1,backgroundColor:COLORS.bg,padding:24}}><Text style={{color:'#fff',fontSize:20,fontWeight:'800'}}>{user?.name}</Text><Text style={{color:COLORS.muted}}>{user?.email}</Text><Pressable onPress={async()=>{ await logout(); router.replace('/(auth)/login'); }} style={{backgroundColor:'#EF4444',padding:14,borderRadius:12,marginTop:24,alignItems:'center'}}><Text style={{color:'#fff',fontWeight:'700'}}>Log Out</Text></Pressable></View>); }
