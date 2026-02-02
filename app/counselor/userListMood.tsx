import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { supabase } from "../../lib/supabase";

export default function UserListMood() {
  const router = useRouter();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Fetch all users with role 'User'
    const { data, error } = await supabase
      .from("account")
      .select("accountid, username, email, profileimage")
      .eq("role", "User");

    if (data) setUsers(data);
  };

  const getAvatarSource = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return { uri: path };
    const { data } = supabase.storage.from("postImages").getPublicUrl(path);
    return { uri: data.publicUrl };
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() =>
        // passing userId and userName to the history page
        router.push({
          pathname: "/counselor/moodHistory",
          params: { userId: item.accountid, userName: item.username },
        })
      }
    >
      <View style={styles.avatarContainer}>
        {item.profileimage ? (
          <Image
            source={getAvatarSource(item.profileimage)}
            style={styles.avatar}
          />
        ) : (
          <Text style={styles.avatarText}>
            {item.username?.[0]?.toUpperCase()}
          </Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <Feather name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper bg="#F8F9FD">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Select User</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.accountid}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 50, color: "gray" }}>
            No Users found.
          </Text>
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
    marginBottom: 10,
  },
  backBtn: { padding: 8, backgroundColor: "white", borderRadius: 12 },
  title: { fontSize: 20, fontWeight: "bold", color: "#333" },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
    elevation: 2,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },
  avatarText: { color: "#4F46E5", fontWeight: "bold", fontSize: 18 },
  name: { fontWeight: "bold", fontSize: 16, color: "#333" },
  email: { color: "gray", fontSize: 12 },
});
