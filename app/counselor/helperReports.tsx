import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
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

export default function HelperReports() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [counselorReply, setCounselorReply] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("task_report")
        .select(
          `
          *,
          helper:helper_id (username),
          task:task_id (title)
        `,
        )
        .neq("status", "Closed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.log("Error fetching reports:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const openModal = (item) => {
    setSelectedReport(item);
    setCounselorReply(item.counselor_reply || "");
    setModalVisible(true);
  };

  //  Send Command / Reply
  const handleSendCommand = async () => {
    if (!counselorReply.trim()) {
      Alert.alert("Error", "Please enter a command/message.");
      return;
    }
    try {
      const { error } = await supabase
        .from("task_report")
        .update({ counselor_reply: counselorReply })
        .eq("id", selectedReport.id);

      if (error) throw error;

      //send reply to user
      await createNotification({
        receiverid: selectedReport.helper_id,
        senderid: user?.id,
        title: "New message from counselor ",
        data: JSON.stringify({
          type: "report_reply",
          message: counselorReply,
          reportId: selectedReport.id,
        }),
      });
      // ---------------------------------------------------------

      Alert.alert("Sent", "Successful sent to peer helper already.");
      setSelectedReport({ ...selectedReport, counselor_reply: counselorReply });
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // Mark as High Priority
  const handleMarkHighPriority = async () => {
    try {
      const { error } = await supabase
        .from("task_report")
        .update({ is_high_priority: true })
        .eq("id", selectedReport.id);

      if (error) throw error;

      //report feedback
      await createNotification({
        receiverid: selectedReport.helper_id,
        senderid: user?.id,
        title: "Report Reviewed",
        data: JSON.stringify({
          type: "report_reply",
          message: "Your task report has been reviewed and closed. Good job!",
          reportId: selectedReport.id,
        }),
      });
      // ---------------------------------------------------------
      Alert.alert("Marked", "Report marked as High Priority.");
      setModalVisible(false);
      fetchReports();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  //  Mark as Reviewed
  const handleMarkReviewed = async () => {
    try {
      const { error } = await supabase
        .from("task_report")
        .update({ status: "Closed" })
        .eq("id", selectedReport.id);

      if (error) throw error;

      Alert.alert("Success", "Report marked as reviewed and closed.");
      setModalVisible(false);
      fetchReports();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const renderItem = ({ item }) => {
    const helperName = item.helper?.username || "Unknown Helper";
    const date = new Date(item.created_at).toLocaleDateString();

    const isPriority = item.is_high_priority;
    const borderColor = isPriority ? "#F44336" : "transparent";
    const bgColor = isPriority ? "#FFEBEE" : "white";

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: isPriority ? 1 : 0,
          },
        ]}
        onPress={() => openModal(item)}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text
              style={[styles.helperName, isPriority && { color: "#D32F2F" }]}
            >
              {helperName} {isPriority && "🔥"}
            </Text>
            <Text style={styles.taskTitle}>
              Task: {item.task?.title || "Untitled"}
            </Text>
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.content} numberOfLines={2}>
          {item.content}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper bg="#F8F9FD">
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Pending Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Feather name="check-circle" size={50} color="#4CAF50" />
              <Text style={styles.emptyText}>All reports reviewed!</Text>
            </View>
          )
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Report</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* Info */}
              <View style={styles.detailSection}>
                <Text style={styles.label}>Helper:</Text>
                <Text style={styles.value}>
                  {selectedReport?.helper?.username}
                </Text>

                <Text style={[styles.label, { marginTop: 10 }]}>Task:</Text>
                <Text style={styles.value}>{selectedReport?.task?.title}</Text>

                <Text style={[styles.label, { marginTop: 10 }]}>
                  Report Content:
                </Text>
                <View style={styles.contentBox}>
                  <Text style={styles.contentText}>
                    {selectedReport?.content}
                  </Text>
                </View>
              </View>

              {/* Send Command */}
              <Text style={styles.sectionTitle}>Send Command / Reply</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Message to helper..."
                  value={counselorReply}
                  onChangeText={setCounselorReply}
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={handleSendCommand}
                >
                  <Feather name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>

              {/* Actions */}
              <Text style={styles.sectionTitle}>Actions</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: "#FFEBEE",
                      borderWidth: 1,
                      borderColor: "#FFCDD2",
                    },
                  ]}
                  onPress={handleMarkHighPriority}
                >
                  <Feather name="alert-triangle" size={18} color="#D32F2F" />
                  <Text style={[styles.btnText, { color: "#D32F2F" }]}>
                    High Priority
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleMarkReviewed}
                >
                  <Feather name="check" size={18} color="white" />
                  <Text style={[styles.btnText, { color: "white" }]}>
                    Mark Reviewed
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    marginBottom: 10,
  },
  backBtn: { padding: 8, backgroundColor: "white", borderRadius: 12 },
  title: { fontSize: 20, fontWeight: "bold", color: "#333" },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  helperName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  taskTitle: { fontSize: 13, color: "gray" },
  date: { fontSize: 12, color: "gray" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 10 },
  content: { fontSize: 14, color: "#444", lineHeight: 20 },
  moodBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moodText: { fontSize: 11, color: "#1565C0", fontWeight: "bold" },

  emptyContainer: { alignItems: "center", marginTop: 100, gap: 10 },
  emptyText: { color: "#999", fontSize: 16 },

  modalContainer: { flex: 1, backgroundColor: "#F8F9FD" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  closeText: { color: theme.colors.primary, fontSize: 16, fontWeight: "600" },

  detailSection: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: { fontSize: 12, color: "gray", fontWeight: "bold", marginBottom: 4 },
  value: { fontSize: 16, fontWeight: "600", color: "#333" },
  contentBox: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  contentText: { fontSize: 14, color: "#444", lineHeight: 22 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: "#2196F3",
    width: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  actionRow: { flexDirection: "row", gap: 10, marginBottom: 30 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnText: { fontWeight: "bold" },
});
