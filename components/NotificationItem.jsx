import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp, wp } from '../helpers/common'
import Avatar from './Avatar'
import moment from 'moment'
import { useRouter } from 'expo-router'

const NotificationItem = ({
  item,
  router
}) => {
  
  const handleClick = () => {
    // 解析存在数据库里的 JSON 数据
    let { postId, commentId } = JSON.parse(item.data);
    
    // 跳转到帖子详情，并带上 commentId 用于高亮
    router.push({
        pathname: 'postDetails',
        params: {
            postId: postId,
            commentId: commentId
        }
    })
  }

  // 格式化时间
  const createdAt = moment(item?.created_at).format('MMM D');

  return (
    <TouchableOpacity style={styles.container} onPress={handleClick}>
      <Avatar
        // ✅ 适配：这里改成 sender.profileimage
        uri={item?.sender?.profileimage} 
        size={hp(5)}
      />
      <View style={styles.nameTitle}>
        <Text style={styles.text}>
            {item?.sender?.username} 
        </Text>
        <Text style={[styles.text, {color: theme.colors.textDark}]}>
            {item?.title}
        </Text>
      </View>
      
      <Text style={[styles.text, {color: theme.colors.textLight}]}>
        {createdAt}
      </Text>
    </TouchableOpacity>
  )
}

export default NotificationItem

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    padding: 15,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous'
  },
  nameTitle: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
  }
})