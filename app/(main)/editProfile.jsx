import React from 'react';
import { View, Text } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';

const EditProfile = () => {
  return (
    <ScreenWrapper bg="white">
      <Header title="Edit Profile" showBackButton={true} />
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text>Edit Profile Screen</Text>
      </View>
    </ScreenWrapper>
  )
}
export default EditProfile;