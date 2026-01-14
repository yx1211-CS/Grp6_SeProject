import { View, Text, LogBox } from 'react-native'
import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService' // 👈 记得补上这个 import

LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer', 'Warning: MemoizedTNodeRenderer', 'TRenderEngineProvider'])

// 1. 这里作为组件入口
const _layout = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  )
}

// 2. 主要的逻辑都在这里
const MainLayout = () => {
  const { setAuth, setUserData } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      // console.log('session user: ', session?.user?.id);

      if (session) {
        setAuth(session.user);
        updateUserData(session.user, session.user.email);
        router.replace('/home');
      } else {
        // 未登录状态
        setAuth(null);
        router.replace('/welcome');
      }
    })
  }, []);

  const updateUserData = async (user, email) => {
    let res = await getUserData(user.id);
    if (res.success) {
        res.data.email = email; 
        setUserData(res.data);
    }
  }

  // 3. 【关键】MainLayout 必须把 Stack 渲染出来，否则页面是白的
  return (
    <Stack screenOptions={{ headerShown: false }}>
        {/* 定义你的页面路由 */}
        <Stack.Screen name="(main)/home" options={{headerShown: false}} />
    </Stack>
  )
}

// 4. 【关键】导出 _layout，而不是原来的 RootLayout
export default _layout;