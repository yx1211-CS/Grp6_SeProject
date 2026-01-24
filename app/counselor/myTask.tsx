import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function MyTasks() {
  const router = useRouter();
  const { user } = useAuth(); // 获取当前登录的 Helper
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Active"); // 'Active' | 'Completed'

  useEffect(() => {
    if (user) fetchMyTasks();
  }, [user, activeTab]);

  const getAvatarSource = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return { uri: path };
    const { data } = supabase.storage.from("postimages").getPublicUrl(path);
    return { uri: data.publicUrl };
  };

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      // 查询状态：如果是 Active Tab，查 'Assigned'；如果是 Completed Tab，查 'Completed'
      const statusFilter = activeTab === "Active" ? "Assigned" : "Completed";

      const { data, error } = await supabase
        .from("help_request")
        .select(
          `
            *,
            student:help_request_student_id_fkey (
                username,
                phonenumber,
                email,
                profileimage
            )
        `,
        )
        .eq("assigned_helper_id", user.id)
        .eq("status", statusFilter)
        .order("created_at", { ascending: false });

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

  const handleComplete = (task) => {
    // 跳转到提交报告的页面（还没有）
    Alert.alert(
      "Complete Task",
      "Have you finished helping this student? You should submit a report.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Report",
          onPress: () => {
            // router.push({ pathname: '/peerHelper/submitReport', params: { taskId: task.id } });
            markAsCompleted(task.id);
          },
        },
      ],
    );
  };

  const markAsCompleted = async (taskId) => {
    try {
      const { error } = await supabase
        .from("help_request")
        .update({ status: "Completed" })
        .eq("id", taskId);

      if (error) throw error;

      Alert.alert("Success", "Task marked as completed!");
      fetchMyTasks();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const renderItem = ({ item }) => {
    const student = item.student || {};
    const imagePath = student.profileimage;

    const createdDate = new Date(item.created_at);
    const dueDate = new Date(createdDate);
    dueDate.setDate(createdDate.getDate() + 7);

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
              {student.full_name || student.username}
            </Text>
            <Text style={styles.studentId}>@{student.username}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* taskdetails */}
        <View style={styles.detailBox}>
          <Text style={styles.label}>Topic:</Text>
          <Text style={styles.value}>{item.title}</Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.label}>Description / Instructions:</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={14} color="gray" />
            <Text style={styles.metaText}>
              Assigned: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color="#D32F2F" />
            <Text style={[styles.metaText, { color: "#D32F2F" }]}>
              Due: {dueDate.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* bottondebutton */}
        {activeTab === "Active" && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleComplete(item)}
          >
            <Feather name="check-square" size={18} color="white" />
            <Text style={styles.actionText}>Mark as Completed</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper bg="#F8F9FD">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Tasks</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Active" && styles.activeTab]}
          onPress={() => setActiveTab("Active")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Active" && styles.activeTabText,
            ]}
          >
            Active Tasks
          </Text>
        </TouchableOpacity>
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
              <Feather name="clipboard" size={50} color="#ccc" />
              <Text style={styles.emptyText}>
                No {activeTab.toLowerCase()} tasks found.
              </Text>
            </View>
          )
        }
      />
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

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "white",
  },
  activeTab: { backgroundColor: theme.colors.primary },
  tabText: { color: "#666", fontWeight: "600" },
  activeTabText: { color: "white" },

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  avatarText: { fontSize: 20, fontWeight: "bold", color: "#4F46E5" },
  studentName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  studentId: { fontSize: 13, color: "gray" },
  callBtn: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 20,
    marginLeft: "auto",
  },

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

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  actionText: { color: "white", fontWeight: "bold", fontSize: 16 },

  emptyContainer: { alignItems: "center", marginTop: 100, gap: 10 },
  emptyText: { color: "#999", fontSize: 16 },
});
