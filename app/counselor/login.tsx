import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import ScreenWrapper from "../../components/ScreenWrapper";
import { hp, wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

const THEME = {
  primary: "#1A4D2E",
  secondary: "#4F772D",
  accent: "#E9F5DB",
  white: "#FFFFFF",
  textMain: "#1A4D2E",
  textGray: "#9CA3AF",
  inputBg: "#F9FAFB",
};

const ElegantInput = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  fieldId,
  activeField,
  setActiveField,
}) => {
  const isActive = activeField === fieldId;
  return (
    <View style={[styles.inputContainer, isActive && styles.inputActive]}>
      <Feather
        name={icon}
        size={20}
        color={isActive ? THEME.primary : "#A0A0A0"}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A0A0A0"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        onFocus={() => setActiveField(fieldId)}
        onBlur={() => setActiveField(null)}
        autoCapitalize="none"
        cursorColor={THEME.primary}
      />
    </View>
  );
};

export default function CounselorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Notice", "Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Login Failed", error.message);
        setLoading(false);
        return;
      }

      if (session) {
        const { data: user, error: userError } = await supabase
          .from("account")
          .select("*")
          .eq("accountid", session.user.id)
          .single();

        if (userError || !user) {
          Alert.alert("Error", "User data not found.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (user.accountstatus === "Banned") {
          Alert.alert("Access Denied", "Account suspended.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        const role = (user.role || "").toLowerCase();
        if (role !== "counselor") {
          Alert.alert("Restricted", "This area is for Counselors only.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        setLoading(false);
        router.replace("/counselor");
      }
    } catch (error) {
      Alert.alert("Error", "System error occurred.");
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg={THEME.white}>
      <StatusBar style="light" />

      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.headerShape}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <Feather name="arrow-left" size={24} color={THEME.white} />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Welcome Back!</Text>
                <Text style={styles.headerSubtitle}>
                  Sign in to your account
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.card}>
              <Text style={styles.instruction}>
                Please enter your details to continue
              </Text>

              <View style={styles.inputs}>
                <ElegantInput
                  fieldId="email"
                  icon="mail"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  activeField={activeField}
                  setActiveField={setActiveField}
                />
                <ElegantInput
                  fieldId="password"
                  icon="lock"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  activeField={activeField}
                  setActiveField={setActiveField}
                />
              </View>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={THEME.white} />
                ) : (
                  <Text style={styles.btnText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>v1.0.4</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  headerShape: {
    height: hp(35),
    backgroundColor: THEME.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  headerContent: {
    marginTop: hp(2),
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    marginTop: hp(4),
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: THEME.white,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#D1D5DB",
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: wp(6),
    marginTop: -hp(8),
  },
  card: {
    backgroundColor: THEME.white,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  instruction: {
    fontSize: 14,
    color: THEME.textGray,
    textAlign: "center",
    marginBottom: 35,
    fontWeight: "500",
  },
  inputs: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 15,
  },
  inputActive: {
    borderColor: THEME.primary,
    backgroundColor: "#FFFFFF",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  forgotText: {
    color: THEME.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  loginBtn: {
    backgroundColor: THEME.primary,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnText: {
    color: THEME.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    marginTop: 30,
  },
  footerText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});
