import moment from "moment";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../constants/theme";
import { hp } from "../helpers/common";
import Avatar from "./Avatar";

const NotificationItem = ({ item, router }) => {
  // 🔥 核心修改：点击时的逻辑
  const handleClick = () => {
    // 1. 解析 Data (数据库存的是 JSON 字符串，取出来要小心)
    let data = item?.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.log("JSON Parse Error:", e);
        data = {};
      }
    }

    console.log("点击的通知数据:", data);

    // 2. 智能分流
    if (data?.type === "feedback_reply") {
      // counselor
      Alert.alert(
        "Counselor Reply 💬",
        data.message || "Please check your feedback history.",
        [{ text: "OK" }],
      );
    } else if (data?.postId || data?.postid) {
      // 【pst
      const targetPostId = data.postId || data.postid;

      if (targetPostId) {
        router.push({
          pathname: "postDetails",
          params: { postId: targetPostId },
        });
      } else {
        Alert.alert("Error", "Post not found");
      }
    } else {
      // ✅ 情况 C：其他类型
      console.log("Unknown notification type:", data?.type);
      // 既不是反馈，也不是帖子，那就什么都不做，或者弹个窗
      // Alert.alert("Notification", item?.title);
    }
  };

  // --- UI 部分保持不变 ---
  return (
    <TouchableOpacity style={styles.container} onPress={handleClick}>
      {/* 左侧头像 */}
      <Avatar
        uri={item?.sender?.profileimage}
        size={hp(5)}
        rounded={theme.radius.xxl}
      />

      <View style={styles.nameTitle}>
        <Text style={styles.text}>
          <Text style={styles.username}>{item?.sender?.username}</Text>
          <Text style={styles.title}>{" " + item?.title}</Text>
        </Text>

        <Text style={[styles.text, { color: theme.colors.textLight }]}>
          {moment(item?.created_at).fromNow()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default NotificationItem;

// ... styles 保持不变 ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: theme.colors.darkLight,
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  nameTitle: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  title: {
    color: theme.colors.textDark,
    fontFamily: theme.fonts.medium,
  },
});
