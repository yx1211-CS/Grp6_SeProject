import moment from "moment";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../constants/theme";
import { hp } from "../helpers/common";
import Avatar from "./Avatar";

const NotificationItem = ({ item, router }) => {
  const handleClick = () => {
    let data = item?.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.log("JSON Parse Error:", e);
        data = {};
      }
    }

    console.log("🔔 Notification Type:", data?.type);

    // different notification】 type
    switch (data?.type) {
      //counselor feedback
      case "feedback_reply":
        Alert.alert(
          "Counselor Reply 💬",
          data.message || "Please check your feedback history.",
          [{ text: "OK" }],
        );
        break;

      // post
      case "post_like":
      case "post_comment":
      case undefined:
        if (data?.postId || data?.postid) {
          router.push({
            pathname: "postDetails",
            params: { postId: data.postId || data.postid },
          });
        } else {
          console.log("No Post ID found");
        }
        break;

      // - Peer Helper
      case "peer_help_application":
        Alert.alert(
          "Application Update",
          `Your application has been ${data.status}.`,
          [
            {
              text: "View Details",
              onPress: () => router.push("/peer-helper/application-status"),
            },
          ],
        );
        break;

      // Report Review -
      case "report_review":
        router.push({
          pathname: "reportDetails",
          params: { reportId: data.reportId },
        });
        break;

      //  My Task
      case "report_reply":
        Alert.alert(
          "Message from counselor",
          data.message || "Please check your task report.",
          [{ text: "OK" }],
        );
        break;

      // norma
      default:
        console.log("Unknown notification type:", data?.type);

        if (data?.postId || data?.postid) {
          router.push({
            pathname: "postDetails",
            params: { postId: data.postId || data.postid },
          });
        } else {
          Alert.alert(
            "Notification",
            item?.title || "New notification received.",
          );
        }
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleClick}>
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
  nameTitle: { flex: 1, gap: 2 },
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
  title: { color: theme.colors.textDark, fontFamily: theme.fonts.medium },
});
