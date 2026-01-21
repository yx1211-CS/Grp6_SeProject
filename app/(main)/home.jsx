import { useFocusEffect, useRouter } from "expo-router"; // Added useFocusEffect
import { StyleSheet, Text, View } from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { hp, wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";

import { useCallback, useEffect, useState } from "react"; // Added useCallback
import { FlatList, Pressable } from "react-native";
import Icon from "../../assets/icons";
import Avatar from "../../components/Avatar";
import Loading from "../../components/Loading";
import PostCard from "../../components/PostCard";
import { fetchPosts } from "../../services/postService";
import { getUserData } from "../../services/userService";

let limit = 0;

const Home = () => {
  const router = useRouter();
  const { user, setAuth } = useAuth();

  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // REALTIME UPDATES: Listen for new posts
  const handlePostEvent = async (payload) => {
    if (payload.eventType == "INSERT" && payload?.new?.postID) {
      let newPost = { ...payload.new };
      let res = await getUserData(newPost.userID);

      newPost.reactions = [];
      newPost.replies = [{ count: 0 }];

      newPost.user = res.success ? res.data : {};
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    }
  };

  // 1. Subscription Effect (Runs once on Mount)
  useEffect(() => {
    const postChannel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post" },
        handlePostEvent,
      )
      .subscribe();

    // Note: We removed getPosts() from here to avoid double-fetching.
    // useFocusEffect below will handle the loading.

    return () => {
      supabase.removeChannel(postChannel);
    };
  }, []);

  // 2. Focus Effect (Runs whenever screen is visible)
  useFocusEffect(
    useCallback(() => {
      if (limit === 0) {
        // First time load
        getPosts();
      } else {
        // Refresh existing posts to update counts (Likes/Comments)
        // We fetch using the current limit so we don't lose the scroll position
        console.log("Refreshing posts...");
        fetchPosts(limit).then((res) => {
          if (res.success && res.data) {
            setPosts(res.data);
          }
        });
      }
    }, []),
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
          <Text style={styles.title}>LinkUp</Text>
          <View style={styles.icons}>
            <Pressable onPress={() => router.push("notifications")}>
              <Icon
                name="heart"
                size={hp(3.2)}
                strokeWidth={2}
                color={theme.colors.text}
              />
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
});
