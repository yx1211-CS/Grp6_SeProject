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

  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();
  const [authInitialized, setAuthInitialized] = useState(false);

  // ==========================================
  // Effect 1: Auth Listener
  // ==========================================
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setAuth(session.user);
        await updateUserData(session.user, session.user.email);
      } else {
        setAuth(null);
      }
      setAuthInitialized(true); 
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); 

  // ==========================================
  // Effect 2: Navigation & Security Logic
  // ==========================================
  useEffect(() => {
    if (!rootNavigationState?.key || !authInitialized) return;

    // 🛑 SAFETY 1: If navigation is still loading (segments is empty), DO NOTHING.
    // This prevents the "Glimpse and Kick" bug.
    if (!segments || segments.length === 0) return;

    const checkSecurityAndNavigate = async () => {
      // —————————————————————————————————————————————
      // 1. CHECK MAINTENANCE STATUS
      // —————————————————————————————————————————————
      let isMaintenanceOn = false;
      try {
        const { data } = await supabase
          .from('log')
          .select('actiontype')
          .like('actiontype', 'MAINTENANCE_%')
          .order('logid', { ascending: false })
          .limit(1)
          .single();
        
        if (data?.actiontype === 'MAINTENANCE_ON') isMaintenanceOn = true;
      } catch (err) {
        isMaintenanceOn = false;
      }

      // —————————————————————————————————————————————
      // 2. DEFINE LOCATIONS
      // —————————————————————————————————————————————
      const inAuthGroup = segments[0] === 'welcome' || segments[0] === 'login' || segments[0] === 'signUp';
      const inInterestPage = segments.some(s => s === 'editInterest');
      const inStaffPortal = segments[0] === 'admin' || segments[0] === 'moderator' || segments[0] === 'counselor';
      const inMaintenancePage = segments[0] === 'maintenance'; 

      // —————————————————————————————————————————————
      // 3. ENFORCE MAINTENANCE MODE
      // —————————————————————————————————————————————
      if (isMaintenanceOn) {
        
        // 🔑 MASTER KEY: If you are an Admin, you are EXEMPT.
        // We check specific role or if you are already inside the admin folder
        const isAdminUser = user?.user_metadata?.role === 'Admin';
        
        if (isAdminUser || segments[0] === 'admin') {
            return; // Allow access
        }

        // 🔴 BLOCK EVERYONE ELSE
        if (!inMaintenancePage) {
           router.replace('/maintenance');
        }
        return; // Stop here, don't do normal checks
      }

      // —————————————————————————————————————————————
      // 4. NORMAL NAVIGATION LOGIC
      // —————————————————————————————————————————————
      if (user) {
        const isNewUser = user.user_metadata?.is_new_user;

        if (isNewUser) {
          if (!inInterestPage) {
            // @ts-ignore
            router.replace({
              pathname: "/(main)/editInterest",
              params: { fromSignUp: "true" },
            });
          }
        } else {
          if (inAuthGroup) {
            router.replace("/(main)/home");
          }
        }

      } else {
        if (!inAuthGroup && !inStaffPortal) { 
          router.replace("/welcome");
        }
      }
    };

    checkSecurityAndNavigate();

  }, [user, segments, rootNavigationState?.key, authInitialized]);


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
      
      {/* NOTE: Staff folders (admin/moderator/counselor) do not need explicit 
         Stack.Screens here if they are folders. Expo finds them automatically.
      */}

      {/* Make sure you create this file! */}
      <Stack.Screen name="maintenance" options={{ headerShown: false }} />

      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signUp" options={{ headerShown: false }} />
    </Stack>
  );
};
export default _layout;