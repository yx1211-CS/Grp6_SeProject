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
import { supabase } from "../../lib/supabase";
import { createNotification } from "../../services/notificationService";
export default function UserFeedback() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select(
          `
            *,
            user:userid (
                username,
                profileimage
            )
        `,
        )
        .eq("status", "Pending")
        .order("feedbacksubmittime", { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.log("Error fetching feedback:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeedbacks();
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setAdminNote(item.admin_note || "");
    setReplyMessage(item.admin_reply || "");
    setModalVisible(true);
  };

  const handleUpdate = async (newStatus) => {
    if (!selectedItem) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      if (!currentUserId) {
        Alert.alert("Error", "cant get counselor details");
        return;
      }
      //update feednack list
      const { error: feedbackError } = await supabase
        .from("feedback")
        .update({
          status: newStatus,
          admin_note: adminNote,
          admin_reply: replyMessage,
        })
        .eq("feedbackid", selectedItem.feedbackid);

      if (feedbackError) throw feedbackError;

      // send repply message
      if (replyMessage.trim()) {
        const res = await createNotification({
          receiverid: selectedItem.userid,
          senderid: currentUserId,
          title: "Feedback Reply 💬",
          data: JSON.stringify({
            type: "feedback_reply",
            message: replyMessage,
          }),
        });

        if (res.success) {
          console.log("✅ Reply sent successfully!");
          Alert.alert(
            "Success",
            `Feedback marked as ${newStatus} and user notified.`,
          );
        } else {
          console.log("❌ Notification failed:", res.msg);
          Alert.alert(
            "Partial Success",
            `Feedback updated, but notification failed: ${res.msg}`,
          );
        }
      } else {
        Alert.alert("Success", `Feedback marked as ${newStatus}`);
      }

      setModalVisible(false);
      fetchFeedbacks();
    } catch (error) {
      console.log("handleUpdate error: ", error);
      Alert.alert("Error", error.message);
    }
  };

  const renderItem = ({ item }) => {
    const user = item.user || {};
    const name = user.username || "Anonymous";
    const date = item.feedbacksubmittime
      ? new Date(item.feedbacksubmittime).toLocaleDateString()
      : "Unknown";

    return (
      <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            {item.feedbackcategory && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.feedbackcategory}</Text>
              </View>
            )}
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pending</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.content} numberOfLines={2}>
          {item.feedbackmessage}
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
        <Text style={styles.title}>Pending Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={feedbacks}
        keyExtractor={(item) => item.feedbackid.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Feather name="check-circle" size={50} color="#4CAF50" />
              <Text style={styles.emptyText}>All caught up!</Text>
              <Text style={styles.subEmptyText}>
                No pending feedback to review.
              </Text>
            </View>
          )
        }
      />

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
              <Text style={styles.modalTitle}>Review Feedback</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.detailSection}>
                <Text style={styles.label}>User:</Text>
                <Text style={styles.value}>
                  @{selectedItem?.user?.username}
                </Text>

                <Text style={[styles.label, { marginTop: 10 }]}>Message:</Text>
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>
                    {selectedItem?.feedbackmessage}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Internal Note</Text>
              <TextInput
                style={styles.input}
                placeholder="Add a note for records..."
                value={adminNote}
                onChangeText={setAdminNote}
                multiline
              />

              <Text style={styles.sectionTitle}>Reply to User</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Write a reply..."
                value={replyMessage}
                onChangeText={setReplyMessage}
                multiline
              />

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#2196F3" }]}
                  onPress={() => handleUpdate("Reviewed")}
                >
                  <Feather name="archive" size={18} color="white" />
                  <Text style={styles.btnText}>Mark Reviewed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
                  onPress={() => handleUpdate("Resolved")}
                >
                  <Feather name="check" size={18} color="white" />
                  <Text style={styles.btnText}>Mark Resolved</Text>
                </TouchableOpacity>
              </View>
              <Text
                style={{
                  textAlign: "center",
                  marginTop: 15,
                  color: "gray",
                  fontSize: 12,
                }}
              >
                * Marking as Reviewed/Resolved will remove it from this list.
              </Text>
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
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  userName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  date: { fontSize: 12, color: "gray", marginTop: 2 },
  categoryBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  categoryText: { color: "#1976D2", fontSize: 10, fontWeight: "bold" },
  statusBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: { fontSize: 10, fontWeight: "bold", color: "#FF9800" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 10 },
  content: { fontSize: 14, color: "#444", lineHeight: 20 },

  emptyContainer: { alignItems: "center", marginTop: 100, gap: 10 },
  emptyText: { color: "#333", fontSize: 18, fontWeight: "bold" },
  subEmptyText: { color: "#999", fontSize: 14 },

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
  messageBox: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  messageText: { fontSize: 14, color: "#444", lineHeight: 22 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 10,
    textAlignVertical: "top",
  },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnText: { color: "white", fontWeight: "bold" },
});
