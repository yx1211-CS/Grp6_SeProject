import { Image } from 'expo-image'
import { StyleSheet } from 'react-native'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import { getUserImageSource } from '../services/imageService'

const Avatar = ({
    uri,       // 兼容旧代码：接收文件名字符串
    source,    // 兼容新代码：接收完整的 source 对象
    size = hp(4.5),
    rounded = theme.radius.md,
    style={}
}) => {

    // 🌟 核心逻辑：优先用 source，如果没有，再尝试用 uri 去生成
    const finalSource = source ? source : getUserImageSource(uri);

    return (
        <Image
            source={finalSource} 
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