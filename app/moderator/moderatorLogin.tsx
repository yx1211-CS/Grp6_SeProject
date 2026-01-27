import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Icon from "../../assets/icons";
import Button from "../../components/Button";
import Input from "../../components/Input";
import ScreenWrapper from "../../components/ScreenWrapper";
import { hp, wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

const ModeratorLogin = () => {
  const router = useRouter();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("Login Required", "Please enter your ID and password.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailRef.current.trim(),
      password: passwordRef.current.trim(),
    });
    setLoading(false);

    if (error) {
      Alert.alert("Access Denied", error.message);
      return;
    }

    try {
      // check role
      const { data: profile, error: profileError } = await supabase
        .from("account")
        .select("accountstatus, role")
        .eq("accountid", data.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Profile not found.");
      }

      //block banned user
      if (profile.accountstatus === "Banned") {
        await supabase.auth.signOut();
        setLoading(false);
        Alert.alert("Access Denied", "Your account is banned.");
        return;
      }

      // onlymoderator login
      if (profile.role !== "Moderator") {
        await supabase.auth.signOut();
        setLoading(false);
        Alert.alert("Unauthorized", "This is for Moderators only.");
        return;
      }

      if (data.session) {
        router.replace("/moderator");
      }
    } catch (err) {
      setLoading(false);
      await supabase.auth.signOut();
      console.log("Moderator check error:", err);
      Alert.alert("Login Error", "Failed to verify moderator credentials.");
    }
  };

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={{ marginTop: 10, zIndex: 100 }}>
              <TouchableOpacity
                onPress={() => {
                  console.log("Back button pressed!");
                  router.replace("/welcome");
                }}
                style={{
                  alignSelf: "flex-start",
                  padding: 10,
                  borderRadius: 50,
                  backgroundColor: "#F3F4F6",
                }}
              >
                <Icon
                  name="arrowLeft"
                  size={26}
                  color="#374151"
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
            </View>

            <Animated.View
              style={[
                styles.contentWrapper,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <View style={styles.headerSection}>
                <View style={styles.iconContainer}>
                  <Icon name="lock" size={38} strokeWidth={2} color="#6D28D9" />
                </View>

                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.subText}>Moderator</Text>
              </View>
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Moderator Email</Text>
                  <Input
                    icon={<Icon name="mail" size={22} color="#8B5CF6" />}
                    placeholder="Enter your Email"
                    onChangeText={(value) => (emailRef.current = value)}
                    containerStyles={styles.softInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <Input
                    icon={<Icon name="lock" size={22} color="#8B5CF6" />}
                    placeholder="Enter password"
                    secureTextEntry
                    onChangeText={(value) => (passwordRef.current = value)}
                    containerStyles={styles.softInput}
                  />
                </View>

                <View style={{ marginTop: 20 }}>
                  <Button
                    title={"Sign In"}
                    loading={loading}
                    onPress={onSubmit}
                    buttonStyle={styles.modButton}
                    textStyle={{ fontWeight: "600", fontSize: 16 }}
                  />
                </View>
              </View>
            </Animated.View>

            <View style={styles.footer}>
              <Icon name="shield" size={12} color="#9CA3AF" />
              <Text style={styles.footerText}>Authorized Personnel Only</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default ModeratorLogin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    justifyContent: "space-between",
    paddingBottom: 30,
  },
  bgCircle1: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#F5F3FF",
    zIndex: -1,
  },
  bgCircle2: {
    position: "absolute",
    top: hp(25),
    left: -100,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FAF5FF",
    zIndex: -1,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    gap: 35,
    marginTop: -hp(5),
  },
  headerSection: {
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 84,
    height: 84,
    backgroundColor: "white",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  welcomeText: {
    fontSize: hp(3.5),
    fontWeight: "bold",
    color: "#1F2937",
  },
  subText: {
    fontSize: hp(1.8),
    color: "#6B7280",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginLeft: 4,
  },
  softInput: {
    backgroundColor: "white",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 14,
    height: hp(6.2),
  },
  modButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    height: hp(6.2),
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});
