import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
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
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isMaintenanceOn, setIsMaintenanceOn] = useState(false); // 🔥 新增状态：存维护模式

  // ==========================================
  // Effect 1: Auth Listener & Maintenance Check
  // ==========================================
  useEffect(() => {
    // 1. 启动时检查一次维护模式 (避免每次跳转都查数据库，太卡了)
    checkMaintenanceStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setAuth(session.user);
        updateUserData(session.user, session.user.email);
      } else {
        setAuth(null);
      }
      setAuthInitialized(true); 
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); 

  // 辅助函数：查维护状态
  const checkMaintenanceStatus = async () => {
    try {
      const { data } = await supabase
        .from('log')
        .select('actiontype')
        .like('actiontype', 'MAINTENANCE_%')
        .order('logid', { ascending: false })
        .limit(1)
        .single();
      
      if (data?.actiontype === 'MAINTENANCE_ON') {
        setIsMaintenanceOn(true);
      } else {
        setIsMaintenanceOn(false);
      }
    } catch (err) {
      console.log("Maintenance check error:", err);
    }
  }

  // ==========================================
  // Effect 2: Navigation Logic (Cleaned Up)
  // ==========================================
  useEffect(() => {
    if (!rootNavigationState?.key || !authInitialized) return;

    // —————————————————————————————————————————————
    // 1. 维护模式逻辑 (Maintenance Mode)
    // —————————————————————————————————————————————
    if (isMaintenanceOn) {
        // 只有 Admin 能过
        const isAdminUser = user?.user_metadata?.role === 'Admin';
        
        // 如果不是 Admin，且不在维护页，也不是在尝试登录 Admin，就踢去维护页
        if (!isAdminUser && segments[0] !== 'admin' && segments[0] !== 'maintenance') {
             router.replace('/maintenance');
             return; 
        }
    }

    // —————————————————————————————————————————————
    // 2. 正常用户逻辑 (Normal User Flow)
    // —————————————————————————————————————————————
    const inAuthGroup = segments[0] === 'welcome' || segments[0] === 'login' || segments[0] === 'signUp';
    const inInterestPage = segments.some(s => s === 'editInterest');
    
    if (user) {
        const isNewUser = user.user_metadata?.is_new_user;

        if (isNewUser) {
            // 新用户 -> 强制去选兴趣
            // 加上 try-catch 防止路由还没准备好报错
            if (!inInterestPage) {
                try {
                    router.replace({
                        pathname: "/(main)/editInterest",
                        params: { fromSignUp: "true" },
                    });
                } catch (e) {}
            }
        } else {
            // 老用户 -> 如果卡在欢迎页，踢回首页
            if (inAuthGroup) {
                router.replace("/(main)/home");
            }
        }
    } else {
        // 没登录 -> 踢回 Welcome
        // (但也允许访问 admin/maintenance 页面)
        const inStaffPortal = segments[0] === 'admin' || segments[0] === 'moderator' || segments[0] === 'counselor';
        const inMaintenancePage = segments[0] === 'maintenance';

        if (!inAuthGroup && !inStaffPortal && !inMaintenancePage) {
            router.replace("/welcome");
        }
    }

  }, [user, authInitialized, isMaintenanceOn]); 
  // 🔥 重点：这里去掉了 segments！
  // 这样切换页面时不会重新运行逻辑，就不会卡顿或刷新了。

  const updateUserData = async (user, email) => {
    let res = await getUserData(user.id);
    if (res.success) {
      res.data.email = email;
      setUserData(res.data);
    }
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(main)/home" options={{ headerShown: false }} />
      <Stack.Screen name="(main)/editInterest" options={{ headerShown: false }} />
      <Stack.Screen name="postDetails" options={{ presentation: 'modal' }} />
      <Stack.Screen name="maintenance" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signUp" options={{ headerShown: false }} />
    </Stack>
  );
};
export default _layout;