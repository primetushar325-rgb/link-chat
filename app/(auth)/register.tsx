import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../lib/constants';
export default function Register(){
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const register=useAuthStore(s=>s.register);
  return (<View style={{flex:1,backgroundColor:COLORS.bg,padding:24,justifyContent:'center'}}>
    <Text style={{color:'#fff',fontSize:28,fontWeight:'800'}}>Create account</Text>
    <TextInput placeholder="Name" placeholderTextColor="#6B7280" value={name} onChangeText={setName} style={{backgroundColor:COLORS.card,color:'#fff',padding:14,borderRadius:12,marginTop:24}}/>
    <TextInput placeholder="Email" placeholderTextColor="#6B7280" value={email} onChangeText={setEmail} autoCapitalize="none" style={{backgroundColor:COLORS.card,color:'#fff',padding:14,borderRadius:12,marginTop:12}}/>
    <TextInput placeholder="Password (min 8)" placeholderTextColor="#6B7280" value={password} onChangeText={setPassword} secureTextEntry style={{backgroundColor:COLORS.card,color:'#fff',padding:14,borderRadius:12,marginTop:12}}/>
    <Pressable onPress={async()=>{ try{ await register(name,email,password); router.replace('/(tabs)/chats'); }catch(e:any){ Alert.alert('Error',e.message);} }} style={{backgroundColor:COLORS.primary,padding:16,borderRadius:12,marginTop:16,alignItems:'center'}}><Text style={{color:'#fff',fontWeight:'700'}}>Sign Up</Text></Pressable>
  </View>);
}
