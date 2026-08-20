import { Image, View, Text } from 'react-native';
import { COLORS } from '../lib/constants';
export function HeaderLogo(){ return (<View style={{flexDirection:'row',alignItems:'center',gap:8}}><Image source={require('../assets/images/icon.png')} style={{width:28,height:28,borderRadius:8}} resizeMode="contain" /><Text style={{color:COLORS.text,fontWeight:'800',fontSize:18}}>LINK</Text></View>); }
