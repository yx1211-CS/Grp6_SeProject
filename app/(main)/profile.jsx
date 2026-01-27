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
import Icon from "../../assets/icons";
import Avatar from "../../components/Avatar";
import Header from "../../components/Header";
import Loading from "../../components/Loading";
import PostCard from "../../components/PostCard";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { hp, wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

// Services
import { fetchPosts } from "../../services/postService";
import {
  followUser,
  getFollowCounts,
  getFollowStatus,
  getUserData,
  unfollowUser,
  getUserInterests,
} from "../../services/userService";

const Profile = () => {
  const { user: currentUser } = useAuth(); // Renamed for clarity
  const router = useRouter();
  const params = useLocalSearchParams();

  const [posts, setPosts] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- NEW: Interests State ---
  const [interests, setInterests] = useState([]);

  // --- NEW: Follow State ---
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });

  // Logic: Is this my profile or someone else's?
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
      // Case A: Viewing My Profile
      setProfileUser(currentUser);
      targetUserId = currentUser?.id;
    } else {
      // Case B: Viewing Someone Else
      let res = await getUserData(params.userId);
      if (res.success) {
        setProfileUser(res.data);
        // Ensure we get the correct ID key
        targetUserId = res.data.accountid || res.data.id;
      } else {
        Alert.alert("Error", "User not found");
        router.back();
        return;
      }
    }

    // 1. Fetch Follow Data (Stats & Status)
    await fetchFollowInfo(targetUserId);

    // 2. Fetch Posts
    await getUserPosts(targetUserId);

    // C. Fetch Interests (🔥 NEW)
    fetchInterests(targetUserId);

    setLoading(false);
  };

  // 🔥 NEW: Fetch Interests Function
  const fetchInterests = async (targetId) => {
    let res = await getUserInterests(targetId);
    if (res.success) setInterests(res.data);
  };

  const fetchFollowInfo = async (userId) => {
    // Get Counts
    const countsRes = await getFollowCounts(userId);
    if (countsRes.success) {
      setStats({
        followers: countsRes.followers,
        following: countsRes.following,
      });
    }

    // Check Status (Only if viewing someone else)
    if (!isOwnProfile && currentUser?.id) {
      const statusRes = await getFollowStatus(currentUser.id, userId);
      if (statusRes.success) {
        setIsFollowing(statusRes.isFollowing);
      }
    }
  };

  const getUserPosts = async (userId) => {
    if (!userId) return;
    let res = await fetchPosts(10, userId);
    if (res.success) {
      setPosts(res.data);
    }
  };

  // --- NEW: Toggle Follow Function ---
  const handleToggleFollow = async () => {
    if (isOwnProfile) return;

    if (isFollowing) {
      // Unfollow Logic
      const res = await unfollowUser(currentUser.id, profileUser.accountid);
      if (res.success) {
        setIsFollowing(false);
        setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        Alert.alert("Error", "Could not unfollow");
      }
    } else {
      // Follow Logic
      const res = await followUser(currentUser.id, profileUser.accountid);
      if (res.success) {
        setIsFollowing(true);
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
      } else {
        Alert.alert("Error", "Could not follow");
      }
    }
  };

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Sign out", "Error signing out!");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => onLogout(),
        style: "destructive",
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenWrapper bg="white">
        <Loading />
      </ScreenWrapper>
    );
  }

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
            // Pass new props to header
            isFollowing={isFollowing}
            onToggleFollow={handleToggleFollow}
            stats={stats}
            interests={interests}
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
    </ScreenWrapper>
  );
};

// ==========================================
// USER HEADER COMPONENT
// ==========================================
const UserHeader = ({
  user,
  router,
  handleLogout,
  isOwnProfile,
  isFollowing,
  onToggleFollow,
  stats,
  interests,
}) => {
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
          {/* Avatar & Edit Button */}
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

          {/* Username and Address */}
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={styles.userName}>{user && user.username}</Text>
            <Text style={styles.infoText}>
              {(user && user.address) || "No location set"}
            </Text>
          </View>

          {/* --- NEW: STATS ROW --- */}
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

          {/* --- NEW: FOLLOW BUTTON (Only for others) --- */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[
                styles.followButton,
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
          )}

          {/* Contact Info & Bio */}
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

            {/* 🔥 NEW: Interests Section 🔥 */}
          {interests.length > 0 && (
             <View style={styles.interestsContainer}>
                {interests.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                    </View>
                ))}
             </View>
          )}

          </View>

          {/* Features Section: ONLY show if it is MY profile */}
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
                  <Text style={styles.menuSubText}>
                    Need someone to talk to?
                  </Text>
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
                  <Text style={styles.menuSubText}>
                    Apply to be Peer Helper
                  </Text>
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
                  <Text style={styles.menuSubText}>View assigned tasks</Text>
                </View>
                <Icon name="arrowRight" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </View>
          )}
          {/* End Features Section */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listStyle: {
    paddingBottom: 20,
  },
  logoutButton: {
    position: "absolute",
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: "#fee2e2",
    zIndex: 10,
  },
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: "center",
  },
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
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // --- NEW STYLES ---
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginVertical: 10,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: hp(2.2),
    fontWeight: "bold",
    color: theme.colors.textDark,
  },
  statLabel: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  statDivider: {
    height: 20,
    width: 1,
    backgroundColor: "#e5e5e5",
  },
  // 🔥 Interests Styles
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
  followButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 10,
    marginHorizontal: 40,
  },
  followingButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  followButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: hp(2),
  },
  followingButtonText: {
    color: theme.colors.primary,
  },
  // ----------------

  // Menu / Features
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
