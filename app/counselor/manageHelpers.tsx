import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext"; // 获取当前操作者信息用于Log
import { supabase } from "../../lib/supabase";

export default function ManageHelpers() {
  const router = useRouter();
  const { user: currentUser } = useAuth(); // 当前Counselor
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UC27: Revoke Modal State
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [selectedHelper, setSelectedHelper] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchHelpers();
  }, []);

  const getAvatarSource = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return { uri: path };
    const { data } = supabase.storage.from("postImages").getPublicUrl(path);
    return { uri: data.publicUrl };
  };

  const fetchHelpers = async () => {
    try {
      // 联表查询：获取个人信息 + 申请表里的真实姓名
      const { data, error } = await supabase
        .from("account")
        .select(
          `
            *,
            helper_application:helper_application_userid_fkey (
                full_name,
                student_id,
                experience,
                applicationapprovaldate
            )
        `,
        )
        .eq("role", "PeerHelper")
        .order("username", { ascending: true });

      if (error) throw error;
      setHelpers(data || []);
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHelpers();
  };

  // 🟢 1. 打开撤销弹窗
  const openRevokeModal = (helper) => {
    setSelectedHelper(helper);
    setRevokeReason(""); // 清空理由
    setRevokeModalVisible(true);
  };

  // 🔴 2. 执行撤销逻辑 (符合 UC27)
  const executeRevoke = async () => {
    if (!revokeReason.trim()) {
      Alert.alert("Required", "Please enter a reason for revocation.");
      return;
    }

    setProcessing(true);
    try {
      // Step A: 把 Role 改回 User
      const { error: roleError } = await supabase
        .from("account")
        .update({ role: "User" })
        .eq("accountid", selectedHelper.accountid);

      if (roleError) throw roleError;

      // Step B: 终止该 Helper 手头的所有任务 (重置为 Pending，且 assigned_helper_id 设为 null)
      // 这样其他 Helper 可以在 Assignment 页面重新认领这些任务
      const { error: taskError } = await supabase
        .from("help_request")
        .update({
          status: "Pending",
          assigned_helper_id: null,
        })
        .eq("assigned_helper_id", selectedHelper.accountid)
        .eq("status", "Assigned"); // 只处理进行中的

      if (taskError) throw taskError;

      // Step C: (可选) 记录 Log
      await supabase.from("log").insert({
        accountid: currentUser?.id, // 操作者ID
        actiontype: `Revoked Peer Helper: @${selectedHelper.username}`,
        actiondesc: `Reason: ${revokeReason}`, // 记录理由
        actiontime: new Date().toISOString(),
      });

      Alert.alert("Success", "Status revoked and active tasks terminated.");
      setRevokeModalVisible(false);
      fetchHelpers(); // 刷新列表
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAssign = () => {
    router.push("/counselor/assignment");
  };

  const renderItem = ({ item }) => {
    const imagePath = item.profileimage || item.profileImage;
    const appData =
      item.helper_application && item.helper_application.length > 0
        ? item.helper_application[0]
        : {};
    const realName = appData.full_name || item.username;
    const joinDate = appData.applicationapprovaldate
      ? new Date(appData.applicationapprovaldate).toLocaleDateString()
      : "Unknown";

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.avatarContainer,
              !imagePath && { backgroundColor: "#E0E7FF", borderWidth: 0 },
            ]}
          >
            {imagePath ? (
              <Image
                source={getAvatarSource(imagePath)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {item.username ? item.username[0].toUpperCase() : "?"}
              </Text>
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.fullName}>{realName}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Active Helper</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Feather
              name="credit-card"
              size={14}
              color="gray"
              style={styles.iconWidth}
            />
            <Text style={styles.detailText}>
              ID: {appData.student_id || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Feather
              name="phone"
              size={14}
              color="gray"
              style={styles.iconWidth}
            />
            <Text style={styles.detailText}>
              {item.phonenumber || "No phone number"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Feather
              name="calendar"
              size={14}
              color="gray"
              style={styles.iconWidth}
            />
            <Text style={styles.detailText}>Since: {joinDate}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.assignBtn]}
            onPress={handleAssign}
          >
            <Feather name="briefcase" size={16} color="#1565C0" />
            <Text style={styles.assignText}>Assign Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.revokeBtn]}
            onPress={() => openRevokeModal(item)} // 改为打开 Modal
          >
            <Feather name="trash-2" size={16} color="#C62828" />
            <Text style={styles.revokeText}>Revoke</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper bg="#F8F9FD">
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Helpers</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={helpers}
        keyExtractor={(item) => item.accountid.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No Peer Helpers found.</Text>
            </View>
          )
        }
      />

      {/* 👇 Revoke Reason Modal (符合 UC27) 👇 */}
      <Modal
        visible={revokeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRevokeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Revoke Helper Status</Text>
                <Text style={styles.modalSubtitle}>
                  Are you sure you want to revoke{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    @{selectedHelper?.username}
                  </Text>
                  ? This will revert them to a normal user and terminate all
                  active tasks.
                </Text>

                <Text style={styles.inputLabel}>Reason for revocation:</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="e.g. Violation of rules, Inactivity..."
                  value={revokeReason}
                  onChangeText={setRevokeReason}
                  multiline
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setRevokeModalVisible(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmRevokeBtn}
                    onPress={executeRevoke}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.confirmRevokeText}>
                        Confirm Revoke
                      </Text>
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
  // ... 之前的样式保留 ...
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  backBtn: {
    padding: 8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#eee",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { fontSize: 24, fontWeight: "bold", color: "#4F46E5" },
  info: { flex: 1 },
  fullName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  username: { fontSize: 13, color: "gray", marginBottom: 4, marginTop: 1 },
  badgeContainer: { flexDirection: "row" },
  activeBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeText: { fontSize: 11, color: "#2E7D32", fontWeight: "700" },
  detailsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  detailRow: { flexDirection: "row", alignItems: "flex-start" },
  iconWidth: { width: 20, marginTop: 2 },
  detailText: { fontSize: 13, color: "#555", flex: 1, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 12, marginTop: 15 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  assignBtn: { backgroundColor: "#E3F2FD" },
  assignText: { color: "#1565C0", fontWeight: "600", fontSize: 14 },
  revokeBtn: { backgroundColor: "#FFEBEE" },
  revokeText: { color: "#C62828", fontWeight: "600", fontSize: 14 },
  emptyContainer: { alignItems: "center", marginTop: 100, gap: 10 },
  emptyText: { color: "#999", fontSize: 16 },

  // 👇 Modal Styles 👇
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    height: 80,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
  },
  modalActions: { flexDirection: "row", gap: 15 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelText: { fontWeight: "600", color: "#333" },
  confirmRevokeBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#D32F2F", // 红色警告色
    alignItems: "center",
  },
  confirmRevokeText: { fontWeight: "bold", color: "white" },
});
