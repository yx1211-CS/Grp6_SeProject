import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, StatusBar, StyleSheet, Text, View, TextStyle } from "react-native";
import Icon from "../../assets/icons";
import BackButton from "../../components/BackButton";
import Button from "../../components/Button";
import Input from "../../components/Input";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

const AdminLogin = () => {
  const router = useRouter();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("Admin Login", "Please fill all fields!");
      return;
    }

    let email = emailRef.current.trim();
    let password = passwordRef.current.trim();

    setLoading(true);

    // 1. Basic Login (Check Email/Pass)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      Alert.alert("Login Failed", error.message);
      return;
    }

    // 2. SECURITY CHECK: Is this user actually an Admin?
    try {
      const { data: profile, error: profileError } = await supabase
        .from("account")
        .select("role")
        .eq("accountid", data.user.id)
        .single();

      if (profileError) throw profileError;

      // If they are NOT an admin, kick them out immediately
      if (profile?.role !== "Admin") {
        await supabase.auth.signOut();
        setLoading(false);
        Alert.alert("Access Denied", "You do not have Admin privileges.");
        return;
      }

      // 3. Success! Go to Dashboard
      setLoading(false);
      router.replace("/admin/dashboard");
      
    } catch (err: any) {
      setLoading(false);
      await supabase.auth.signOut();
      Alert.alert("Error", "Could not verify admin status.");
    }
  };

  return (
    <ScreenWrapper bg="white">
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.container}>
        <BackButton router={router} />

        <View>
          <Text style={styles.welcomeText}>Admin Portal</Text>
          <Text style={styles.subText}>System Management Login</Text>
        </View>

        <View style={styles.form}>
          <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
            Enter Admin Credentials
          </Text>

          <Input
            icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
            placeholder="Admin Email"

            onChangeText={(value: string) => (emailRef.current = value)}
          />

          <Input
            icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
            placeholder="Password"
            secureTextEntry
            onChangeText={(value: string) => (passwordRef.current = value)}
          />

          <Button 
            title={"Access Dashboard"} 
            loading={loading} 
            onPress={onSubmit}
            buttonStyle={{}} 
            textStyle={{}}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default AdminLogin;

const styles = StyleSheet.create({
  container: { flex: 1, gap: 45, paddingHorizontal: wp(5) },
  welcomeText: { 
    fontSize: hp(4), 
    fontWeight: theme.fonts.bold as any, 
    color: theme.colors.text 
  },
  subText: { 
    fontSize: hp(2), 
    color: theme.colors.textLight, 
    fontWeight: theme.fonts.medium as any 
  },
  form: { gap: 25 },
});