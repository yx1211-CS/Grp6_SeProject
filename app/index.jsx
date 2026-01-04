import { View, Text, Button } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { ScreenContentWrapper } from 'react-native-screens';

const index = () => {
    const router = useRouter();
  return (
    <ScreenContentWrapper>
      <Text>index</Text>
      <Button title="welcome" onPress={()=> router.push('welcome')} />
    </ScreenContentWrapper>
  )
}

export default index