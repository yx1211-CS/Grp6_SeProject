import { Image } from 'expo-image'
import { StyleSheet } from 'react-native'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'

const Avatar = ({
    uri,
    size = hp(4.5),
    rounded = theme.radius.md,
    style={}
}) => {
  return (
    <Image
        source={uri ? {uri} : require('../assets/images/defaultUser.png')} 
        transition={100}
        style={[styles.avatar, {height: size, width: size, borderRadius: rounded}, style]}
    />
  )
}

export default Avatar

const styles = StyleSheet.create({
    avatar: {
        borderCurve: 'continuous',
        borderColor: theme.colors.darkLight,
        borderWidth: 1
    }
})