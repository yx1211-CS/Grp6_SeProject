import { Text, View } from "react-native";
import Header from "../../components/Header";
import ScreenWrapper from "../../components/ScreenWrapper";

const Notifications = () => {
  return (
    <ScreenWrapper bg="white">
      <Header title="Notifications" showBackButton={true} />
      <View>
        <Text>Notifications Screen</Text>
      </View>
    </ScreenWrapper>
  );
};
export default Notifications;
