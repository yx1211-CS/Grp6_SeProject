import React from 'react';
import { View, Text } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';

const Notifications = () => {
  return (
    <ScreenWrapper bg="white">
      <Header title="Notifications" showBackButton={true} />
      <View>
        <Text>Notifications Screen</Text>
      </View>
    </ScreenWrapper>
  )
}
export default Notifications;