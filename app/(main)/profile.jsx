import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Components & Config
import { Feather } from "@expo/vector-icons";
import Icon from "../../assets/icons";
import Avatar from "../../components/Avatar";
import Header from "../../components/Header";
import Loading from "../../components/Loading";
import MoodInputModal from "../../components/MoodInputModal";
import PostCard from "../../components/PostCard";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { hp, wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

// Services
import { fetchPosts } from "../../services/postService";
import {
  addMood,
  followUser,
  getFollowCounts,
  getFollowStatus,
  getLatestMood,
  getUserData,
  getUserInterests,
  unfollowUser,
} from "../../services/userService";

const Profile = () => {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [posts, setPosts] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // States
  const [interests, setInterests] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });

  // Mood States
  const [currentMood, setCurrentMood] = useState(null);
  const [moodModalVisible, setMoodModalVisible] = useState(false);

  const isOwnProfile = !params?.userId || params?.userId == currentUser?.id;

  useEffect(() => {
    if (currentUser) {
      loadProfileData();
    }
  }, [currentUser, params?.userId]);

  const loadProfileData = async () => {
    setLoading(true);
    let targetUserId = currentUser?.id;

    if (isOwnProfile) {
      setProfileUser(currentUser);
      targetUserId = currentUser?.id;
    } else {
      let res = await getUserData(params.userId);
      if (res.success) {
        setProfileUser(res.data);
        targetUserId = res.data.accountid || res.data.id;
      } else {
        Alert.alert("Error", "User not found");
        router.back();
        return;
      }
    }

    await fetchFollowInfo(targetUserId);
    await getUserPosts(targetUserId);
    fetchInterests(targetUserId);
    fetchCurrentMood(targetUserId);
    setLoading(false);
  };

  const fetchInterests = async (targetId) => {
    let res = await getUserInterests(targetId);
    if (res.success) setInterests(res.data);
  };

  const fetchCurrentMood = async (targetId) => {
    let res = await getLatestMood(targetId);
    if (res.success) setCurrentMood(res.data);
  };

  const handleSaveMood = async (mood, note) => {
    const res = await addMood(currentUser.id, mood, note);
    if (res.success) {
      setCurrentMood({ currentmood: mood, note: note });
      Alert.alert("Success", "Mood updated!");
    } else {
      Alert.alert("Error", "Could not save mood");
    }
  };

  const fetchFollowInfo = async (userId) => {
    const countsRes = await getFollowCounts(userId);
    if (countsRes.success) {
      setStats({
        followers: countsRes.followers,
        following: countsRes.following,
      });
    }
    if (!isOwnProfile && currentUser?.id) {
      const statusRes = await getFollowStatus(currentUser.id, userId);
      if (statusRes.success) setIsFollowing(statusRes.isFollowing);
    }
  };

  const getUserPosts = async (userId) => {
    if (!userId) return;
    let res = await fetchPosts(10, userId);
    if (res.success) setPosts(res.data);
  };

  const handleToggleFollow = async () => {
    if (isOwnProfile) return;
    if (isFollowing) {
      const res = await unfollowUser(currentUser.id, profileUser.accountid);
      if (res.success) {
        setIsFollowing(false);
        setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
      }
    } else {
      const res = await followUser(currentUser.id, profileUser.accountid);
      if (res.success) {
        setIsFollowing(true);
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
      }
    }
  };

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Sign out", "Error signing out!");
  };

  const handleLogout = async () => {
    Alert.alert("Confirm", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => onLogout(), style: "destructive" },
    ]);
  };

  if (loading)
    return (
      <ScreenWrapper bg="white">
        <Loading />
      </ScreenWrapper>
    );

  return (
    <ScreenWrapper bg="white">
      <FlatList
        data={posts}
        ListHeaderComponent={
          <UserHeader
            user={profileUser}
            router={router}
            handleLogout={handleLogout}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onToggleFollow={handleToggleFollow}
            stats={stats}
            interests={interests}
            currentMood={currentMood}
            onOpenMoodModal={() => setMoodModalVisible(true)}
          />
        }
        ListHeaderComponentStyle={{ marginBottom: 30 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listStyle}
        keyExtractor={(item) => item.postid.toString()}
        renderItem={({ item }) => (
          <PostCard item={item} currentUser={currentUser} router={router} />
        )}
        ListFooterComponent={
          posts.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Text style={{ color: theme.colors.textLight }}>
                No posts yet
              </Text>
            </View>
          ) : null
        }
      />

      <MoodInputModal
        visible={moodModalVisible}
        onClose={() => setMoodModalVisible(false)}
        onSave={handleSaveMood}
      />
    </ScreenWrapper>
  );
};

const UserHeader = ({
  user,
  router,
  handleLogout,
  isOwnProfile,
  isFollowing,
  onToggleFollow,
  stats,
  interests,
  currentMood,
  onOpenMoodModal,
}) => {
  const openMoodHistory = () => {
    router.push({
      pathname: "moodHistory",
      params: { userId: user?.accountid, userName: user?.username },
    });
  };

  const getMoodConfig = (m) => {
    const txt = m?.toLowerCase() || "";
    if (txt.includes("happy") || txt.includes("good"))
      return { icon: "smile", color: "#4CAF50", bg: "#E8F5E9" };
    if (txt.includes("sad"))
      return { icon: "frown", color: "#2196F3", bg: "#E3F2FD" };
    if (txt.includes("anxious"))
      return { icon: "activity", color: "#9C27B0", bg: "#F3E5F5" };
    if (txt.includes("tired"))
      return { icon: "battery", color: "#607D8B", bg: "#ECEFF1" };
    return { icon: "meh", color: "#FF9800", bg: "#FFF3E0" };
  };

  const moodStyle = getMoodConfig(currentMood?.currentmood);

  return (
    <View
      style={{ flex: 1, backgroundColor: "white", paddingHorizontal: wp(4) }}
    >
      <Header title="Profile" showBackButton={true} marginBottom={30} />
      {isOwnProfile && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" color={theme.colors.rose} />
        </TouchableOpacity>
      )}

      <View style={styles.container}>
        <View style={{ gap: 15 }}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={user?.profileImage || user?.profileimage}
              size={hp(12)}
              rounded={theme.radius.xxl * 1.4}
            />
            {isOwnProfile && (
              <Pressable
                style={styles.editIcon}
                onPress={() => router.push("editProfile")}
              >
                <Icon name="edit" strokeWidth={2.5} size={20} />
              </Pressable>
            )}
          </View>

          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={styles.userName}>{user && user.username}</Text>
            <Text style={styles.infoText}>
              {(user && user.address) || "No location set"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {!isOwnProfile && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.followButtonBase,
                  isFollowing && styles.followingButton,
                ]}
                onPress={onToggleFollow}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && styles.followingButtonText,
                  ]}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Text>
              </TouchableOpacity>

              {/* 🔥 UPDATED: Only show "Check Mood" if currentMood exists */}
              {currentMood && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.moodButtonBase]}
                  onPress={openMoodHistory}
                >
                  <Text
                    style={[styles.followButtonText, styles.moodButtonText]}
                  >
                    Check Mood
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ gap: 10 }}>
            <View style={styles.info}>
              <Icon name="mail" size={20} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{user && user.email}</Text>
            </View>
            {(user?.phoneNumber || user?.phonenumber) && (
              <View style={styles.info}>
                <Icon name="call" size={20} color={theme.colors.textLight} />
                <Text style={styles.infoText}>
                  {user?.phoneNumber || user?.phonenumber}
                </Text>
              </View>
            )}
            {user && user.bio && (
              <Text style={styles.infoText}>{user.bio}</Text>
            )}

            {interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {interests.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Mood Display Logic: Show only if it's me OR if there is data */}
            {(isOwnProfile || currentMood) && (
              <TouchableOpacity
                onPress={isOwnProfile ? onOpenMoodModal : openMoodHistory}
                activeOpacity={0.8}
                style={[
                  styles.moodCard,
                  {
                    backgroundColor: moodStyle.bg,
                    borderColor: moodStyle.color,
                    marginHorizontal: 0,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={[
                      styles.moodIconCircle,
                      { backgroundColor: moodStyle.color },
                    ]}
                  >
                    <Feather name={moodStyle.icon} size={18} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.moodLabel, { color: moodStyle.color }]}
                    >
                      {currentMood
                        ? `Feeling ${currentMood.currentmood}`
                        : "Set your mood"}
                    </Text>
                    {currentMood?.note && (
                      <Text numberOfLines={1} style={styles.moodNote}>
                        {currentMood.note}
                      </Text>
                    )}
                  </View>
                  {isOwnProfile && (
                    <Feather
                      name="plus-circle"
                      size={20}
                      color={moodStyle.color}
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>

          {isOwnProfile && (
            <View style={styles.menuSection}>
              <Text style={styles.menuTitle}>Features</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("editInterest")}
              >
                <View style={styles.menuIconBox}>
                  <Icon name="heart" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>My Interests</Text>
                </View>
                <Icon name="arrowRight" size={20} color="#C7C7CC" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/requestHelp")}
              >
                <View style={styles.menuIconBox}>
                  <Icon name="comment" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>Request Help</Text>
                </View>
                <Icon name="arrowRight" size={20} color="#C7C7CC" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/phApplication")}
              >
                <View style={styles.menuIconBox}>
                  <Icon name="heart" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>Peer Helper Application</Text>
                </View>
                <Icon name="arrowRight" size={20} color="#C7C7CC" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("counselor/myTask")}
              >
                <View style={styles.menuIconBox}>
                  <Icon name="edit" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>My Tasks</Text>
                </View>
                <Icon name="arrowRight" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listStyle: { paddingBottom: 20 },
  logoutButton: {
    position: "absolute",
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: "#fee2e2",
    zIndex: 10,
  },
  avatarContainer: { height: hp(12), width: hp(12), alignSelf: "center" },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: -12,
    padding: 7,
    borderRadius: 50,
    backgroundColor: "white",
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  userName: {
    fontSize: hp(3),
    fontWeight: "500",
    color: theme.colors.textDark,
  },
  infoText: {
    fontSize: hp(1.6),
    fontWeight: "500",
    color: theme.colors.textLight,
  },
  info: { flexDirection: "row", alignItems: "center", gap: 10 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginVertical: 10,
  },
  statItem: { alignItems: "center" },
  statNumber: {
    fontSize: hp(2.2),
    fontWeight: "bold",
    color: theme.colors.textDark,
  },
  statLabel: { fontSize: hp(1.5), color: theme.colors.textLight },
  statDivider: { height: 20, width: 1, backgroundColor: "#e5e5e5" },

  actionButtonsContainer: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  followButtonBase: { backgroundColor: theme.colors.primary },
  moodButtonBase: {
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  followButtonText: { color: "white", fontWeight: "bold", fontSize: hp(1.8) },
  followingButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  followingButtonText: { color: theme.colors.primary },
  moodButtonText: { color: theme.colors.primary },

  moodCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 5,
  },
  moodIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  moodLabel: { fontSize: hp(1.8), fontWeight: "bold" },
  moodNote: { fontSize: hp(1.5), color: theme.colors.textLight },

  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginVertical: 10,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tagText: {
    fontSize: hp(1.5),
    color: theme.colors.textDark,
    fontWeight: "500",
  },

  menuSection: {
    marginTop: 25,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 20,
    gap: 15,
  },
  menuTitle: {
    fontSize: hp(2),
    fontWeight: "600",
    color: theme.colors.textDark,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000000",
    gap: 15,
  },
  menuIconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "black",
  },
  menuText: {
    fontSize: hp(1.8),
    fontWeight: "600",
    color: theme.colors.textDark,
  },
  menuSubText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: 2,
  },
});

export default Profile;
