import { View, Text, LogBox } from 'react-native'
import React, { useEffect } from 'react'
import { Slot, Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'


LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer', 'Warning: MemoizedTNodeRenderer', 'TRenderEngineProvider'])

const MainLayout = () => {
  const { setAuth, setUserData } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    
    supabase.auth.onAuthStateChange((_event, session) => {
      // console.log('session user: ', session?.user?.id);

      if (session) {
        
        setAuth(session.user);
        router.replace('/home'); 

      } else {
        
        setAuth(null);
        router.replace('/welcome');

      }
    })
  }, []);

  return <Slot /> 
}

export default function RootLayout() {
  return (
    <AuthProvider>
       <Stack screenOptions={{ headerShown: false }}>
         {/* 这里是你的各个页面 */}
         <Stack.Screen name="(main)/home" />
      </Stack>
    </AuthProvider>
  );
}