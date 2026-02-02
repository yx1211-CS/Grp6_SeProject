import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function ChatRoom() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams(); 
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [myRole, setMyRole] = useState(null);

  useEffect(() => {
    if (!user) return;

    initChat();

    const chatSubscription = supabase
      .channel("realtime-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat",
          filter: `taskid=eq.${requestId}`,
        },
        (payload) => {
          setMessages((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatSubscription);
    };
  }, []);

  const initChat = async () => {
    await checkMyRole();
    await fetchMessages();
  };

  const checkMyRole = async () => {
    try {
      const { data } = await supabase
        .from("account")
        .select("role")
        .eq("accountid", user.id)
        .single();

      if (data) {
        setMyRole(data.role);
      }
    } catch (e) {
      console.log("get role failed:", e);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("chat")
      .select("*")
      .eq("taskid", requestId)
      .order("chatstarttime", { ascending: false });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setMessages(data || []);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    if (!myRole) return;

    const messageContent = text.trim();
    setText("");

    const roleLower = myRole.toLowerCase();
    const isStudent = roleLower === "user" || roleLower === "student";

    const messageData = {
      taskid: requestId,
      chatcontent: messageContent,
      chatstarttime: new Date().toISOString(),
      userid: isStudent ? user.id : null,
      helperid: !isStudent ? user.id : null,
    };

    try {
      const { error } = await supabase.from("chat").insert(messageData);
      if (error) throw error;
    } catch (error) {
      Alert.alert("Error sending", error.message);
      setText(messageContent);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    let timeVal = dateString;
    if (!timeVal.includes("Z") && !timeVal.includes("+")) {
      timeVal += "Z";
    }
    const date = new Date(timeVal);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-US", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper function to get anonymous display name
  const getDisplayName = () => {
    if (!myRole) return "Chat";
    return myRole.toLowerCase() === "user" ? "Peer Helper" : "User";
  };

  const renderItem = ({ item }) => {
    const isMyMessage = item.userid === user.id || item.helperid === user.id;

    return (
      <View
        style={[
          styles.msgContainer,
          isMyMessage ? styles.myMsg : styles.otherMsg,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMyMessage ? styles.myBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.msgText,
              isMyMessage ? styles.myText : styles.otherText,
            ]}
          >
            {item.chatcontent}
          </Text>
          <Text
            style={[
              styles.timeText,
              isMyMessage ? { color: "#C5CAE9" } : { color: "gray" },
            ]}
          >
            {formatTime(item.chatstarttime)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper bg="#F5F5F5">
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          {/* Anonymized Partner Name */}
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#333" }}>
            {getDisplayName()}
          </Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item, index) =>
          item.chatid ? item.chatid.toString() : index.toString()
        }
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
        inverted
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Feather name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#eee",
    elevation: 2,
  },
  msgContainer: { marginBottom: 10, width: "100%", flexDirection: "row" },
  myMsg: { justifyContent: "flex-end" },
  otherMsg: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  myBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 2,
  },
  otherBubble: { backgroundColor: "white", borderBottomLeftRadius: 2 },
  msgText: { fontSize: 15, lineHeight: 20 },
  myText: { color: "white" },
  otherText: { color: "#333" },
  timeText: { fontSize: 10, marginTop: 5, alignSelf: "flex-end" },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "white",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  input: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
