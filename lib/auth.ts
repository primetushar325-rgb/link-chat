import * as SecureStore from 'expo-secure-store';
export async function saveAuth(accessToken:string, refreshToken:string){ await SecureStore.setItemAsync('accessToken',accessToken); await SecureStore.setItemAsync('refreshToken',refreshToken); }
export async function clearAuth(){ await SecureStore.deleteItemAsync('accessToken'); await SecureStore.deleteItemAsync('refreshToken'); }
export async function getTokens(){ const a=await SecureStore.getItemAsync('accessToken'); const r=await SecureStore.getItemAsync('refreshToken'); return { accessToken:a, refreshToken:r }; }
