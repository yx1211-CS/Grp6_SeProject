import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Icon from "../../assets/icons";
import Avatar from "../../components/Avatar";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { hp, wp } from "../../helpers/common";

// Services
import {
    followUser,
    getUserFollowingList,
    getUsersByInterest,
    getUsersWithSimilarInterests,
    searchUsers,
    unfollowUser,
} from "../../services/userService";

// Popular Interests Data
const POPULAR_INTERESTS = [
  "Coding",
  "Music",
  "Video Games",
  "Reading",
  "Sports",
  "Travel",
  "Photography",
  "Cooking",
  "Art",
  "Movies",
];

const FindFriends = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followedUsers, setFollowedUsers] = useState([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(null); // Tracks clicked interest

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    setLoading(true);
    // 1. Load default recommendations (Similar Interests)
    let res = await getUsersWithSimilarInterests(user.id);
    if (res.success) setUsers(res.data);

    // 2. Load following list (to show "Following" button status)
    let followingRes = await getUserFollowingList(user.id);
    if (followingRes.success) setFollowedUsers(followingRes.data);

    setLoading(false);
  };

  // --- SEARCH LOGIC ---
  const handleSearch = async (text) => {
    setSearchQuery(text);
    setActiveFilter(null); // Clear interest filter if typing

    if (text.length > 2) {
      setLoading(true);
      let res = await searchUsers(text);
      if (res.success) setUsers(res.data);
      setLoading(false);
    } else if (text.length === 0) {
      // Reset to recommendations if cleared
      fetchInitialData();
    }
  };

  // --- INTEREST FILTER LOGIC ---
  const handleInterestClick = async (interest) => {
    if (activeFilter === interest) {
      // Deselect if clicking same interest -> Reset
      setActiveFilter(null);
      fetchInitialData();
    } else {
      // Select new interest -> Search
      setActiveFilter(interest);
      setSearchQuery(""); // Clear text input
      setLoading(true);
      let res = await getUsersByInterest(interest);
      if (res.success) setUsers(res.data);
      setLoading(false);
    }
  };

  // --- FOLLOW LOGIC ---
  const handleFollow = async (targetUser) => {
    setFollowedUsers((prev) => [...prev, targetUser.accountid]);
    let res = await followUser(user.id, targetUser.accountid);
    if (!res.success) {
      setFollowedUsers((prev) =>
        prev.filter((id) => id !== targetUser.accountid),
      );
    }
  };

  const handleUnfollow = async (targetUser) => {
    setFollowedUsers((prev) =>
      prev.filter((id) => id !== targetUser.accountid),
    );
    let res = await unfollowUser(user.id, targetUser.accountid);
    if (!res.success) {
      setFollowedUsers((prev) => [...prev, targetUser.accountid]);
    }
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon name="arrowLeft" size={hp(3.2)} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Find Friends</Text>
          <View style={{ width: hp(3.2) }} />
        </View>

        {/* 🔍 Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={theme.colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Feather name="x" size={18} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* 🔥 Popular Interests Chips */}
        <View style={{ marginBottom: 15 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 5 }}
          >
            {POPULAR_INTERESTS.map((interest, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.chip,
                  activeFilter === interest && styles.activeChip,
                ]}
                onPress={() => handleInterestClick(interest)}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeFilter === interest && styles.activeChipText,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.subTitle}>
          {activeFilter
            ? `Users interested in "${activeFilter}"`
            : searchQuery
              ? "Search Results"
              : "People with similar interests"}
        </Text>

        {/* Users List */}
        <FlatList
          data={users}
          keyExtractor={(item) => item.accountid.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => {
            // Skip rendering myself
            if (item.accountid === user.id) return null;

            const isFollowed = followedUsers.includes(item.accountid);

            return (
              <View style={styles.card}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                    gap: 12,
                  }}
                  onPress={() =>
                    router.push({
                      pathname: "profile",
                      params: { userId: item.accountid },
                    })
                  }
                >
                  <Avatar
                    uri={item?.profileimage}
                    size={hp(6)}
                    rounded={theme.radius.md}
                  />
                  <View style={{ gap: 2 }}>
                    <Text style={styles.username}>{item.username}</Text>
                    {/* Show matches ONLY if searching recommendations (has matchedInterests) */}
                    {item.matchedInterests ? (
                      <Text style={styles.matchText}>
                        {item.matchedInterests.length} shared interests
                      </Text>
                    ) : (
                      <Text style={styles.matchText}>User</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Follow Button */}
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowed && styles.followingButton,
                  ]}
                  onPress={() =>
                    isFollowed ? handleUnfollow(item) : handleFollow(item)
                  }
                >
                  <Text
                    style={[
                      styles.followText,
                      isFollowed && styles.followingText,
                    ]}
                  >
                    {isFollowed ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            !loading && <Text style={styles.noData}>No users found.</Text>
          }
        />
      </View>
    </ScreenWrapper>
  );
};

export default FindFriends;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    marginTop: 5,
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },

  // Search Bar Styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: theme.radius.lg,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: hp(1.8),
    color: theme.colors.text,
  },

  // Chip Styles
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textLight,
    fontSize: hp(1.6),
    fontWeight: "600",
  },
  activeChipText: {
    color: "white",
  },

  subTitle: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginBottom: 15,
    marginTop: 5,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: 10,
  },
  username: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textDark,
  },
  matchText: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontWeight: "500",
  },
  noData: {
    textAlign: "center",
    marginTop: 50,
    color: theme.colors.textLight,
  },
  followButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
  },
  followingButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  followText: {
    color: "white",
    fontWeight: "bold",
    fontSize: hp(1.5),
  },
  followingText: {
    color: theme.colors.primary,
  },
});
