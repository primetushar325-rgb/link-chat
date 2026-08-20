import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPush } from '../lib/notifications';
export function usePushNotifications(enabled:boolean){
  useEffect(()=>{ if(!enabled) return; registerForPush(); const sub=Notifications.addNotificationReceivedListener(n=> console.log('push',n)); return ()=> sub.remove(); },[enabled]);
}
