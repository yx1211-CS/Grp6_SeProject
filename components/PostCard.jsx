import { Video } from "expo-av";
import { Image } from "expo-image";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";
import Icon from "../assets/icons";
import { theme } from "../constants/theme";
import { hp, stripHtmlTags, wp } from "../helpers/common";
import { supabase } from "../lib/supabase";
import {
  getSupabaseFileUrl,
  getUserImageSource,
} from "../services/imageService";
import { createNotification } from "../services/notificationService";
import {
  createPostLike,
  removePost,
  removePostLike,
} from "../services/postService";
import Avatar from "./Avatar";

const textStyle = {
  color: theme.colors.text,
  fontSize: hp(1.75),
};

const tagsStyles = {
  div: textStyle,
  p: textStyle,
  ol: textStyle,
  h1: { color: theme.colors.textDark },
  h4: { color: theme.colors.textDark },
};

const PostCard = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = true,
  onDelete,
  showDelete = true,
}) => {
  const [likes, setLikes] = useState([]);

  // ———— REPORT STATES ————
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const reportReasons = ["Spam", "Harassment", "Inappropriate"];

  useEffect(() => {
    setLikes(item?.reactions || []);
  }, [item]);

  const shadowStyles = {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  };

  // --- NAVIGATION ---
  const openPostDetails = () => {
    if (!item?.postid) return;
    router.push({ pathname: "postDetails", params: { postId: item?.postid } });
  };

  const openProfile = () => {
    const authorId = item?.userid || item?.userId;
    router.push({ pathname: "profile", params: { userId: authorId } });
  };

  // --- REPORT LOGIC ---
  const handleReportSubmit = async (reason) => {
    if (reason === "Other" && !customReason.trim()) {
      Alert.alert("Required", "Please tell us the reason.");
      return;
    }

    const finalReason = reason === "Other" ? customReason : reason;

    const { error: insertError } = await supabase
      .from("reported_content")
      .insert({
        postid: item?.postid,
        reporterid: currentUser?.accountid || currentUser?.id,
        reportreason: finalReason,
        reportstatus: "Pending",
      });

    if (insertError) {
      Alert.alert("Report Fail", "Failed to submit report. Please try again.");
      return;
    }

    // check report time
    const { count, error: countError } = await supabase
      .from("reported_content")
      .select("*", { count: "exact", head: true })
      .eq("postid", item?.postid)
      .eq("reportstatus", "Pending");

    if (!countError && count >= 3) {
      // if >=3 then status change to hide
      await supabase
        .from("post")
        .update({ ishidden: true })
        .eq("postid", item?.postid);

      console.log(
        `Post ${item.postid} has been auto-hidden after ${count} reports.`,
      );
    }

    //success and reset status
    Alert.alert("Report Submitted", "Thanks for reporting!");
    setReportModalVisible(false);
    setShowOtherInput(false);
    setCustomReason("");
  };

  // --- MENU ACTIONS ---
  const onMenuPress = () => {
    const isOwner = currentUser?.id == item?.userid;

    if (!isOwner) {
      Alert.alert("Post", "Options", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report Post",
          onPress: () => setReportModalVisible(true),
        },
      ]);
    } else {
      Alert.alert("Post", "Options", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit",
          onPress: () =>
            router.push({ pathname: "newPost", params: { ...item } }),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: handlePostDelete,
        },
      ]);
    }
  };

  const handlePostDelete = async () => {
    const res = await removePost(item?.postid);
    if (res.success) {
      Alert.alert("Success", "Post deleted successfully");
      if (onDelete) onDelete();
    } else {
      Alert.alert("Error", res.msg);
    }
  };

  const onLike = async () => {
    const liked =
      likes.filter((r) => r.userid == currentUser?.accountid).length > 0;
    if (liked) {
      let updatedLikes = likes.filter(
        (r) => r.userid != currentUser?.accountid,
      );
      setLikes([...updatedLikes]);
      const res = await removePostLike(item?.postid, currentUser?.accountid);
      if (!res.success) setLikes([...likes]);
    } else {
      const data = {
        userid: currentUser?.accountid,
        postid: item?.postid,
        reactiontype: "like",
      };
      setLikes([...likes, data]);
      const res = await createPostLike(data);
      if (res.success && currentUser?.id != item?.userid) {
        createNotification({
          senderid: currentUser?.id,
          receiverid: item?.userid,
          title: "Liked your post",
          data: JSON.stringify({ postId: item?.postid }),
        });
      }
    }
  };

  const createdAt = moment(item?.postcreatedat).format("MMM D");
  const liked =
    likes.filter((r) => r.userid == currentUser?.accountid).length > 0;

  return (
    <View style={[styles.container, hasShadow && shadowStyles]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={openProfile}>
          <Avatar
            size={hp(4.5)}
            source={getUserImageSource(item?.user?.profileimage)}
            rounded={theme.radius.md}
          />
          <View style={{ gap: 2 }}>
            <Text style={styles.username}>{item?.user?.username}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={onMenuPress}>
          <Icon
            name="threeDotsHorizontal"
            size={hp(3.4)}
            strokeWidth={3}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.postBody}>
          {item?.postcontent && (
            <RenderHtml
              contentWidth={wp(100)}
              source={{ html: item?.postcontent }}
              tagsStyles={tagsStyles}
            />
          )}
        </View>

        {item?.postfile && !item?.postfile.includes("postVideos") && (
          <Image
            source={getSupabaseFileUrl("postImages", item?.postfile)}
            style={styles.postMedia}
            contentFit="cover"
          />
        )}
        {item?.postfile && item?.postfile.includes("postVideos") && (
          <Video
            style={[styles.postMedia, { height: hp(30) }]}
            source={getSupabaseFileUrl("postImages", item?.postfile)}
            useNativeControls
            resizeMode="cover"
            isLooping
          />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLike}>
            <Icon
              name="heart"
              size={24}
              fill={liked ? theme.colors.rose : "transparent"}
              color={liked ? theme.colors.rose : theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likes.length}</Text>
        </View>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={openPostDetails}>
            <Icon name="comment" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.count}>{item?.replies?.[0]?.count || 0}</Text>
        </View>
      </View>

      {/* ———— Report Modal ———— */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => {
          setReportModalVisible(false);
          setShowOtherInput(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setReportModalVisible(false);
            setShowOtherInput(false);
          }}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Report Post</Text>

            {!showOtherInput ? (
              <>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={styles.modalButton}
                    onPress={() => handleReportSubmit(reason)}
                  >
                    <Text style={styles.modalButtonText}>{reason}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowOtherInput(true)}
                >
                  <Text style={styles.modalButtonText}>Other...</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Tell us why you're reporting..."
                  multiline
                  value={customReason}
                  onChangeText={setCustomReason}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={() => handleReportSubmit("Other")}
                >
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowOtherInput(false)}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setReportModalVisible(false);
                setShowOtherInput(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 15,
    borderRadius: theme.radius.xxl * 1.1,
    padding: 10,
    paddingVertical: 12,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
  },
  header: { flexDirection: "row", justifyContent: "space-between" },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.textDark,
    fontWeight: theme.fonts.medium,
  },
  postTime: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontWeight: theme.fonts.medium,
  },
  content: { gap: 10 },
  postMedia: { height: hp(40), width: "100%", borderRadius: theme.radius.xl },
  postBody: { marginLeft: 5 },
  footer: { flexDirection: "row", alignItems: "center", gap: 15 },
  footerButton: {
    marginLeft: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  count: { color: theme.colors.text, fontSize: hp(1.8) },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: theme.colors.textDark,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  inputContainer: { width: "90%", alignItems: "center" },
  reasonInput: {
    width: "100%",
    height: hp(12),
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 15,
    textAlignVertical: "top",
    fontSize: hp(1.7),
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  submitButtonText: { color: "white", fontWeight: "bold" },
  backButtonText: { color: theme.colors.textLight },
  cancelButton: { borderBottomWidth: 0, marginTop: 5 },
  cancelButtonText: { fontSize: 16, color: "#FF3B30", fontWeight: "600" },
});
