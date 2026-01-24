import { Feather } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function StatisticsReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    completed: 0,
    completionRate: 0,
    avgMood: 0,
  });

  useEffect(() => {
    fetchStatistics();
  }, [dateFilter]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      let startDate = null;
      const now = new Date();
      if (dateFilter === "7days") {
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
      } else if (dateFilter === "30days") {
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
      }

      //  Help Requests
      let requestQuery = supabase
        .from("help_request")
        .select("status, created_at");
      if (startDate) requestQuery = requestQuery.gte("created_at", startDate);

      const { data: requestData, error: reqError } = await requestQuery;
      if (reqError) throw reqError;

      // Task Reports (Emotional Trends)
      let reportQuery = supabase
        .from("task_report")
        .select("mood_rating, created_at");
      if (startDate) reportQuery = reportQuery.gte("created_at", startDate);

      const { data: reportData, error: repError } = await reportQuery;
      if (repError) throw repError;

      const total = requestData.length;
      const pending = requestData.filter((d) => d.status === "Pending").length;
      const assigned = requestData.filter(
        (d) => d.status === "Assigned",
      ).length;
      const completed = requestData.filter(
        (d) => d.status === "Completed",
      ).length;
      const completionRate =
        total > 0 ? ((completed / total) * 100).toFixed(0) : 0;

      // Mood Rating
      let avgMood = 0;
      if (reportData && reportData.length > 0) {
        const sumMood = reportData.reduce(
          (acc, curr) => acc + (curr.mood_rating || 0),
          0,
        );
        avgMood = (sumMood / reportData.length).toFixed(1);
      }

      setStats({
        total,
        pending,
        assigned,
        completed,
        completionRate,
        avgMood,
      });
    } catch (error) {
      console.log("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatistics();
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      const htmlContent = `
            <html>
            <head>
                <style>
                    body { font-family: Helvetica, sans-serif; padding: 20px; }
                    h1 { color: #333; }
                    .card { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .label { font-weight: bold; color: #555; }
                    .value { color: #000; }
                </style>
            </head>
            <body>
                <h1>Counseling Service Report</h1>
                <p>Date Generated: ${new Date().toLocaleDateString()}</p>
                <p>Filter Range: ${dateFilter === "all" ? "All Time" : dateFilter === "7days" ? "Last 7 Days" : "Last 30 Days"}</p>
                
                <div class="card">
                    <h3>Overview</h3>
                    <div class="row"><span class="label">Total Cases:</span> <span class="value">${stats.total}</span></div>
                    <div class="row"><span class="label">Completion Rate:</span> <span class="value">${stats.completionRate}%</span></div>
                    <div class="row"><span class="label">Average Mood Outcome:</span> <span class="value">${stats.avgMood} / 10</span></div>
                </div>

                <div class="card">
                    <h3>Status Breakdown</h3>
                    <div class="row"><span class="label">Pending:</span> <span class="value">${stats.pending}</span></div>
                    <div class="row"><span class="label">Assigned:</span> <span class="value">${stats.assigned}</span></div>
                    <div class="row"><span class="label">Completed:</span> <span class="value">${stats.completed}</span></div>
                </div>
            </body>
            </html>
        `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF");
      console.log(error);
    }
  };

  const StatBar = ({ label, count, total, color }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <View style={styles.barContainer}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barLabel}>{label}</Text>
          <Text style={styles.barValue}>
            {count} ({percentage.toFixed(0)}%)
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
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
        <Text style={styles.title}>Statistics Report</Text>
        <View style={{ width: 40 }} />
      </View>

      {/*  Filter Tabs */}
      <View style={styles.filterContainer}>
        {["all", "7days", "30days"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterTab,
              dateFilter === type && styles.activeFilterTab,
            ]}
            onPress={() => setDateFilter(type)}
          >
            <Text
              style={[
                styles.filterText,
                dateFilter === type && styles.activeFilterText,
              ]}
            >
              {type === "all"
                ? "All Time"
                : type === "7days"
                  ? "Last 7 Days"
                  : "Last 30 Days"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            {/* Overview Cards */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Case Volume & Trends</Text>
              <View style={styles.row}>
                <View style={styles.statItem}>
                  <Text style={styles.bigNumber}>{stats.total}</Text>
                  <Text style={styles.smallLabel}>Total Cases</Text>
                </View>
                <View style={styles.dividerVertical} />
                <View style={styles.statItem}>
                  <Text style={[styles.bigNumber, { color: "#4CAF50" }]}>
                    {stats.completionRate}%
                  </Text>
                  <Text style={styles.smallLabel}>Completion Rate</Text>
                </View>
                <View style={styles.dividerVertical} />
                <View style={styles.statItem}>
                  <Text style={[styles.bigNumber, { color: "#9C27B0" }]}>
                    {stats.avgMood}
                  </Text>
                  <Text style={styles.smallLabel}>Avg Mood</Text>
                </View>
              </View>
            </View>

            {/* Visual bar */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Status Breakdown</Text>

              <StatBar
                label="Pending"
                count={stats.pending}
                total={stats.total}
                color="#FF9800"
              />
              <StatBar
                label="Assigned"
                count={stats.assigned}
                total={stats.total}
                color="#2196F3"
              />
              <StatBar
                label="Completed"
                count={stats.completed}
                total={stats.total}
                color="#4CAF50"
              />
            </View>

            {/* PDF Download Button */}
            <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPDF}>
              <Feather name="download" size={20} color="white" />
              <Text style={styles.pdfBtnText}>Download PDF Report</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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

  // Filters
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#eee",
  },
  activeFilterTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: { fontSize: 13, color: "gray", fontWeight: "600" },
  activeFilterText: { color: "white" },

  // Cards
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: { alignItems: "center" },
  bigNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  smallLabel: { fontSize: 11, color: "gray" },
  dividerVertical: { width: 1, height: 30, backgroundColor: "#f0f0f0" },

  // Bars
  barContainer: { marginBottom: 15 },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  barLabel: { fontSize: 14, color: "#333", fontWeight: "500" },
  barValue: { fontSize: 14, color: "gray" },
  track: {
    height: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 5,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 5 },

  // PDF Button
  pdfBtn: {
    flexDirection: "row",
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  pdfBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
