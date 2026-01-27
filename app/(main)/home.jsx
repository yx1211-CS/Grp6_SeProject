import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { hp, wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

// Components
import Icon from "../../assets/icons";
import Avatar from "../../components/Avatar";
import Loading from "../../components/Loading";
import PostCard from "../../components/PostCard";

// Services
import { fetchPosts } from "../../services/postService";
import { checkUserStreak, getUserData } from "../../services/userService"; // <--- Added checkUserStreak

let limit = 0;

const Home = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // --- NEW STREAK STATE ---
  const [streak, setStreak] = useState(0);

  // REALTIME UPDATES: Listen for new posts
  const handlePostEvent = async (payload) => {
    //console.log('Realtime Payload NEW:', payload.new);
    if (payload.eventType == "INSERT" && payload?.new?.postid) {
      
      let newPost = { ...payload.new };
      let res = await getUserData(newPost.userid);

      newPost.reactions = [];
      newPost.replies = [{ count: 0 }];

      newPost.user = res.success ? res.data : {};
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    }

    // 2. 处理删除 (DELETE)
    if (payload.eventType == 'DELETE' && payload.old.postid) {
        setPosts(prevPosts => {
            // 过滤掉那个被删除 ID 的帖子
            return prevPosts.filter(post => post.postid != payload.old.postid);
        });
    }

    // 3. 处理更新 (UPDATE)
    if (payload.eventType == 'UPDATE' && payload.new.postid) {
        setPosts(prevPosts => {
            return prevPosts.map(post => {
                // 找到那个被修改的帖子
                if (post.postid == payload.new.postid) {
                    return {
                        ...post, // 保留原有的 user, reactions, replies 信息
                        postcontent: payload.new.postcontent, // 只更新文字
                        postfile: payload.new.postfile        // 只更新图片路径
                    };
                }
                return post; // 其他帖子保持不变
            });
        });
    }


    //【新增：监听通知】
    if (payload.eventType === 'INSERT' && payload.table === 'notifications') {
      
        if (user && user.id && payload.new.receiverid === user.id) {
            
            setNotificationCount(prev => prev + 1);
        }
    }
  

  };

  

  // 1. Subscription Effect (Runs once on Mount)
  useEffect(() => {
    if (!user) return;

    console.log("🔥 Current User ID for Subscription:", user.id);

    const postChannel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post" },
        handlePostEvent,
      )
      .subscribe();

    // 🔥 2. 监听 Notifications (新增)
    // ✅ 适配：receiverid
    const notificationChannel = supabase
        .channel('notifications')
        .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'notifications'}, handlePostEvent)
        .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, [user]);

  // 2. Focus Effect (Runs whenever screen is visible)
  useFocusEffect(
    useCallback(() => {
      // A. Check Streak
      if (user?.id) {
        checkUserStreak(user.id).then((res) => {
          if (res.success) setStreak(res.streak);
        });
      }

      // B. Fetch/Refresh Posts
      if (limit === 0) {
        // First time load
        getPosts();
      } else {
        // Refresh existing posts to update counts (Likes/Comments)
        console.log("Refreshing posts...");
        fetchPosts(limit).then((res) => {
          if (res.success && res.data) {
            setPosts(res.data);
          }
        });
      }
    }, [user?.id]), // Added dependency
  );

  const getPosts = async () => {
    if (!hasMore) return null;
    limit = limit + 10;

    console.log("fetching posts: ", limit);
    let res = await fetchPosts(limit);
    if (res.success) {
      if (posts.length == res.data.length) setHasMore(false);
      setPosts(res.data);
    }
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {/* LEFT SIDE: Title + Streak */}
          <View style={styles.titleGroup}>
            <Text style={styles.title}>LinkUp</Text>

            {/* Streak Badge (Now beside title) */}
            {streak > 0 && (
              <View style={styles.streakContainer}>
                <Icon name="fire" size={hp(2.5)} color={theme.colors.primary} />
                <Text style={styles.streakText}>{streak}</Text>
              </View>
            )}
          </View>

          {/* RIGHT SIDE: Action Icons */}
          <View style={styles.icons}>

            {/* 🔥 NEW: Find Friends Button */}
            <Pressable onPress={() => router.push('findFriends')}>
                <Icon name="search" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
            </Pressable>

            <Pressable onPress={() => {
                setNotificationCount(0); // 点击后清零
                router.push("notifications"); // 跳转
            }}>
              <Icon
                name="heart"
                size={hp(3.2)}
                strokeWidth={2}
                color={theme.colors.text}
              />

              {/* 👇 如果有新通知，显示红点 */}
              {
                  notificationCount > 0 && (
                      <View style={styles.pill}>
                          <Text style={styles.pillText}>{notificationCount}</Text>
                      </View>
                  )
              }
              
            </Pressable>
            <Pressable onPress={() => router.push("newPost")}>
              <Icon
                name="plus"
                size={hp(3.2)}
                strokeWidth={2}
                color={theme.colors.text}
              />
            </Pressable>
            <Pressable onPress={() => router.push("profile")}>
              <Avatar
                uri={user?.profileImage || user?.profileimage}
                size={hp(4.3)}
                rounded={theme.radius.sm}
                style={{ borderWidth: 2 }}
              />
            </Pressable>
          </View>
        </View>

        {/* Post Feed */}
        <FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item) => item.postid.toString()}
          renderItem={({ item }) => (
            <PostCard item={item} currentUser={user} router={router} />
          )}
          onEndReached={() => {
            getPosts();
          }}
          onEndReachedThreshold={0}
          ListFooterComponent={
            hasMore ? (
              <View style={{ marginVertical: 30 }}>
                <Loading />
              </View>
            ) : (
              <View style={{ marginVertical: 30 }}>
                <Text style={styles.noPosts}>No more posts</Text>
              </View>
            )
          }
        />
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginHorizontal: wp(4),
  },
  title: {
    fontSize: hp(3),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  icons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
  },
  listStyle: {
    paddingTop: 20,
    paddingHorizontal: wp(4),
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: "center",
    color: theme.colors.text,
  },
  // --- NEW STREAK STYLES ---
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff4e6", // Light orange background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffdcb5", // Subtle border
  },
  streakText: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary, // Or hardcoded orange '#f91616fe'
  },
  pill: {
    position: "absolute",
    right: -10,
    top: -4,
    height: 20,
    width: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight,
  },
  pillText: {
    color: "white",
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold,
  },
});
