import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { supabase } from "../../lib/supabase";

export default function MoodHistory() {
  const router = useRouter();
  const { userId, userName } = useLocalSearchParams();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchMoodHistory();
  }, [userId]);

  const fetchMoodHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("mood")
        .select("*")
        .eq("userid", userId)
        .order("moodcreatedat", { ascending: false });

      if (error) throw error;
      setMoods(data || []);
    } catch (error) {
      console.log("Error fetching moods:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodStyle = (moodName) => {
    const m = moodName?.toLowerCase() || "";
    if (m.includes("happy") || m.includes("good") || m.includes("excited"))
      return { color: "#4CAF50", icon: "smile" };
    if (m.includes("sad") || m.includes("bad") || m.includes("anxious"))
      return { color: "#F44336", icon: "frown" };
    if (m.includes("neutral") || m.includes("okay"))
      return { color: "#FF9800", icon: "meh" };
    return { color: "#2196F3", icon: "activity" };
  };

  const renderItem = ({ item }) => {
    const { color, icon } = getMoodStyle(item.currentmood);
    const date = new Date(item.moodcreatedat);

    return (
      <View style={styles.timelineItem}>
        {/* lest */}
        <View style={styles.timelineLeft}>
          <Text style={styles.timeText}>
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
        </View>

        {/* middlee */}
        <View style={styles.timelineCenter}>
          <View style={[styles.dot, { backgroundColor: color }]}>
            <Feather name={icon} size={12} color="white" />
          </View>
          <View style={styles.line} />
        </View>

        {/* right */}
        <View style={styles.card}>
          <Text style={[styles.moodTitle, { color: color }]}>
            {item.currentmood}
          </Text>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
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
        <View>
          <Text style={styles.title}>Mood History</Text>
          <Text style={styles.subTitle}>User: {userName || "Unknown"}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4F46E5"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={moods}
          keyExtractor={(item) => item.moodid.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No mood logs available for this user。
              </Text>
            </View>
          }
        />
      )}
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
  subTitle: { fontSize: 12, color: "gray" },

  timelineItem: { flexDirection: "row", marginBottom: 0 },
  timelineLeft: {
    width: 70,
    alignItems: "flex-end",
    paddingRight: 10,
    paddingTop: 4,
  },
  timeText: { fontWeight: "bold", fontSize: 12, color: "#333" },
  dateText: { fontSize: 10, color: "gray" },

  timelineCenter: { alignItems: "center", width: 30 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#E0E0E0",
    marginTop: -2,
    marginBottom: -2,
  },

  card: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 1,
  },
  moodTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  note: { color: "#555", fontSize: 13, lineHeight: 18 },

  emptyContainer: { alignItems: "center", marginTop: 50, gap: 10 },
  emptyText: { color: "gray" },
});
