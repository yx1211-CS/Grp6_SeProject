import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function CounselorDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    pendingApplications: 0,
    approvedToday: 0,
    pendingRequests: 0,
    activeCases: 0,
  });

  const fetchStats = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      // 1. Helper Applications
      const { count: appPendingCount } = await supabase
        .from("helper_application")
        .select("*", { count: "exact", head: true })
        .eq("helperstatus", "Pending");

      const { count: appProcessedCount } = await supabase
        .from("helper_application")
        .select("*", { count: "exact", head: true })
        .neq("helperstatus", "Pending")
        .gte("applicationapprovaldate", todayStr);

      // 2. Student Requests
      const { count: reqPendingCount } = await supabase
        .from("help_request")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pending");

      const { count: reqActiveCount } = await supabase
        .from("help_request")
        .select("*", { count: "exact", head: true })
        .eq("status", "Assigned");

      setStats({
        pendingApplications: appPendingCount || 0,
        approvedToday: appProcessedCount || 0,
        pendingRequests: reqPendingCount || 0,
        activeCases: reqActiveCount || 0,
      });
    } catch (error) {
      console.log("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/counselor/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.roleTitle}>Counselor</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* 🚨 section 1: Student Help Requests */}
        <Text style={styles.sectionTitle}>Student Cases</Text>
        <View style={styles.statsContainer}>
          {/* Pending Requests */}
          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: "#FFF3E0", borderColor: "#FFE0B2" },
            ]}
            onPress={() => router.push("/counselor/assignment")}
          >
            <Text style={[styles.statNumber, { color: "#E65100" }]}>
              {loading ? "-" : stats.pendingRequests}
            </Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
            <Text style={styles.statSubLabel}>Wait for assignment</Text>
          </TouchableOpacity>

          {/* Active Cases */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: "#E3F2FD", borderColor: "#BBDEFB" },
            ]}
          >
            <Text style={[styles.statNumber, { color: "#1565C0" }]}>
              {loading ? "-" : stats.activeCases}
            </Text>
            <Text style={styles.statLabel}>Active Cases</Text>
            <Text style={styles.statSubLabel}>Being handled</Text>
          </View>
        </View>

        {/* 🟢 section 2: Helper Applications */}
        <Text style={styles.sectionTitle}>Helper Applications</Text>
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: "#E8F5E9", borderColor: "#C8E6C9" },
            ]}
            onPress={() => router.push("/counselor/applications")}
          >
            <Text style={[styles.statNumber, { color: "#2E7D32" }]}>
              {loading ? "-" : stats.pendingApplications}
            </Text>
            <Text style={styles.statLabel}>New Applications</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.statCard,
              { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
            ]}
          >
            <Text style={[styles.statNumber, { color: "#424242" }]}>
              {loading ? "-" : stats.approvedToday}
            </Text>
            <Text style={styles.statLabel}>Processed Today</Text>
          </View>
        </View>

        {/* 👇👇👇 MENU: 这里的图标改回了 Emoji 👇👇👇 */}
        <Text style={styles.sectionTitle}>Menu</Text>

        {/* 2. Review Applications */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/counselor/applications")}
        >
          <View style={[styles.iconBox, { backgroundColor: "#FFF3E0" }]}>
            <Text style={styles.icon}>📋</Text>
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Review Applications</Text>
            <Text style={styles.actionDesc}>
              Check student peer helper applications
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* 3. Manage Helpers */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/counselor/manageHelpers")}
        >
          <View style={[styles.iconBox, { backgroundColor: "#F3E5F5" }]}>
            <Text style={styles.icon}>💬</Text>
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Manage Helpers</Text>
            <Text style={styles.actionDesc}>Revoke status & Assign tasks</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* 4. Service Feedback */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/counselor/feedback")}
        >
          <View style={[styles.iconBox, { backgroundColor: "#E0F7FA" }]}>
            <Text style={styles.icon}>⭐</Text>
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Service Feedback</Text>
            <Text style={styles.actionDesc}>Complaints & compliments</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* 5. Helper Reports */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/counselor/helperReports")}
        >
          <View style={[styles.iconBox, { backgroundColor: "#E8EAF6" }]}>
            <Text style={styles.icon}>📑</Text>
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Helper Reports</Text>
            <Text style={styles.actionDesc}>Review reports from helpers</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FD" },
  content: { padding: 24, paddingBottom: 50 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    marginTop: 10,
  },
  greeting: { fontSize: 16, color: "#A0AEC0" },
  roleTitle: { fontSize: 26, fontWeight: "bold", color: "#2D3748" },
  logoutBtn: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logoutText: { color: "#C62828", fontWeight: "600", fontSize: 12 },

  // Statistics
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 15,
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 15,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "flex-start",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  statNumber: { fontSize: 28, fontWeight: "bold", marginBottom: 2 },
  statLabel: { fontSize: 14, color: "#333", fontWeight: "600" },
  statSubLabel: { fontSize: 11, color: "#666", marginTop: 2 },

  // Action Cards (Menu)
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  icon: { fontSize: 24 }, // 控制 Emoji 大小
  actionTextContainer: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: "bold", color: "#2D3748" },
  actionDesc: { fontSize: 13, color: "#A0AEC0", marginTop: 2 },
  arrow: { fontSize: 20, color: "#CBD5E0", fontWeight: "bold" },
});
