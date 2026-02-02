import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "../assets/icons";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import Input from "../components/Input";
import ScreenWrapper from "../components/ScreenWrapper";
import { theme } from "../constants/theme";
import { hp, wp } from "../helpers/common";
import { supabase } from "../lib/supabase";

const Login = () => {
  const router = useRouter();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);
  //******staff login************/
  const [modalVisible, setModalVisible] = useState(false);

  const handleRoleLogin = (route) => {
    setModalVisible(false);
    router.push(route);
  };
  //********************* */
  const onSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("Login", "Please fill all the fields!");
      return;
    }
    // API call logic goes here later
    let email = emailRef.current.trim();
    let password = passwordRef.current.trim();

    setLoading(true);

    try {
      const { data: maintenanceFlag } = await supabase
        .from('notifications')
        .select('*')
        .eq('title', 'MAINTENANCE_ON') // Looking for the "Flag"
        .maybeSingle(); // Returns null if not found (instead of error)

      if (maintenanceFlag) {
        setLoading(false);
        router.push('/maintenance'); // Block user & Redirect
        return;
      }
    } catch (err) {
      console.log("Maintenance Check Error:", err);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      Alert.alert("Login", error.message);
      return;
    }

    ///here is check if user banned cant login
    try {
      const { data: profile, error: profileError } = await supabase
        .from("account")
        .select("accountstatus")
        .eq("accountid", data.user.id)
        .single();

      if (profileError) throw profileError;

      //say goodbye with banned user
      if (profile && profile.accountstatus === "Banned") {
        await supabase.auth.signOut(); //clear user login
        setLoading(false);
        Alert.alert("Access Denied", "Your account has been banned.");
        return;
      }

      // if any error to affect user cant login will prompt this
      setLoading(false);
    } catch (err) {
      setLoading(false);
      await supabase.auth.signOut();
      console.log("Database Error Details:", err);
      Alert.alert("Login Debug", err.message || "Unknown error");
    }
  };

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        {/* Welcome Text */}
        <View>
          <Text style={styles.welcomeText}>Hey,</Text>
          <Text style={styles.welcomeText}>Welcome Back</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
            Please login to continue
          </Text>

          <Input
            icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
            placeholder="Enter your email"
            onChangeText={(value) => (emailRef.current = value)}
          />

          <Input
            icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
            placeholder="Enter your password"
            secureTextEntry
            onChangeText={(value) => (passwordRef.current = value)}
          />

          {/* Button */}
          <Button title={"Login"} loading={loading} onPress={onSubmit} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable onPress={() => router.push("signUp")}>
            <Text
              style={[
                styles.footerText,
                {
                  color: theme.colors.primaryDark,
                  fontWeight: theme.fonts.semibold,
                },
              ]}
            >
              Sign up
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ———— staff login button   ———— */}
      <View style={styles.staffTriggerContainer}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.staffTriggerText}>Staff Access</Text>
        </TouchableOpacity>
      </View>

      {/*Modal*/}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Select Login Role</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleRoleLogin("/admin/adminLogin")}
            >
              <Text style={styles.modalButtonText}>Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleRoleLogin("/moderator/moderatorLogin")}
            >
              <Text style={styles.modalButtonText}>Moderator</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleRoleLogin("/counselor/login")}
            >
              <Text style={styles.modalButtonText}>Counselor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 45,
    paddingHorizontal: wp(5),
  },
  welcomeText: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  form: {
    gap: 25,
  },
  forgotPassword: {
    textAlign: "right",
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    textAlign: "center",
    color: theme.colors.text,
    fontSize: hp(1.6),
  },
  // *********** staff login css ***
  staffTriggerContainer: {
    marginTop: 10,
    alignItems: "center",
    paddingBottom: 70,
  },
  staffTriggerText: {
    fontSize: hp(1.6),
    color: "#999",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: theme.colors.text,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  cancelButton: {
    borderBottomWidth: 0,
    marginTop: 5,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
  },
});
