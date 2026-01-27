import { Header } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import NotificationItem from "../../components/NotificationItem";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { hp, wp } from "../../helpers/common";
import { fetchNotifications } from "../../services/notificationService";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications();
  }, [user]);

  const getNotifications = async () => {
    // ✅ 适配：传入 user.id (如果你的 auth object 里是 accountid，请改用 user.accountid)
    if (!user) return;
    let res = await fetchNotifications(user.id);
    if (res.success) {
      setNotifications(res.data);
    }
    setLoading(false);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title="Notifications" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
        >
          {notifications.map((item) => {
            return (
              <NotificationItem
                item={item}
                // ✅ 适配：你的主键叫 notificationid
                key={item?.notificationid}
                router={router}
              />
            );
          })}
          {notifications.length === 0 && (
            <Text style={styles.noData}>No notifications yet</Text>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  listStyle: {
    paddingVertical: 20,
    gap: 10,
  },
  noData: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
    textAlign: "center",
  },
});
