import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "../../assets/icons";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import { supabase } from "../../lib/supabase";
import { createNotification } from "../../services/notificationService";

export default function ReportDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    postId,
    content,
    accusedName,
    accusedId,
    isHidden,
    reportCount,
    postImage,
  } = params;
  const isPostHidden = isHidden === "true";

  const [loading, setLoading] = useState(false);
  const [reportList, setReportList] = useState([]);
  const [fetchingList, setFetchingList] = useState(true);

  // zoom in photo
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  //image url get
  const getPostImageSource = (path) => {
    if (!path) return null;
    const { data } = supabase.storage.from("postImages").getPublicUrl(path);
    return { uri: data.publicUrl };
  };

  const imageSource = getPostImageSource(postImage);

  // get post reported hgistory
  useEffect(() => {
    const fetchReportDetails = async () => {
      const { data, error } = await supabase
        .from("reported_content")
        .select(`*, reporter:reporterid (username, email)`)
        .eq("postid", postId)
        .eq("reportstatus", "Pending")
        .order("reporttime", { ascending: false });

      if (error) {
        console.log("Error fetching details:", error);
      } else {
        setReportList(data || []);
      }
      setFetchingList(false);
    };

    fetchReportDetails();
  }, [postId]);

  // Hide Post
  const handleHideContent = async () => {
    Alert.alert(
      "Confirm Hide",
      "Are you sure you want to hide this post? It will no longer be visible to users.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Hide Post",
          style: "destructive",
          onPress: async () => {
            setLoading(true);

            //  Resolved_Hidden
            const { error: reportError } = await supabase
              .from("reported_content")
              .update({ reportstatus: "Resolved_Hidden" })
              .eq("postid", postId)
              .eq("reportstatus", "Pending");

            //  ishidden: true
            const { error: postError } = await supabase
              .from("post")
              .update({ ishidden: true })
              .eq("postid", postId);

            if (!reportError && !postError && accusedId) {
              console.log("Creating Hide Notification for:", accusedId);
              const {
                data: { user },
              } = await supabase.auth.getUser();
              await createNotification({
                receiverid: accusedId,
                senderid: user?.id,
                title: "System Alert",
                data: JSON.stringify({
                  type: "PostHidded",
                  postId: postId,
                  message:
                    "Your post has been hidden due to community guidelines violation.",
                }),
              });
            } else if (!accusedId) {
              console.log("fail to send notificaiton: accusedId missing");
            }

            setLoading(false);

            if (!reportError && !postError) {
              Alert.alert("Success", "Post hidden successfully.");
              router.back();
            } else {
              Alert.alert("Error", "Operation failed");
            }
          },
        },
      ],
    );
  };

  // Ignore Reports
  const handleIgnore = async () => {
    setLoading(true);

    // update report
    const { error: reportError } = await supabase
      .from("reported_content")
      .update({ reportstatus: "Resolved_Ignored" })
      .eq("postid", postId)
      .eq("reportstatus", "Pending");

    //change the post status
    const { error: postError } = await supabase
      .from("post")
      .update({ ishidden: false })
      .eq("postid", postId);

    if (!reportError && !postError && isPostHidden && accusedId) {
      console.log("Creating Restore Notification for:", accusedId);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await createNotification({
        receiverid: accusedId,
        senderid: user?.id,
        title: "Notification",
        data: JSON.stringify({
          type: "Postvisible",
          postId: postId,
          message: "Your post has been reviewed and is visible again.",
        }),
        created_at: new Date(),
      });
    }

    setLoading(false);

    if (!reportError && !postError) {
      Alert.alert("Success", "Reports ignored and post is now visible again.");
      router.back();
    } else {
      Alert.alert("Error", "Failed to restore post visibility.");
    }
  };

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: wp(4), paddingBottom: 100 }}
      >
        {/* Bannerif post is hidded*/}
        {isPostHidden && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              🚫 Post is Hidden (Pending Admin Review)
            </Text>
          </View>
        )}

        {/* Overview Information */}
        <Text style={styles.sectionTitle}>📋 Overview</Text>
        <View style={styles.infoBox}>
          <View style={styles.row}>
            <Text style={styles.label}>Post Author:</Text>
            <Text style={[styles.value, { color: theme.colors.primary }]}>
              @{accusedName}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Total Reports:</Text>
            <Text style={[styles.value, { color: "red" }]}>
              {reportList.length}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text
              style={[styles.value, { color: isPostHidden ? "red" : "green" }]}
            >
              {isPostHidden ? "Hidden" : "Visible"}
            </Text>
          </View>
        </View>

        {/* Report History List */}
        <Text style={styles.sectionTitle}>📝 Report History</Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.2 }]}>Reporter</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Reason</Text>
            <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
              Date
            </Text>
          </View>

          {fetchingList ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={{ margin: 20 }}
            />
          ) : (
            reportList.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index === reportList.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={[styles.td, { flex: 1.2, fontWeight: "600" }]}>
                  @{item.reporter?.username || "Unknown"}
                </Text>
                <Text style={[styles.td, { flex: 1.5, color: "#E65100" }]}>
                  {item.reportreason}
                </Text>
                <Text
                  style={[
                    styles.td,
                    {
                      flex: 1,
                      textAlign: "right",
                      color: "gray",
                      fontSize: 11,
                    },
                  ]}
                >
                  {new Date(item.reporttime).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Content Preview */}
        <Text style={styles.sectionTitle}>📄 Post Content</Text>
        <View style={styles.contentBox}>
          <View style={styles.contentInner}>
            {content ? (
              <Text style={styles.contentText}>"{content}"</Text>
            ) : null}

            {postImage && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsImageModalVisible(true)}
                style={styles.imageContainer}
              >
                <Image
                  source={imageSource}
                  style={styles.postImage}
                  resizeMode="cover"
                />
                <View style={styles.zoomIconContainer}>
                  <Icon name="search" size={20} color="white" />
                </View>
              </TouchableOpacity>
            )}

            {!content && !postImage && (
              <View style={styles.notFoundContainer}>
                <Text style={styles.notFoundText}>⚠️ Content not found</Text>
                <Text style={styles.notFoundSubText}>
                  (The post might be deleted or hidden)
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, styles.btnIgnore]}
          onPress={handleIgnore}
          disabled={loading}
        >
          <Text style={styles.btnTextIgnore}>Ignore All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnHide]}
          onPress={handleHideContent}
          disabled={loading}
        >
          <Text style={styles.btnTextHide}>
            {isPostHidden ? "Already Hidden" : "Hide Post"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsImageModalVisible(false)}
          >
            <Text style={styles.closeText}>Close</Text>
            <View style={styles.closeIconBg}>
              <Text style={{ color: "black", fontWeight: "bold" }}>X</Text>
            </View>
          </TouchableOpacity>
          <Image
            source={imageSource}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  backButton: { padding: 5 },
  backText: { fontSize: hp(2), color: theme.colors.primary },

  warningBanner: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  warningText: { color: "#E65100", fontWeight: "bold" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 10,
    marginTop: 10,
  },

  infoBox: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  label: { fontSize: 14, color: "gray" },
  value: { fontSize: 14, color: theme.colors.text, fontWeight: "600" },

  tableContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  th: { fontSize: 13, fontWeight: "bold", color: "#555" },
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  td: { fontSize: 13, color: "#333" },

  contentBox: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  contentInner: { padding: 15, minHeight: 100 },
  contentText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 10,
  },

  imageContainer: {
    marginTop: 10,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
  },
  zoomIconContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 20,
  },

  notFoundContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
  },
  notFoundText: { fontSize: 16, color: "red", fontWeight: "bold" },
  notFoundSubText: { fontSize: 12, color: "gray" },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: wp(4),
    gap: 15,
  },
  btn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  btnIgnore: { backgroundColor: "#f0f0f0" },
  btnHide: { backgroundColor: "#ff4d4d" },

  btnTextIgnore: { color: "#555", fontWeight: "bold", fontSize: 16 },
  btnTextHide: { color: "white", fontWeight: "bold", fontSize: 16 },

  modalContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: { width: wp(100), height: hp(80) },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  closeText: { color: "white", fontSize: 16, fontWeight: "bold" },
  closeIconBg: {
    width: 30,
    height: 30,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
