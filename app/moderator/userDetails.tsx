import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
import { wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

export default function UserDetails() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    postCount: 0,
    violationCount: 0,
    bannedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [banDurationType, setBanDurationType] = useState("Temporary");
  const [tempDays, setTempDays] = useState(1);
  const [banReason, setBanReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // get user details
  const fetchUserDetails = async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase
      .from("account")
      .select("*")
      .eq("accountid", userId)
      .single();

    if (userError) {
      Alert.alert("Error", "User not found");
      router.back();
      return;
    }

    const username = userData.username;
    const [postsRes, violationsRes, bansRes] = await Promise.all([
      supabase
        .from("post")
        .select("*", { count: "exact", head: true })
        .eq("userid", userId),

      // weigui de
      supabase
        .from("post")
        .select("*", { count: "exact", head: true })
        .eq("userid", userId)
        .eq("ishidden", true),

      // ban time
      supabase
        .from("log")
        .select("*", { count: "exact", head: true })
        .ilike("actiontype", `%Banned @${username}%`),
    ]);

    setUser(userData);
    setStats({
      postCount: postsRes.count || 0,
      violationCount: violationsRes.count || 0,
      bannedCount: bansRes.count || 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchUserDetails();
  }, [userId]);

  const handleActionClick = () => {
    if (!user) return;
    const isBanned = user.accountstatus === "Banned";

    // Admin cant ban
    const userRole = user.role ? user.role.toLowerCase() : "";
    if (!isBanned && (userRole === "admin" || userRole === "administrator")) {
      Alert.alert("Cannot ban admin", "This user is an administrator.");
      return;
    }

    if (isBanned) {
      confirmUnban();
    } else {
      setBanDurationType("Temporary");
      setTempDays(1);
      setBanReason("");
      setModalVisible(true);
    }
  };

  // ban user
  const executeBan = async () => {
    if (!banReason.trim()) {
      Alert.alert("Required", "Please enter a reason.");
      return;
    }

    setProcessing(true);
    try {
      let expiresAt = null;
      let durationText = "Permanent";

      if (banDurationType === "Temporary") {
        const date = new Date();

        // 1 minute test
        if (tempDays === 0) {
          date.setMinutes(date.getMinutes() + 1);
          durationText = "1 Minute (Test)";
        } else {
          date.setDate(date.getDate() + tempDays);
          durationText = `${tempDays} Days`;
        }

        expiresAt = date.toISOString();
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from("account")
        .update({
          accountstatus: "Banned",
          banExpiredDate: expiresAt,
        })
        .eq("accountid", user.accountid);

      if (updateError) throw updateError;

      // log
      await supabase.from("log").insert({
        accountid: currentUser?.id,
        actiontype: `Banned @${user.username} (${durationText}). Reason: ${banReason}`,
        actiontime: new Date().toISOString(),
      });

      Alert.alert("Success", `User banned for ${durationText}.`);
      setModalVisible(false);
      fetchUserDetails();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessing(false);
    }
  };

  const confirmUnban = () => {
    Alert.alert("Unban User", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unban",
        onPress: async () => {
          setProcessing(true);
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();

          await supabase
            .from("account")
            .update({
              accountstatus: "Active",
              banExpiredDate: null,
            })
            .eq("accountid", user.accountid);

          await supabase.from("log").insert({
            accountid: currentUser?.id,
            actiontype: `Unbanned @${user.username}`,
            actiontime: new Date().toISOString(),
          });

          setProcessing(false);
          Alert.alert("Success", "User unbanned.");
          fetchUserDetails();
        },
      },
    ]);
  };

  if (loading)
    return (
      <ScreenWrapper bg="#F9F9F9">
        <ActivityIndicator style={{ marginTop: 50 }} />
      </ScreenWrapper>
    );

  const isBanned = user?.accountstatus === "Banned";

  const InfoRow = ({
    icon,
    label,
    value,
    isLast = false,
    isBoolean = false,
  }) => {
    let displayValue = value;
    if (isBoolean) {
      displayValue = value ? "Yes" : "No";
    }

    return (
      <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.iconBox}>
            <Icon name={icon} size={16} color="gray" />
          </View>
          <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text
          style={[
            styles.infoValue,
            isBoolean && value && { color: theme.colors.primary },
          ]}
        >
          {displayValue || "N/A"}
        </Text>
      </View>
    );
  };

  return (
    <ScreenWrapper bg="#F9F9F9">
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrowLeft" size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>User Profile</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        {/*Profile Card */}
        <View style={styles.profileCard}>
          <View
            style={[
              styles.bigAvatar,
              isBanned && { backgroundColor: "#FFEBEE" },
            ]}
          >
            <Text
              style={[styles.bigAvatarText, isBanned && { color: "#D32F2F" }]}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Text>
            {user?.isverify && (
              <View style={styles.verifyBadge}>
                <Icon name="check" size={12} color="white" strokeWidth={4} />
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={styles.nameText}>@{user?.username}</Text>
            {user?.isverify && <Icon name="shield" size={16} color="#4CAF50" />}
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
            <View
              style={[
                styles.tag,
                isBanned
                  ? { backgroundColor: "#FFEBEE" }
                  : { backgroundColor: "#E8F5E9" },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  isBanned ? { color: "#C62828" } : { color: "#2E7D32" },
                ]}
              >
                {isBanned ? `BANNED` : "ACTIVE"}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: "#F3F4F6" }]}>
              <Text style={[styles.tagText, { color: "#4B5563" }]}>
                {user?.role || "User"}
              </Text>
            </View>
          </View>

          {isBanned && user.banExpiredDate && (
            <View style={styles.expireBox}>
              <Icon name="time" size={14} color="#C62828" />
              <Text style={styles.expireText}>
                Unban: {new Date(user.banExpiredDate).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Posts, Violations, Bans*/}
        <View style={styles.statsContainer}>
          {/* Total Posts */}
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.postCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />

          {/* Violation Posts */}
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#E65100" }]}>
              {stats.violationCount}
            </Text>
            <Text style={styles.statLabel}>Violations</Text>
          </View>
          <View style={styles.statDivider} />

          {/* Times Banned */}
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#C62828" }]}>
              {stats.bannedCount}
            </Text>
            <Text style={styles.statLabel}>Times Banned</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.infoContainer}>
          <InfoRow icon="user" label="User ID" value={user?.accountid} />
          <InfoRow icon="mail" label="Email" value={user?.email} />
          <InfoRow icon="edit" label="Bio" value={user?.bio || "No bio"} />

          <InfoRow
            icon="shield"
            label="Verified"
            value={user?.isverify}
            isBoolean
          />
          <InfoRow
            icon="heart"
            label="Birthday Set"
            value={user?.isbirthday}
            isBoolean
            isLast
          />
        </View>

        <TouchableOpacity
          style={[
            styles.mainActionBtn,
            isBanned ? styles.btnGreen : styles.btnRed,
          ]}
          onPress={handleActionClick}
        >
          <Icon name={isBanned ? "check" : "delete"} size={20} color="white" />
          <Text style={styles.mainActionText}>
            {isBanned ? "Unban User" : "Ban User"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Ban User</Text>
                <Text style={styles.modalSubtitle}>
                  Select ban duration for @{user?.username}
                </Text>

                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      banDurationType === "Temporary" && styles.typeBtnActive,
                    ]}
                    onPress={() => setBanDurationType("Temporary")}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        banDurationType === "Temporary" && { color: "white" },
                      ]}
                    >
                      Temporary
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      banDurationType === "Permanent" && styles.typeBtnActive,
                    ]}
                    onPress={() => setBanDurationType("Permanent")}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        banDurationType === "Permanent" && { color: "white" },
                      ]}
                    >
                      Permanent
                    </Text>
                  </TouchableOpacity>
                </View>

                {banDurationType === "Temporary" && (
                  <View style={styles.daysContainer}>
                    <Text style={styles.label}>Duration:</Text>
                    <View style={styles.daysGrid}>
                      {[0, 1, 3, 7, 14, 30].map((days) => (
                        <TouchableOpacity
                          key={days}
                          style={[
                            styles.dayChip,
                            tempDays === days && styles.dayChipActive,
                          ]}
                          onPress={() => setTempDays(days)}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              tempDays === days && { color: "white" },
                            ]}
                          >
                            {days === 0 ? "1 Min" : `${days} Days`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <Text style={styles.label}>Reason:</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Violation of community guidelines..."
                  value={banReason}
                  onChangeText={setBanReason}
                  multiline
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={executeBan}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.confirmText}>Confirm Ban</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    marginBottom: 10,
    paddingTop: 10,
  },
  backBtn: { padding: 5, backgroundColor: "white", borderRadius: 20 },
  title: { fontSize: 18, fontWeight: "bold", color: theme.colors.text },

  profileCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bigAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },
  bigAvatarText: { fontSize: 36, fontWeight: "bold", color: "#4F46E5" },
  verifyBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4CAF50",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },

  nameText: { fontSize: 20, fontWeight: "bold", color: theme.colors.text },
  emailText: { fontSize: 13, color: "gray", marginTop: 2 },

  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontWeight: "700", fontSize: 11 },
  expireBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "#FFEBEE",
    padding: 8,
    borderRadius: 8,
    gap: 5,
  },
  expireText: { color: "#C62828", fontSize: 12, fontWeight: "600" },

  statsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    elevation: 1,
  },
  statItem: { alignItems: "center", flex: 1 },
  statDivider: { width: 1, backgroundColor: "#eee" },
  statNumber: { fontSize: 20, fontWeight: "bold", color: "#333" },
  statLabel: { fontSize: 12, color: "gray", marginTop: 2 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginLeft: 5,
  },
  infoContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 5,
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 14, color: "#555", fontWeight: "500" },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    maxWidth: "60%",
  },

  mainActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 10,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 3,
  },
  btnRed: { backgroundColor: "#222" },
  btnGreen: { backgroundColor: "#4CAF50" },
  mainActionText: { color: "white", fontSize: 16, fontWeight: "bold" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  modalSubtitle: { color: "gray", marginBottom: 20 },
  typeSelector: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  typeBtnActive: { backgroundColor: "#333" },
  typeText: { fontWeight: "600", color: "#666" },
  daysContainer: { marginBottom: 20 },
  label: { fontWeight: "bold", marginBottom: 10, color: "#333" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
  },
  dayChipActive: { backgroundColor: "#333", borderColor: "#333" },
  dayText: { fontSize: 12, fontWeight: "600", color: "#333" },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    height: 80,
    textAlignVertical: "top",
    marginBottom: 20,
    fontSize: 16,
  },
  modalActions: { flexDirection: "row", gap: 15 },
  cancelBtn: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtn: {
    flex: 1,
    padding: 15,
    backgroundColor: "#D32F2F",
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: { fontWeight: "bold", color: "#333" },
  confirmText: { fontWeight: "bold", color: "white" },
});
