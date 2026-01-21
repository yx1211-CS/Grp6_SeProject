import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Icon from "../../assets/icons";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

export default function UserList() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // 👇 修复点：所有逻辑都必须在这个 async 函数内部
  const fetchUsers = async () => {
    // 1. 先去数据库拿数据
    const { data, error } = await supabase
      .from("account")
      .select("*")
      .order("username", { ascending: true });

    if (error) {
      console.log("Error fetching users:", error);
      setLoading(false);
      return; // 如果出错，直接停止
    }

    // 2. 👇👇👇 检查是否有过期的 Ban，并自动解封 👇👇👇
    const now = new Date();
    const idsToUnban = []; // 收集需要解封的 ID

    // 使用 map 遍历刚刚拿到的 data
    const processedData = data.map((user) => {
      // 如果用户是被封禁状态，并且有解封时间
      if (user.accountstatus === "Banned" && user.banExpiredDate) {
        const expireDate = new Date(user.banExpiredDate);

        // 如果 "现在时间" 已经超过了 "解封时间"
        if (now > expireDate) {
          idsToUnban.push(user.accountid);
          // 修改本地数据，让界面马上变绿 (Active)
          return { ...user, accountstatus: "Active", banExpiredDate: null };
        }
      }
      return user; // 没过期的保持原样
    });

    // 3. 如果发现有过期的人，去数据库更新
    if (idsToUnban.length > 0) {
      await supabase
        .from("account")
        .update({ accountstatus: "Active", banExpiredDate: null })
        .in("accountid", idsToUnban);

      console.log(`Auto-unbanned ${idsToUnban.length} users.`);
    }

    // 4. 把处理过的数据存入 State，更新界面
    setUsers(processedData || []);
    setLoading(false);
  }; // 👈 函数在这里结束

  // 使用 useFocusEffect 确保每次回到页面都刷新
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, []),
  );

  const getDisplayUsers = () => {
    let data = users;
    if (activeTab === "Banned") {
      data = data.filter((u) => u.accountstatus?.toLowerCase() === "banned");
    } else if (activeTab === "Active") {
      data = data.filter((u) => u.accountstatus?.toLowerCase() !== "banned");
    }
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(lowerQ) ||
          (u.email || "").toLowerCase().includes(lowerQ),
      );
    }
    return data;
  };

  const displayData = getDisplayUsers();

  const renderItem = ({ item }) => {
    const isBanned = item.accountstatus === "Banned";

    return (
      <TouchableOpacity
        style={[styles.card, isBanned && styles.bannedCard]}
        onPress={() => {
          router.push({
            pathname: "/moderator/userDetails",
            params: { userId: item.accountid },
          });
        }}
      >
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatarPlaceholder,
              isBanned && { backgroundColor: "#FFEBEE" },
            ]}
          >
            <Text style={[styles.avatarText, isBanned && { color: "#D32F2F" }]}>
              {item.username?.[0]?.toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.username}>@{item.username}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <View style={{ flexDirection: "row", gap: 5, marginTop: 4 }}>
              <View
                style={[
                  styles.badge,
                  isBanned ? styles.badgeBanned : styles.badgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isBanned ? { color: "#C62828" } : { color: "#2E7D32" },
                  ]}
                >
                  {isBanned ? "BANNED" : "ACTIVE"}
                </Text>
              </View>
              <View style={styles.badgeRole}>
                <Text style={styles.badgeTextRole}>{item.role || "User"}</Text>
              </View>
            </View>
          </View>
        </View>
        <Icon name="arrowRight" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrowLeft" size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color="gray" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search username or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.tabs}>
          {["All", "Active", "Banned"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, activeTab === tab && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.accountid}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No users found.</Text>
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
    paddingHorizontal: wp(4),
    marginBottom: 15,
  },
  backBtn: { padding: 5 },
  title: { fontSize: 20, fontWeight: "bold", color: theme.colors.text },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16 },
  tabs: {
    flexDirection: "row",
    marginBottom: 15,
    backgroundColor: "#f0f0f0",
    padding: 4,
    borderRadius: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: { color: "gray", fontWeight: "600" },
  tabTextActive: { color: "black", fontWeight: "bold" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bannedCard: { borderColor: "#FFEBEE", backgroundColor: "#FFFBFB" },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "bold", color: "#4F46E5" },
  username: { fontSize: 16, fontWeight: "bold", color: theme.colors.text },
  email: { fontSize: 12, color: "gray" },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 5,
  },
  badgeActive: { backgroundColor: "#E8F5E9" },
  badgeBanned: { backgroundColor: "#FFEBEE" },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  badgeRole: {
    backgroundColor: "#eee",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeTextRole: { fontSize: 10, fontWeight: "600", color: "#555" },
  emptyState: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "gray", fontSize: 16 },
});
