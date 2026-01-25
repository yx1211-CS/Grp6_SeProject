import { useLocalSearchParams, useRouter } from "expo-router"; // Added useLocalSearchParams
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
import Loading from "../../components/Loading"; // Assuming you have this
import PostCard from "../../components/PostCard";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { hp, wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

// Services
import { fetchPosts } from "../../services/postService";
import { getUserData } from "../../services/userService"; // Needed to fetch other users

const Profile = () => {
  const {user} = useAuth(); // Rename 'user' to 'currentUser' for clarity
  const router = useRouter();
  const params = useLocalSearchParams(); // Get parameters passed from navigation

  const [posts, setPosts] = useState([]);
  const [profileUser, setProfileUser] = useState(null); // The user to display
  const [loading, setLoading] = useState(true);

  // Logic: Is this my profile or someone else's?
  // If no params.userId is passed, or if it matches my ID, it's mine.
  const isOwnProfile = !params?.userId || params?.userId == user?.id;

  useEffect(() => {
    if(user){
      loadProfileData();
    }
    }, [user, params?.userId]);

  const loadProfileData = async () => {
    setLoading(true);

    let targetUserId = user?.id;

    if (isOwnProfile) {
      // Case A: Viewing My Profile
      setProfileUser(user);
      targetUserId = user?.id;
    } else {
      // Case B: Viewing Someone Else
      let res = await getUserData(params.userId);
      if (res.success) {
        setProfileUser(res.data);
        targetUserId = res.data.accountid || res.data.id; // Ensure we get the correct ID key
      } else {
        Alert.alert("Error", "User not found");
        router.back();
        return;
      }
    }

    // After setting user, fetch their posts
    await getUserPosts(targetUserId);
    setLoading(false);
  };

  const getUserPosts = async (userId) => {
    if (!user || !userId) return; // HEAD 的安全检查保留
        
        // 使用传入的 userId，如果没有传则默认用自己的
    let targetId = userId || user.id;
    // Fetch posts specifically for this userId
    let res = await fetchPosts(10, userId);
    if (res.success) {
      setPosts(res.data);
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
        // Pass 'profileUser' (the user being viewed) and 'isOwnProfile' flag
        ListHeaderComponent={
          <UserHeader
            user={profileUser}
            router={router}
            handleLogout={handleLogout}
            isOwnProfile={isOwnProfile}
          />
        }
        ListHeaderComponentStyle={{ marginBottom: 30 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listStyle}
        keyExtractor={(item) => item.postid.toString()}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            currentUser={user} // Pass logged-in user for Like logic
            router={router}
          />
        )}
        onEndReached={() => {
          // Logic to load more posts if needed
          // getUserPosts(profileUser.id);
        }}
        onEndReachedThreshold={0}
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
const UserHeader = ({ user, router, handleLogout, isOwnProfile }) => {
  return (
    <View
      style={{ flex: 1, backgroundColor: "white", paddingHorizontal: wp(4) }}
    >
      <Header title="Profile" showBackButton={true} marginBottom={30} />

      {/* Logout Button: Only show if it is MY profile */}
      {isOwnProfile && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" color={theme.colors.rose} />
        </TouchableOpacity>
      )}

      {/* User Info Area */}
      <View style={styles.container}>
        <View style={{ gap: 15 }}>
          {/* Avatar & Edit Button */}
          <View style={styles.avatarContainer}>
            <Avatar
              uri={user?.profileImage || user?.profileimage}
              size={hp(12)}
              rounded={theme.radius.xxl * 1.4}
            />
            {/* Edit Icon: Only show if it is MY profile */}
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

          {/* Contact Info & Bio */}
          <View style={{ gap: 10 }}>
            {/* Email */}
            <View style={styles.info}>
              <Icon name="mail" size={20} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{user && user.email}</Text>
            </View>

            {/* Phone */}
            {(user?.phoneNumber || user?.phonenumber) && (
              <View style={styles.info}>
                <Icon name="call" size={20} color={theme.colors.textLight} />
                <Text style={styles.infoText}>
                  {user?.phoneNumber || user?.phonenumber}
                </Text>
              </View>
            )}

            {/* Bio */}
            {user && user.bio && (
              <Text style={styles.infoText}>{user.bio}</Text>
            )}
          </View>

          {/* Features Section: ONLY show if it is MY profile */}
          {/* We hide this for other users because they can't see your tasks */}
          {isOwnProfile && (
            <View style={styles.menuSection}>
              <Text style={styles.menuTitle}>Features</Text>

              {/* Request Help */}
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

              {/* Peer Helper Application */}
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

              {/* My Tasks */}
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
