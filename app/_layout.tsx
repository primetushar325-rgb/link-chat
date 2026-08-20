import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../stores/authStore';
SplashScreen.preventAutoHideAsync();
const qc = new QueryClient();
export default function RootLayout(){
  const fetchMe=useAuthStore(s=>s.fetchMe); const fetchBadge=useAuthStore(s=>s.fetchBadge);
  useEffect(()=>{ fetchMe().finally(()=>SplashScreen.hideAsync()); fetchBadge(); },[]);
  return (<QueryClientProvider client={qc}><Stack screenOptions={{headerStyle:{backgroundColor:'#0A0A0F'},headerTintColor:'#fff'}}><Stack.Screen name="(auth)" options={{headerShown:false}} /><Stack.Screen name="(tabs)" options={{headerShown:false}} /><Stack.Screen name="chat/[id]" options={{title:'Chat'}} /><Stack.Screen name="story/[id]" options={{title:'Story',presentation:'modal'}} /><Stack.Screen name="call/[id]" options={{title:'Call'}} /></Stack></QueryClientProvider>);
}
