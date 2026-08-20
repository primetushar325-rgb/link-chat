import { Image, Pressable, Linking } from 'react-native';
import { useAuthStore } from '../stores/authStore';
export function BadgeIcon(){ const badge=useAuthStore(s=>s.badge); if(!badge?.enabled||!badge.imageUrl) return null; return (<Pressable onPress={()=> badge.linkUrl && Linking.openURL(badge.linkUrl)}><Image source={{uri: badge.imageUrl}} style={{width:24,height:24,borderRadius:12,marginLeft:8}} /></Pressable>); }
