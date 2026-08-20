import { View, Text } from 'react-native';
import { COLORS } from '../../lib/constants';
import { HeaderLogo } from '../../components/HeaderLogo';
export default function Home(){ return (<View style={{flex:1,backgroundColor:COLORS.bg,padding:24}}><HeaderLogo/><Text style={{color:'#fff',fontSize:22,fontWeight:'800',marginTop:16}}>LINK — Stay Connected</Text><Text style={{color:COLORS.muted,marginTop:8}}>Realtime chat, stories, voice & video calls.</Text></View>); }
