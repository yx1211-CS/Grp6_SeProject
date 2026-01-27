import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";

// 1. 创建通知
export const createNotification = async (notification) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.log("notification error: ", error);
      return { success: false, msg: "Something went wrong!" };
    }
    return { success: true, data: data };
  } catch (error) {
    console.log("notification error: ", error);
    return { success: false, msg: "Something went wrong!" };
  }
};

// 2. 获取通知列表
export const fetchNotifications = async (receiverId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
                *,
                sender: senderid (accountid, username, profileimage) 
            `,
      )
      // 👆 这里关键：senderid 是你在 notification 表里的列名
      // accountid, username... 是你 account 表里的列名
      .eq("receiverid", receiverId) // 筛选发给我的
      .order("created_at", { ascending: false });

    if (error) {
      console.log("fetchNotifications error: ", error);
      return { success: false, msg: "Could not fetch notifications" };
    }
    return { success: true, data: data };
  } catch (error) {
    console.log("fetchNotifications error: ", error);
    return { success: false, msg: "Could not fetch notifications" };
  }
};

const router = useRouter();

// 🔥 核心修改：智能处理通知点击
const handleNotificationPress = (item) => {
  console.log("Clicked notification data:", item.data); // 调试用，看看数据长啥样

  let data = {};

  // 1. 安全解析 JSON
  try {
    // 数据库里的 data 可能是 JSON 对象，也可能是字符串，这里做个兼容
    data = typeof item.data === "string" ? JSON.parse(item.data) : item.data;
  } catch (error) {
    console.log("解析数据失败:", error);
    return;
  }

  // 2. 分流逻辑
  if (data.type === "feedback_reply") {
    // ✅ 情况 A：如果是反馈回复，直接弹窗显示内容
    Alert.alert(
      "Counselor Reply 💬",
      data.message || "No message content",
      [{ text: "OK" }], // 用户点 OK 就关闭
    );
  } else if (data.postId || data.postid) {
    // ✅ 情况 B：如果是帖子相关（点赞/评论），跳转去帖子详情
    // 注意：检查一下你的 postId 是大写还是小写，Supabase 经常是全小写 postid
    const targetPostId = data.postId || data.postid;
    router.push({ pathname: "postDetails", params: { postId: targetPostId } });
  } else {
    // ✅ 情况 C：未知类型
    console.log("Unknown notification type, doing nothing.");
    Alert.alert("Notification", "New notification received.");
  }
};
