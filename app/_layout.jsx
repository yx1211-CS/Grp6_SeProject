import { Stack, useRouter,useSegments, useRootNavigationState } from "expo-router";
import React, { useEffect } from "react";
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
  const { setAuth, setUserData } = useAuth();
  const router = useRouter();

  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    supabase.auth.onAuthStateChange((_event, session) => {
      // console.log('session user: ', session?.user?.id);

      if (session) {
        setAuth(session.user);
        updateUserData(session.user, session.user.email);

        const isNewUser = session.user.user_metadata?.is_new_user;

        const inInterestPage = segments.some(s => s === 'editInterest');
        const inHomePage = segments.some(s => s === 'home');

        if (isNewUser) {
          // 如果是新用户，且还没在兴趣页，就跳转
          if (!inInterestPage) {
            router.replace({
              pathname: "/(main)/editInterest",
              params: { fromSignUp: "true" },
            });
          }
        } else {
          const inMainGroup = segments[0] === '(main)';
          
          if (!inMainGroup) {
            router.replace("/(main)/home");
          }
        }
        
      } else {
        setAuth(null);
        const inAuthGroup = segments[0] === 'welcome' || segments[0] === 'login' || segments[0] === 'signUp';
        if (!inAuthGroup) {
            router.replace("/welcome");
        }
      }
    });

  }, [rootNavigationState?.key, segments]);

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
    </Stack>
  );
};
export default _layout;
