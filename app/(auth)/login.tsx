import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../lib/constants';
import { HeaderLogo } from '../../components/HeaderLogo';

// Required for web auth to complete in Expo
WebBrowser.maybeCompleteAuthSession();

export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const login=useAuthStore(s=>s.login); const loginGoogle=useAuthStore(s=>s.loginGoogle);
  const [googleLoading,setGoogleLoading]=useState(false);

  // Google OAuth — useIdTokenAuthRequest gives id_token directly (no code exchange)
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
    // Expo Go uses proxy; EAS Build uses scheme "link://"
    redirectUri: makeRedirectUri({ useProxy: true } as any),
  });

  useEffect(()=>{
    if(response?.type === 'success'){
      const id_token = (response.params as any).id_token;
      if(id_token){
        setGoogleLoading(true);
        loginGoogle(id_token)
          .then(()=> router.replace('/(tabs)/chats'))
          .catch((e:any)=> Alert.alert('Google login failed', e.message || String(e)))
          .finally(()=> setGoogleLoading(false));
      }
    } else if(response?.type === 'error'){
      Alert.alert('Google login error', (response as any).error?.message || 'Cancelled');
    }
  },[response]);

  const onGoogle = async()=>{
    if(!request) { Alert.alert('Google', 'Google request not ready yet'); return; }
    try{
      await promptAsync();
    }catch(e:any){
      Alert.alert('Google', e.message);
    }
  };

  return (<View style={{flex:1,backgroundColor:COLORS.bg,padding:24,justifyContent:'center'}}>
    <HeaderLogo/><Text style={{color:'#fff',fontSize:28,fontWeight:'800',marginTop:16}}>Welcome to LINK</Text>
    <Text style={{color:COLORS.muted,marginTop:4,fontSize:12}}>Redirect: {makeRedirectUri({ useProxy: true } as any)}</Text>
    <TextInput placeholder="Email" placeholderTextColor="#6B7280" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{backgroundColor:COLORS.card,color:'#fff',padding:14,borderRadius:12,marginTop:24}}/>
    <TextInput placeholder="Password" placeholderTextColor="#6B7280" value={password} onChangeText={setPassword} secureTextEntry style={{backgroundColor:COLORS.card,color:'#fff',padding:14,borderRadius:12,marginTop:12}}/>
    <Pressable onPress={async()=>{ try{ await login(email,password); router.replace('/(tabs)/chats'); }catch(e:any){ Alert.alert('Login failed',e.message);} }} style={{backgroundColor:COLORS.primary,padding:16,borderRadius:12,marginTop:16,alignItems:'center'}}><Text style={{color:'#fff',fontWeight:'700'}}>Log In</Text></Pressable>

    {/* Divider */}
    <View style={{flexDirection:'row',alignItems:'center',marginTop:16, gap:12}}>
      <View style={{flex:1,height:1,backgroundColor:'#232334'}}/>
      <Text style={{color:COLORS.muted}}>or</Text>
      <View style={{flex:1,height:1,backgroundColor:'#232334'}}/>
    </View>

    {/* Continue with Google — primary requirement */}
    <Pressable onPress={onGoogle} disabled={!request || googleLoading} style={{backgroundColor:'#fff',padding:16,borderRadius:12,marginTop:16,alignItems:'center', flexDirection:'row', justifyContent:'center', gap:10, opacity: (!request || googleLoading)?0.6:1}}>
      {googleLoading ? <ActivityIndicator color="#000"/> : <Text style={{fontSize:18}}>G</Text>}
      <Text style={{fontWeight:'700',color:'#000'}}>{googleLoading ? 'Signing in...' : 'Continue with Google'}</Text>
    </Pressable>
    <Text style={{color:COLORS.muted,fontSize:11,marginTop:8,textAlign:'center'}}>Uses same app JWT as email/password — unified session</Text>

    <Link href="/(auth)/register" style={{color:COLORS.muted,marginTop:16,textAlign:'center'}}>No account? Create one</Link>
  </View>);
}
