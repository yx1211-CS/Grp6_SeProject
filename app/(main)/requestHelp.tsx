import { useRouter } from "expo-router";
import React, { useState } from "react";
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

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Request Help", "Please fill in all fields.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to request help.");
      return;
    }

    setLoading(true);
    try {
      // 插入数据到 help_request 表
      const { error } = await supabase.from("help_request").insert({
        student_id: user.id, // 当前用户ID
        title: title.trim(),
        description: description.trim(),
        status: "Pending", // 默认为待分配
      });

      if (error) throw error;

      Alert.alert(
        "Success",
        "Your request has been submitted! A counselor will assign a helper to you soon.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg="white">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
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
          </View>

          <View style={styles.form}>
            <Text style={styles.subTitle}>
              Feeling overwhelmed? Let us know what's on your mind. Our Peer
              Helpers are here to listen.
            </Text>

            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Academic Stress, Relationship issues..."
                placeholderTextColor={theme.colors.textLight}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share a bit more about what you're going through..."
                placeholderTextColor={theme.colors.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
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
    marginBottom: 20,
    marginTop: 10,
    gap: 10,
  },
  backButton: {
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontWeight: "bold",
    color: theme.colors.text,
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
