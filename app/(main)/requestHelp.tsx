import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Icon from "../../assets/icons";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { hp, wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

export default function RequestHelp() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // State to determine if the current user is a student (User role)
  const [isStudent, setIsStudent] = useState(false);

  //Check user role on component mount or when user object changes
  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

  //Query the database to verify the user's role
  const checkUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from("account")
        .select("role")
        .eq("accountid", user.id)
        .single();

      // Only allow the 'History' button to show if the role is 'User'
      if (data?.role === "User") {
        setIsStudent(true);
      }
    } catch (e) {
      console.log("Error checking role:", e);
    }
  };

  const handleSubmit = async () => {
    // Basic validation to prevent empty submissions
    if (!title.trim() || !description.trim()) {
      Alert.alert("Request Help", "Please fill in all fields.");
      return;
    }

    // Safety check to ensure a session exists
    if (!user) {
      Alert.alert("Error", "You must be logged in to request help.");
      return;
    }

    setLoading(true);
    try {
      // Insert the help request into Supabase
      const { error } = await supabase.from("help_request").insert({
        student_id: user.id,
        title: title.trim(),
        description: description.trim(),
        status: "Pending", // Default status for new requests
        has_feedback: false,
      });

      if (error) throw error;

      // Post-submission success handling: Offer navigation choices
      Alert.alert("Success", "Your request has been submitted!", [
        {
          text: "View My Requests",
          onPress: () => router.replace("/studentRequests"), // Redirect to the request list
        },
        {
          text: "Later",
          onPress: () => router.back(), // Return to the previous screen
          style: "cancel",
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg="white">
      {/* Dismiss keyboard when tapping outside of inputs */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            {/* Left: Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Icon
                name="arrowLeft"
                strokeWidth={3}
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Request Help</Text>

            {/* Right: Conditional Rendering of History Button based on role */}
            {isStudent ? (
              <TouchableOpacity
                onPress={() => router.push("/studentRequests")}
                style={styles.historyBtn}
              >
                <Feather name="list" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : (
              // Invisible placeholder to keep the title centered via 'space-between'
              <View style={{ width: 40 }} />
            )}
          </View>

          <View style={styles.form}>
            <Text style={styles.subTitle}>
              Feeling overwhelmed? Let us know what's on your mind. Our Peer
              Helpers are here to listen.
            </Text>

            {/* Title Input Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Academic Stress..."
                placeholderTextColor={theme.colors.textLight}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description Input Field (Multiline) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share what you're going through..."
                placeholderTextColor={theme.colors.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top" // Ensure text starts at the top on Android
              />
            </View>

            {/* Submit Action Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading} // Prevent double-submissions
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    // Distribute space between back button, title, and history button/placeholder
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(0,0,0,0.05)",
    width: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontWeight: "bold",
    color: theme.colors.text,
  },
  historyBtn: {
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(0,0,0,0.05)",
    width: 40,
    alignItems: "center",
  },
  form: {
    gap: 20,
  },
  subTitle: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginBottom: 10,
    lineHeight: 20,
  },
  inputContainer: {
    gap: 10,
  },
  label: {
    fontSize: hp(1.8),
    fontWeight: "600",
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.darkLight,
    borderRadius: theme.radius.xl,
    padding: 16,
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  textArea: {
    height: hp(20),
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    height: hp(6),
    borderRadius: theme.radius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitText: {
    fontSize: hp(2.2),
    color: "white",
    fontWeight: "bold",
  },
});
