import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";

// CORRECT IMPORT: Importing from userService where we added the function
import { getMoodHistory } from "../../services/userService";

export default function CounselorMoodHistory() {
  const router = useRouter();

  // Get parameters passed from UserListMood
  const { userId, userName } = useLocalSearchParams();

  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserMoods();
    } else {
      Alert.alert("Error", "No User ID provided");
      setLoading(false);
    }
  }, [userId]);

  const fetchUserMoods = async () => {
    setLoading(true);
    // Call the service we just fixed
    const res = await getMoodHistory(userId);

    if (res.success) {
      setMoods(res.data || []);
    } else {
      Alert.alert("Error", res.msg);
    }
    setLoading(false);
  };

  const getMoodStyle = (moodName) => {
    const m = moodName?.toLowerCase() || "";
    if (m.includes("happy") || m.includes("good") || m.includes("excited"))
      return { color: "#4CAF50", icon: "smile", bg: "#E8F5E9" };
    if (m.includes("sad") || m.includes("bad") || m.includes("anxious"))
      return { color: "#F44336", icon: "frown", bg: "#FFEBEE" };
    if (m.includes("neutral") || m.includes("okay"))
      return { color: "#FF9800", icon: "meh", bg: "#FFF3E0" };
    if (m.includes("tired"))
      return { color: "#607D8B", icon: "battery", bg: "#ECEFF1" };
    return { color: "#2196F3", icon: "activity", bg: "#E3F2FD" };
  };

  const renderMoodItem = ({ item }) => {
    const { color, icon } = getMoodStyle(item.currentmood);
    const date = new Date(item.moodcreatedat);

    return (
      <View style={styles.cardContainer}>
        {/* Left: Time */}
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <Text style={styles.dateText}>
            {date.toLocaleDateString([], { month: "short", day: "numeric" })}
          </Text>
        </View>

        {/* Middle: Line */}
        <View style={styles.connectorColumn}>
          <View style={[styles.dot, { backgroundColor: color }]}>
            <Feather name={icon} size={10} color="white" />
          </View>
          <View style={styles.line} />
        </View>

        {/* Right: Card */}
        <View
          style={[
            styles.moodCard,
            { borderColor: color, backgroundColor: "white" },
          ]}
        >
          <Text style={[styles.moodTitle, { color: color }]}>
            {item.currentmood}
          </Text>
          {item.note ? (
            <Text style={styles.noteText}>{item.note}</Text>
          ) : (
            <Text style={styles.emptyNoteText}>No notes added</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.textDark} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Mood History</Text>
          <Text style={styles.headerSubtitle}>
            Viewing: {userName || "Client"}
          </Text>
        </View>
      </View>

      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={moods}
            keyExtractor={(item) => item.moodid.toString()}
            renderItem={renderMoodItem}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="clipboard" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No mood records found.</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: wp(4) },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: wp(4),
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontWeight: "bold",
    color: theme.colors.textDark,
  },
  headerSubtitle: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  cardContainer: { flexDirection: "row", marginBottom: 0 },
  timeColumn: {
    width: 60,
    alignItems: "flex-end",
    paddingRight: 10,
    paddingTop: 15,
  },
  timeText: {
    fontSize: hp(1.6),
    fontWeight: "600",
    color: theme.colors.textDark,
  },
  dateText: { fontSize: hp(1.4), color: theme.colors.textLight },
  connectorColumn: { alignItems: "center", width: 30 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    zIndex: 2,
    borderWidth: 2,
    borderColor: "white",
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: "#E0E0E0",
    marginVertical: -5,
    zIndex: 1,
  },
  moodCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  moodTitle: {
    fontSize: hp(1.8),
    fontWeight: "bold",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  noteText: { fontSize: hp(1.6), color: "#555", lineHeight: 20 },
  emptyNoteText: { fontSize: hp(1.4), color: "#999", fontStyle: "italic" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    gap: 10,
  },
  emptyText: { fontSize: hp(1.8), color: theme.colors.textLight },
});
