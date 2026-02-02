import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function PeerHelperApplication() {
  const router = useRouter();

  // Loading and State Management
  const [loading, setLoading] = useState(false); // Controls form submission loading
  const [checking, setChecking] = useState(true); // Controls initial status check loading
  const [existingStatus, setExistingStatus] = useState<string | null>(null); // Stores 'Pending' or 'Approved' status

  // Form Data States
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [experience, setExperience] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Check application status on component mount
  useEffect(() => {
    checkStatus();
  }, []);

  // Checks if the user is already a Peer Helper or has a pending application
  const checkStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check current role in the Account table
      const { data: account } = await supabase
        .from("account")
        .select("role")
        .eq("accountid", user.id)
        .single();

      if (account?.role === "PeerHelper") {
        setExistingStatus("Approved");
        setChecking(false);
        return;
      }

      // Check for any 'Pending' applications in helper_application table
      const { data: application } = await supabase
        .from("helper_application")
        .select("helperstatus")
        .eq("userid", user.id)
        .eq("helperstatus", "Pending")
        .maybeSingle(); // Returns null instead of error if no row found

      if (application) {
        setExistingStatus("Pending");
      }
    } catch (error) {
      console.log("Check status error:", error);
    } finally {
      setChecking(false);
    }
  };

  //Handles form submission to the helper_application table

  const handleSubmit = async () => {
    // Basic Input Validation
    if (!fullName.trim() || !studentId.trim() || !reason.trim()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    // Ethics Agreement Validation
    if (!agreed) {
      Alert.alert(
        "Agreement Required",
        "You must agree to the Code of Ethics.",
      );
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User session not found");

      // Insert data into helper_application table
      const { error } = await supabase.from("helper_application").insert({
        userid: user.id, // Foreign key to auth/account
        full_name: fullName, // Applicant's legal name
        student_id: studentId, // University Student ID
        reason: reason, // Motivation for joining
        experience: experience, // Relevant background info
        helperstatus: "Pending", // Default status for new applications
      });

      if (error) throw error;

      Alert.alert(
        "Application Submitted",
        "Thank you! Your application has been sent for review.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      console.log("Submission Error:", error);
      Alert.alert("Submission Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial loading screen while checking database status
  if (checking) {
    return (
      <ScreenWrapper bg="white">
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  // View for Pending Status
  if (existingStatus === "Pending") {
    return (
      <ScreenWrapper bg="white">
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: "#FFF3E0", borderColor: "#FF9800" },
            ]}
          >
            <Feather name="clock" size={60} color="#EF6C00" />
          </View>
          <Text style={styles.statusTitle}>Application Pending</Text>
          <Text style={styles.statusDesc}>
            You have already submitted an application. Please wait for our team
            to review it.
          </Text>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.outlineBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // View for Approved Status
  if (existingStatus === "Approved") {
    return (
      <ScreenWrapper bg="white">
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" },
            ]}
          >
            <Feather name="check" size={60} color="#2E7D32" />
          </View>
          <Text style={styles.statusTitle}>You are a Peer Helper!</Text>
          <Text style={styles.statusDesc}>
            You are already a verified Peer Helper in our community.
          </Text>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.outlineBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // Default Form View
  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
          {/* Back Navigation Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Feather name="arrow-left" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Apply as Peer Helper</Text>
          </View>

          <Text style={styles.subtitle}>
            Join as a Peer Helper and help us build a supportive and safe
            community for everyone.
          </Text>

          {/* Form Fields Section */}
          <View style={styles.formContainer}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Full Name <Text style={{ color: "red" }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Student ID Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Student ID <Text style={{ color: "red" }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 121110xxxx"
                value={studentId}
                onChangeText={setStudentId}
                keyboardType="numeric"
              />
            </View>

            {/* Motivation Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Why join? <Text style={{ color: "red" }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share your motivation for becoming a helper..."
                value={reason}
                onChangeText={setReason}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Experience Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Experience (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="List any relevant volunteering or helping experience..."
                value={experience}
                onChangeText={setExperience}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Code of Ethics Agreement */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                {agreed && <Feather name="check" size={14} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to{" "}
                <Text style={{ fontWeight: "bold" }}>
                  abide by the Peer Helper Code of Ethics and community rules.
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Final Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!agreed || loading) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!agreed || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  backBtn: { marginRight: 15, padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: theme.colors.text },
  subtitle: { fontSize: 14, color: "gray", marginBottom: 30, lineHeight: 20 },
  formContainer: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "white",
    color: "#333",
  },
  textArea: { height: 120, textAlignVertical: "top" },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "black",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  checkboxActive: { backgroundColor: "black", borderColor: "black" },
  checkboxLabel: { flex: 1, fontSize: 13, color: "#555", lineHeight: 18 },
  submitBtn: {
    backgroundColor: "black",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnDisabled: { backgroundColor: "#ccc", shadowOpacity: 0 },
  submitBtnText: { color: "white", fontSize: 16, fontWeight: "bold" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  statusDesc: {
    fontSize: 15,
    color: "gray",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  outlineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderWidth: 1.5,
    borderColor: "black",
    borderRadius: 30,
  },
  outlineBtnText: { fontSize: 16, fontWeight: "600", color: "black" },
});
