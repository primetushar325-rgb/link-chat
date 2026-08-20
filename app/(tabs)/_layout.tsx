import { Tabs } from 'expo-router';
import { Text } from 'react-native';
export default function TabsLayout(){
  return (<Tabs screenOptions={{headerStyle:{backgroundColor:'#0A0A0F'},headerTintColor:'#fff',tabBarStyle:{backgroundColor:'#0A0A0F',borderTopColor:'#232334'},tabBarActiveTintColor:'#6C5CE7'}}>
    <Tabs.Screen name="chats" options={{title:'Chats',tabBarIcon:()=> <Text>💬</Text>}} />
    <Tabs.Screen name="stories" options={{title:'Stories',tabBarIcon:()=> <Text>✨</Text>}} />
    <Tabs.Screen name="index" options={{title:'Home',tabBarIcon:()=> <Text>🏠</Text>}} />
    <Tabs.Screen name="profile" options={{title:'Profile',tabBarIcon:()=> <Text>👤</Text>}} />
  </Tabs>);
}
