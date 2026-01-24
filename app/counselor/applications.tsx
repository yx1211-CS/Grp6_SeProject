import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { supabase } from "../../lib/supabase";

export default function CounselorApplications() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("helper_application")
        .select("*")
        .eq("helperstatus", "Pending")
        .order("applicationsubmissiondate", { ascending: false });

      if (error) throw error;
      setApps(data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch applications");
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const handleApprove = (application) => {
    Alert.alert(
      "Confirm Approve",
      `Make ${application.full_name} a Peer Helper?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setLoading(true);
            try {
              // approve
              const { error: appError } = await supabase
                .from("helper_application")
                .update({
                  helperstatus: "Approved",
                  applicationapprovaldate: new Date().toISOString(),
                })
                .eq("applicationid", application.applicationid);

              if (appError) throw appError;

              // update role
              const { error: userError } = await supabase
                .from("account")
                .update({ role: "PeerHelper" })
                .eq("accountid", application.userid);

              if (userError) throw userError;

              Alert.alert("Success", "User is now a Peer Helper!");
              fetchApplications();
            } catch (error) {
              Alert.alert("Error", error.message);
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  //reject
  const handleReject = (application) => {
    Alert.alert("Reject Application", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            const { error } = await supabase
              .from("helper_application")
              .update({ helperstatus: "Rejected" })
              .eq("applicationid", application.applicationid);

            if (error) throw error;

            fetchApplications();
          } catch (error) {
            Alert.alert("Error", error.message);
            setLoading(false);
          }
        },
      },
    ]);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.applicationid;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => toggleExpand(item.applicationid)}
      >
        {/* Header Section */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.full_name ? item.full_name[0].toUpperCase() : "?"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.studentId}>ID: {item.student_id}</Text>
          </View>
          <Feather
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="gray"
          />
        </View>

        {isExpanded && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Reason:</Text>
              <Text style={styles.value}>{item.reason}</Text>
            </View>

            {item.experience ? (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Experience:</Text>
                <Text style={styles.value}>{item.experience}</Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleReject(item)}
              >
                <Feather name="x" size={18} color="#D32F2F" />
                <Text style={[styles.btnText, { color: "#D32F2F" }]}>
                  Reject
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleApprove(item)}
              >
                <Feather name="check" size={18} color="white" />
                <Text style={[styles.btnText, { color: "white" }]}>
                  Approve
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper bg="#F8F9FD">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Pending Applications</Text>
      </View>

      {/* List */}
      <FlatList
        data={apps}
        keyExtractor={(item) => item.applicationid?.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={50} color="#ccc" />
              <Text style={styles.emptyText}>
                No pending applications found
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
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  backBtn: {
    padding: 8,
    backgroundColor: "white",
    borderRadius: 12,
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },

  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0F2F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#009688",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  studentId: {
    fontSize: 13,
    color: "gray",
  },

  // Expanded Details
  detailsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: "gray",
    fontWeight: "600",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 15,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 15,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  rejectBtn: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
  },
  approveBtn: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  btnText: {
    fontWeight: "bold",
    fontSize: 14,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
    gap: 10,
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
  },
});
