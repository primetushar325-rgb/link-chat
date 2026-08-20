import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { View, ActivityIndicator } from 'react-native';
export default function Index(){ const user=useAuthStore(s=>s.user); if(user===null) return <View style={{flex:1,backgroundColor:'#0A0A0F',justifyContent:'center',alignItems:'center'}}><ActivityIndicator color="#6C5CE7" /></View>; return user ? <Redirect href="/(tabs)/chats" /> : <Redirect href="/(auth)/login" />; }
