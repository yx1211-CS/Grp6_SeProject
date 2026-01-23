import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function CounselorAssignment() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [helpers, setHelpers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // 筛选状态 'all' | 'available' | 'busy'
  const [filterType, setFilterType] = useState("all");

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchRequests(), fetchHelpers()]);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getAvatarSource = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return { uri: path };
    const { data } = supabase.storage.from("postImages").getPublicUrl(path);
    return { uri: data.publicUrl };
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("help_request")
        .select(
          `
            *,
            student:help_request_student_id_fkey (
                username, 
                profileimage
            )
        `,
        )
        .eq("status", "Pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.log("Fetch Requests Error:", error);
    }
  };

  const fetchHelpers = async () => {
    try {
      const { data, error } = await supabase
        .from("account")
        .select(
          `
            *,
            helper_application:helper_application_userid_fkey (
                full_name
            ),
            assigned_tasks:help_request!assigned_helper_id (
                id
            )
        `,
        )
        .eq("role", "PeerHelper")
        .eq("assigned_tasks.status", "Assigned")
        .order("username", { ascending: true });

      if (error) throw error;
      setHelpers(data || []);
    } catch (error) {
      console.log("Fetch Helpers Error:", error);
    }
  };

  const openAssignModal = (request) => {
    setSelectedRequest(request);
    setFilterType("available"); // 默认只看 Available 的人
    setModalVisible(true);
  };

  // 👇👇👇 核心修改：严格禁止分配给 Busy Helper 👇👇👇
  const handleAssign = async (helper) => {
    const taskCount = helper.assigned_tasks?.length || 0;

    // 🚫 严格拦截
    if (taskCount >= 3) {
      Alert.alert(
        "Helper Unavailable",
        `@${helper.username} is currently overwhelmed (${taskCount} active tasks). \nPlease select an 'Available' helper.`,
        [{ text: "OK" }],
      );
      return; // 直接结束，不给分配机会
    }

    // 只有不忙的时候，才允许分配
    executeAssign(helper);
  };

  const executeAssign = async (helper) => {
    if (!selectedRequest) return;
    const studentName = selectedRequest.student?.username || "Student";
    const helperName =
      (helper.helper_application && helper.helper_application[0]?.full_name) ||
      helper.username;

    Alert.alert(
      "Confirm Assignment",
      `Assign ${studentName}'s case to ${helperName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Assign",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("help_request")
                .update({
                  status: "Assigned",
                  assigned_helper_id: helper.accountid,
                })
                .eq("id", selectedRequest.id);

              if (error) throw error;

              Alert.alert("Success", "Task assigned successfully!");
              setModalVisible(false);
              fetchData();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ],
    );
  };

  const getFilteredHelpers = () => {
    return helpers.filter((h) => {
      const count = h.assigned_tasks?.length || 0;
      if (filterType === "busy") return count >= 3;
      if (filterType === "available") return count < 3;
      return true;
    });
  };

  const renderRequestItem = ({ item }) => {
    const student = item.student || {};
    const imagePath = student.profileimage;
    const displayName = student.username || "Unknown Student";

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
                {displayName[0]?.toUpperCase() || "?"}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>@{displayName}</Text>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.reqTitle}>{item.title}</Text>
        <Text style={styles.reqDesc}>{item.description}</Text>

        <TouchableOpacity
          style={styles.assignBtn}
          onPress={() => openAssignModal(item)}
        >
          <Feather name="user-plus" size={18} color="white" />
          <Text style={styles.assignBtnText}>Select Helper</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHelperItem = ({ item }) => {
    const imagePath = item.profileimage || item.profileImage;
    const realName =
      (item.helper_application && item.helper_application[0]?.full_name) ||
      item.username;

    const taskCount = item.assigned_tasks?.length || 0;
    const isBusy = taskCount >= 3;
    const statusColor = isBusy ? "#F44336" : "#4CAF50";
    const statusText = isBusy ? "Busy" : "Available";

    return (
      <TouchableOpacity
        style={[
          styles.helperCard,
          isBusy && { opacity: 0.6, backgroundColor: "#F5F5F5" },
        ]} // 视觉上变灰
        onPress={() => handleAssign(item)}
      >
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
              {item.username[0]?.toUpperCase() || "?"}
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.helperName, isBusy && { color: "#999" }]}>
            {realName}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Text style={styles.helperUsername}>@{item.username}</Text>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText} ({taskCount})
              </Text>
            </View>
          </View>
        </View>

        {/* 如果 Busy，显示禁止图标；否则显示箭头 */}
        {isBusy ? (
          <Feather name="slash" size={20} color="#ccc" />
        ) : (
          <Feather
            name="arrow-right-circle"
            size={24}
            color={theme.colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper bg="#F8F9FD">
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Task Assignment</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRequestItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Feather name="check-circle" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No pending requests!</Text>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select a Helper</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            {["all", "available", "busy"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterTab,
                  filterType === type && styles.activeFilterTab,
                ]}
                onPress={() => setFilterType(type)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filterType === type && styles.activeFilterText,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalSubHeader}>
            <Text style={{ color: "gray" }}>Assigning case for: </Text>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              @{selectedRequest?.student?.username || "Student"}
            </Text>
          </View>

          <FlatList
            data={getFilteredHelpers()}
            keyExtractor={(item) => item.accountid.toString()}
            renderItem={renderHelperItem}
            contentContainerStyle={{ padding: 20 }}
            ListEmptyComponent={
              <Text
                style={{ textAlign: "center", marginTop: 20, color: "gray" }}
              >
                No helpers found for "{filterType}".
              </Text>
            }
          />
        </View>
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
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  studentName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  date: { fontSize: 12, color: "gray" },
  pendingBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingText: { color: "#FF9800", fontSize: 11, fontWeight: "bold" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 12 },
  reqTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  reqDesc: { fontSize: 14, color: "#555", lineHeight: 20, marginBottom: 15 },
  assignBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  assignBtnText: { color: "white", fontWeight: "bold", fontSize: 15 },

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
  emptyContainer: { alignItems: "center", marginTop: 100, gap: 10 },
  emptyText: { color: "#999", fontSize: 16 },

  modalContainer: { flex: 1, backgroundColor: "#F8F9FD" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  closeText: { color: theme.colors.primary, fontSize: 16, fontWeight: "600" },
  modalSubHeader: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  filterContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "white",
    justifyContent: "center",
    gap: 10,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  activeFilterTab: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  activeFilterText: {
    color: "white",
  },

  helperCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
  },
  helperName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  helperUsername: { fontSize: 13, color: "gray" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
});
