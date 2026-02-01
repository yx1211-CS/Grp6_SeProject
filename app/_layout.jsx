import { Stack, useRouter,useSegments, useRootNavigationState } from "expo-router";
import React, { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { getUserData } from "../services/userService";

LogBox.ignoreLogs([
  "Warning: TNodeChildrenRenderer",
  "Warning: MemoizedTNodeRenderer",
  "TRenderEngineProvider",
]);

const _layout = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

const MainLayout = () => {
  const { user, setAuth, setUserData } = useAuth();
  const router = useRouter();

  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {

   const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // console.log("Auth State Changed:", _event);

      if (session) {
        setAuth(session.user);
        await updateUserData(session.user, session.user.email);
      } else {
        setAuth(null);
      }
      setAuthInitialized(true); // 标记初始化完成
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // 🔥 空数组：保证绝对不会重复运行，解决“刷新”问题

  // ==========================================
  // 🔵 Effect 2: 专门负责页面跳转 (根据 user 和 segments 变化)
  // ==========================================
  useEffect(() => {
    // 1. 如果导航没准备好，或者 Auth 还没初始化完，什么都不做
    if (!rootNavigationState?.key || !authInitialized) return;

    // 2. 获取当前状态
    const inAuthGroup = segments[0] === 'welcome' || segments[0] === 'login' || segments[0] === 'signUp';
    const inInterestPage = segments.some(s => s === 'editInterest');
    
    // 3. 判断跳转逻辑
    if (user) {
      // === 用户已登录 ===
      const isNewUser = user.user_metadata?.is_new_user;

      if (isNewUser) {
        // 新用户 -> 没在选兴趣页 -> 踢去选兴趣
        if (!inInterestPage) {
          router.replace({
            pathname: "/(main)/editInterest",
            params: { fromSignUp: "true" },
          });
        }
      } else {
        // 老用户 -> 如果在欢迎/登录页 -> 踢回首页
        // (在其他页面如 postDetails 不会触发这里，所以不会刷新)
        if (inAuthGroup) {
          router.replace("/(main)/home");
        }
      }

    } else {
      // === 用户没登录 ===
      // 如果不在欢迎页组 -> 踢去 Welcome
      if (!inAuthGroup) {
        router.replace("/welcome");
      }
    }

  }, [user, segments, rootNavigationState?.key, authInitialized]); // 🔥 这里监听变化，但处理很快，不会导致重绘


  const updateUserData = async (user, email) => {
    let res = await getUserData(user.id);
    if (res.success) {
      res.data.email = email;
      setUserData(res.data);
    }
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. 注册主页 */}
      <Stack.Screen name="(main)/home" options={{ headerShown: false }} />

      {/* 2. 🔥 修正：注册 editInterest (注意是单数，且带路径) */}
      <Stack.Screen name="(main)/editInterest" options={{ headerShown: false }} />
      <Stack.Screen name="postDetails" options={{ presentation: 'modal' }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signUp" options={{ headerShown: false }} />
    </Stack>
  );
};
export default _layout;
