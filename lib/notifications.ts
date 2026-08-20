import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';
Notifications.setNotificationHandler({ handleNotification: async()=>({ shouldShowAlert:true, shouldPlaySound:true, shouldSetBadge:false })});
export async function registerForPush(){
  const perm=await Notifications.requestPermissionsAsync();
  if(!perm.granted) return;
  const token=(await Notifications.getExpoPushTokenAsync()).data;
  await api.post('/api/push/token',{token}).catch(()=>{});
  if(Platform.OS==='android') await Notifications.setNotificationChannelAsync('default',{name:'default',importance:Notifications.AndroidImportance.MAX});
  return token;
}
