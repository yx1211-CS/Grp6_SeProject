import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { createNotification } from "../../services/notificationService";

;

export default function MyTasks() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Active Tasks");

  // Modals
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reportContent, setReportContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [riskModalVisible, setRiskModalVisible] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState(null);
  // 2. 使用 useFocusEffect 确保每次页面回到前台都刷新数据
  useFocusEffect(
    useCallback(() => {
      if (user) fetchMyTasks();
    }, [user, activeTab]),
  );

  const getAvatarSource = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return { uri: path };
    const { data } = supabase.storage.from("postimages").getPublicUrl(path);
    return { uri: data.publicUrl };
  };

  const fetchMyTasks = async () => {
    try {
      setLoading(true);

      const { data: currentAccount, error: authError } = await supabase
        .from("account")
        .select("role")
        .eq("accountid", user.id)
        .single();

      if (currentAccount?.role !== "PeerHelper") {
        Alert.alert(
          "Access Denied",
          "Your Peer Helper status has been revoked.",
        );
        router.replace("/home");
        return;
      }

      let query = supabase
        .from("help_request")
        .select(
          `
            *,
            student:help_request_student_id_fkey (
                accountid, username, phonenumber, email, profileimage, risk_level, isflagged
            )
        `,
        )
        .eq("assigned_helper_id", user.id)
        .order("created_at", { ascending: false });

      if (activeTab === "Active Tasks") {
        query = query.eq("status", "Assigned");
      } else if (activeTab === "Your Tasks") {
        query = query.eq("status", "In Progress");
      } else if (activeTab === "History") {
        query = query.eq("status", "Completed");
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.log("Error fetching tasks:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTasks();
  };

  //button

  const handleAccept = async (task) => {
    Alert.alert("Accept Task", "Start working on this case?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("help_request")
              .update({ status: "In Progress" })
              .eq("id", task.id);
            if (error) throw error;
            setActiveTab("Your Tasks");

            await createNotification({
              receiverid: task.student.accountid,
              senderid: user.id,
              title: "Request Accepted",
              data: JSON.stringify({
                type: "normal_msg",
                message: `Helper ${user.username} accepted your request.`,
              }),
            });
          } catch (e) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const handleReject = async (task) => {
    Alert.alert("Reject", "Return this task to pool?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("help_request")
              .update({ status: "Pending", assigned_helper_id: null })
              .eq("id", task.id);
            if (error) throw error;
            fetchMyTasks();
          } catch (e) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const openRiskModal = (studentId) => {
    setTargetStudentId(studentId);
    setRiskModalVisible(true);
  };

  const submitRiskLevel = async (level) => {
    try {
      const isFlagged = level === "High";
      const { error } = await supabase
        .from("account")
        .update({ risk_level: level, isflagged: isFlagged })
        .eq("accountid", targetStudentId);
      if (error) throw error;
      Alert.alert("Success", `User marked as ${level} Risk.`);
      setRiskModalVisible(false);
      fetchMyTasks();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleComplete = (task) => {
    setSelectedTask(task);
    setReportContent("");
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!reportContent.trim()) {
      Alert.alert("Required", "Please write a summary.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: reportError } = await supabase.from("task_report").insert({
        task_id: selectedTask.id,
        helper_id: user.id,
        content: reportContent,
        status: "Pending",
        created_at: new Date().toISOString(),
      });
      if (reportError) throw reportError;

      const { error: taskError } = await supabase
        .from("help_request")
        .update({ status: "Completed" })
        .eq("id", selectedTask.id);
      if (taskError) throw taskError;

      Alert.alert("Success", "Task completed!");
      setReportModalVisible(false);
      setActiveTab("History");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    const student = item.student || {};
    const imagePath = student.profileimage;
    const createdDate = new Date(item.created_at);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.avatarContainer,
              !imagePath && styles.placeholderAvatar,
            ]}
          >
            {imagePath ? (
              <Image
                source={getAvatarSource(imagePath)}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {student.username?.[0]?.toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>
              {student.username}
              {student.risk_level === "High" && (
                <Text style={{ color: "red", fontSize: 12 }}> (High Risk)</Text>
              )}
            </Text>
            <View
              style={{
                backgroundColor:
                  activeTab === "Active Tasks"
                    ? "#E3F2FD"
                    : activeTab === "Your Tasks"
                      ? "#E8F5E9"
                      : "#F5F5F5",
                alignSelf: "flex-start",
                paddingHorizontal: 6,
                borderRadius: 4,
                marginTop: 2,
              }}
            >
              <Text style={{ fontSize: 10, color: "#555", fontWeight: "bold" }}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.detailBox}>
          <Text style={styles.label}>Topic:</Text>
          <Text style={styles.value}>{item.title}</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.label}>Description:</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={14} color="gray" />
            <Text style={styles.metaText}>
              Posted: {createdDate.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Active Tasks  */}
        {activeTab === "Active Tasks" && (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[
                styles.halfBtn,
                { backgroundColor: "#FFEBEE", marginRight: 10 },
              ]}
              onPress={() => handleReject(item)}
            >
              <Feather name="x" size={18} color="#D32F2F" />
              <Text
                style={{ color: "#D32F2F", fontWeight: "bold", marginLeft: 5 }}
              >
                Reject
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.halfBtn, { backgroundColor: "#E8F5E9" }]}
              onPress={() => handleAccept(item)}
            >
              <Feather name="check" size={18} color="#2E7D32" />
              <Text
                style={{ color: "#2E7D32", fontWeight: "bold", marginLeft: 5 }}
              >
                Accept
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 2: Your Tasks */}
        {activeTab === "Your Tasks" && (
          <View style={styles.btnRow}>
            {/* Chat */}
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: "#E3F2FD" }]}
              onPress={() =>
                router.push({
                  pathname: "chatRoom",
                  params: { requestId: item.id, partnerName: student.username },
                })
              }
            >
              <Feather name="message-circle" size={20} color="#1565C0" />
            </TouchableOpacity>

            {/* Flag Risk */}
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: "#FFF3E0" }]}
              onPress={() => openRiskModal(student.accountid)}
            >
              <Feather name="flag" size={20} color="#E65100" />
            </TouchableOpacity>

            {/* Complete */}
            <TouchableOpacity
              style={[
                styles.halfBtn,
                { backgroundColor: theme.colors.primary, flex: 2 },
              ]}
              onPress={() => handleComplete(item)}
            >
              <Feather name="check-square" size={18} color="white" />
              <Text
                style={{ color: "white", fontWeight: "bold", marginLeft: 5 }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 3: History  */}
        {activeTab === "History" && (
          <View style={[styles.btnRow, { justifyContent: "flex-end" }]}>
            <Feather
              name="check-circle"
              size={14}
              color="gray"
              style={{ marginRight: 5 }}
            />
            <Text style={{ color: "gray", fontSize: 12, fontStyle: "italic" }}>
              Completed
            </Text>
          </View>
        )}
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
        <Text style={styles.title}>My Tasks</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 🔥 3 Tabs Header */}
      <View style={styles.tabsContainer}>
        {["Active Tasks", "Your Tasks", "History"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={40} color="#ccc" />
              <Text style={styles.emptyText}>
                No {activeTab.toLowerCase()} found.
              </Text>
            </View>
          )
        }
      />

      {/* Modals */}
      <Modal
        visible={riskModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRiskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Flag User Risk Level</Text>
            <Text style={{ marginBottom: 15, color: "gray" }}>
              Set risk level for this student:
            </Text>
            {["Low", "Medium", "High"].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.riskBtn,
                  {
                    backgroundColor:
                      level === "High"
                        ? "#FFEBEE"
                        : level === "Medium"
                          ? "#FFF3E0"
                          : "#E8F5E9",
                  },
                ]}
                onPress={() => submitRiskLevel(level)}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    color:
                      level === "High"
                        ? "#D32F2F"
                        : level === "Medium"
                          ? "#EF6C00"
                          : "#2E7D32",
                  }}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setRiskModalVisible(false)}
              style={{ marginTop: 15, alignSelf: "center" }}
            >
              <Text style={{ color: "gray" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Task Report</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Describe what you did:</Text>
            <TextInput
              style={styles.reportInput}
              multiline
              numberOfLines={4}
              placeholder="Summary..."
              value={reportContent}
              onChangeText={setReportContent}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={submitReport}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? "Submitting..." : "Submit & Complete"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  backBtn: { padding: 8, backgroundColor: "white", borderRadius: 12 },
  title: { fontSize: 20, fontWeight: "bold", color: "#333" },

  // Tabs Style
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: { backgroundColor: theme.colors.primary },
  tabText: { color: "#666", fontWeight: "600", fontSize: 12 },
  activeTabText: { color: "white" },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderAvatar: {
    backgroundColor: "#E0E7FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { fontSize: 18, fontWeight: "bold", color: "#4F46E5" },
  studentName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 15 },
  detailBox: { marginBottom: 12 },
  label: {
    fontSize: 12,
    color: "gray",
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  value: { fontSize: 16, color: "#333", fontWeight: "600" },
  description: { fontSize: 15, color: "#444", lineHeight: 22 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    backgroundColor: "#FAFAFA",
    padding: 10,
    borderRadius: 8,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, color: "gray", fontWeight: "500" },

  // Buttons
  btnRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  halfBtn: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modals & Empty
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  modalSubtitle: { fontSize: 14, color: "gray", marginBottom: 10 },
  riskBtn: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  reportInput: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    height: 120,
    fontSize: 15,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  emptyContainer: { alignItems: "center", marginTop: 100, gap: 10 },
  emptyText: { color: "#999", fontSize: 16 },
});
