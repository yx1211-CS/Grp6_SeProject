import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function RequestHistory() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State for storing the current user's role: 'User' or 'PeerHelper'
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (user) {
      checkUserRoleAndFetch();
    }
  }, [user]);

  // Check user role first, then determine which data to fetch
  const checkUserRoleAndFetch = async () => {
    setLoading(true);
    try {
      // Check the 'account' table to identify the user
      const { data: accountData, error: roleError } = await supabase
        .from("account")
        .select("role")
        .eq("accountid", user.id)
        .single();

      if (roleError) throw roleError;

      const role = accountData?.role;
      setUserRole(role);

      // Execute different queries based on the retrieved role
      await fetchRequests(role);
    } catch (error) {
      console.log("Error init:", error);
      setLoading(false);
    }
  };

  //Fetches requests based on user role
  const fetchRequests = async (role) => {
    let query = supabase
      .from("help_request")
      .select(
        `
                *,
                student:account!student_id(username, profileimage),
                helper:account!assigned_helper_id(username, profileimage)
            `,
      )
      .order("created_at", { ascending: false });

    // Role-based Filtering
    if (role === "PeerHelper") {
      //If user is a Helper -> Fetch tasks assigned specifically to them
      query = query.eq("assigned_helper_id", user.id);
    } else {
      // If user is a user role) -> Fetch help requests they created
      query = query.eq("student_id", user.id);
    }

    const { data, error } = await query;

    if (!error) {
      setRequests(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  //Handles pull-to-refresh functionality
  const onRefresh = () => {
    setRefreshing(true);
    // Reuse known role if available to skip one DB query, otherwise re-initialize
    if (userRole) fetchRequests(userRole);
    else checkUserRoleAndFetch();
  };

  //Logic for Helper to accept an assigned task
  const handleAccept = async (item) => {
    const { error } = await supabase
      .from("help_request")
      .update({ status: "In Progress" })
      .eq("id", item.id);
    if (!error) onRefresh();
  };

  //Renders each individual request card
  const renderItem = ({ item }) => {
    const isStudent = userRole === "Student"; // Note: Compare with 'User' or 'PeerHelper' based on your DB values
    const isHelper = userRole === "PeerHelper";

    // Display Name Logic: Students see the Helper's name; Helpers see the Student's name
    const targetName = isStudent
      ? item.helper?.username || "Waiting..."
      : item.student?.username || "Anonymous Student";

    //Interaction Logic: Show chat only if task is active; show Accept button only for Helpers
    const showChat = item.status === "In Progress";
    const showAccept = isHelper && item.status === "Assigned"; // Helper 且刚分配

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.desc}>{item.description}</Text>

        <View style={styles.footer}>
          <Feather name="user" size={14} color="gray" />
          <Text style={styles.footerText}>
            {isStudent ? `Helper: ${targetName}` : `Student: ${targetName}`}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {/*  Helper acceptbutton*/}
          {showAccept && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleAccept(item)}
            >
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
          )}

          {/* Chat Button (Needed by both parties once in progress)*/}
          {showChat && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#4CAF50" }]}
              onPress={() =>
                router.push({
                  pathname: "chatRoom",
                  params: {
                    requestId: item.id,
                    partnerName: targetName,
                  },
                })
              }
            >
              <Feather name="message-circle" size={18} color="white" />
              <Text style={styles.btnText}>Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper bg="#F8F9FD">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>
          {userRole === "PeerHelper" ? "My Tasks" : "My Requests"}
        </Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 50, color: "gray" }}>
            {loading ? "Loading..." : "No records found."}
          </Text>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 15 },
  backBtn: { padding: 8, backgroundColor: "white", borderRadius: 10 },
  pageTitle: { fontSize: 20, fontWeight: "bold" },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: "bold", color: "#333" },
  badge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: "bold", color: "#1565C0" },
  desc: { color: "#666", marginBottom: 15 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 10,
  },
  footerText: { color: "gray", fontSize: 12 },
  actionRow: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  btnText: { color: "white", fontWeight: "bold", fontSize: 13 },
});
