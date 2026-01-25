import { Video } from 'expo-av'
import { Image } from 'expo-image'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import RenderHtml from 'react-native-render-html'
import Icon from '../assets/icons'
import { theme } from '../constants/theme'
import { hp, stripHtmlTags, wp } from '../helpers/common'
import { getSupabaseFileUrl, getUserImageSource } from '../services/imageService'
import { createPostLike, removePostLike, removePost } from '../services/postService'
import Avatar from './Avatar'
import { createNotification } from '../services/notificationService'

const textStyle = {
    color: theme.colors.text,
    fontSize: hp(1.75)
};


const tagsStyles = {
    div: textStyle,
    p: textStyle,
    ol: textStyle,
    h1: { color: theme.colors.textDark },
    h4: { color: theme.colors.textDark }
}

const PostCard = ({
    item,
    currentUser,
    router,
    hasShadow = true,
    showMoreIcon = true,
    onDelete, // 👈 新增：接收一个 onDelete 回调函数
    showDelete = true
    
}) => {
    
    const [likes, setLikes] = useState([]);

    useEffect(() => {
        setLikes(item?.reactions || []);
    }, [item])

    const shadowStyles = {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1
    }

    

const openPostDetails = () => {
    if (!item?.postid) return;
    
    // Navigate to the new page and pass the postId
    router.push({
        pathname: 'postDetails',
        params: { postId: item?.postid }
    });
}


    // 🔴 核心逻辑：点击三个点触发菜单
    const onMenuPress = () => {
        // 1. 判断是不是作者本人
        // 注意：确保 currentUser.id 和 item.userid 格式一致 (都是 UUID)
        const isOwner = currentUser?.id == item?.userid; 
  
        if (!isOwner) {
            // 如果不是作者，只显示举报
            Alert.alert('Post', 'Options', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Report Post', onPress: () => console.log('Reported logic here...') }
            ]);
        } else {
            // 如果是作者，显示编辑/删除
            Alert.alert('Post', 'Options', [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Edit', 
                    onPress: () => {
                        // 跳转去 NewPost，把当前帖子数据传过去
                        router.push({ pathname: 'newPost', params: { ...item } });
                    } 
                },
                { 
                    text: 'Delete', 
                    style: 'destructive', // 红色警告样式
                    onPress: handlePostDelete
                }
            ]);
        }
    }

    // 执行删除逻辑
    const handlePostDelete = async () => {
        const res = await removePost(item?.postid);
        if (res.success) {
            // 这里有个小问题：Profile 列表不会自动刷新，除非你刷新页面
            // 但帖子确实被删除了
            Alert.alert('Success', 'Post deleted successfully');
            if (onDelete) {
              onDelete(); 
            }
        } else {
            Alert.alert('Error', res.msg);
        }
    }

    const onLike = async () => {
        const liked = likes.filter(r => r.userid == currentUser?.accountid).length > 0;
        
        if (liked) {
            let updatedLikes = likes.filter(r => r.userid != currentUser?.accountid);
            setLikes([...updatedLikes]);

            const res = await removePostLike(item?.postid, currentUser?.accountid);
            if (!res.success) {
                Alert.alert('Post', 'Something went wrong!');
                setLikes([...likes]);
            }
        } else {
            const data = {
                userid: currentUser?.accountid, 
                postid: item?.postid,
                reactiontype: 'like' 
            }

            setLikes([...likes, data]);

            const res = await createPostLike(data);

            // 🔥 2. 发送通知逻辑 (只有点赞成功才发)
            if (res.success) {
                // 如果不是自己给自己点赞，才发通知
                if (currentUser?.id != item?.userid) {
                    let notify = {
                        senderid: currentUser?.id,
                        receiverid: item?.userid,
                        title: 'Liked your post',
                        data: JSON.stringify({ postId: item?.postid, commentId: null })
                    }
                    createNotification(notify);
                }
            }

            if (!res.success) {
                Alert.alert('Post', 'Something went wrong!');
                setLikes(likes);
            }
        }
    }

    const onShare = async () => {
        let content = {message: stripHtmlTags(item?.postcontent)};
        Share.share(content);
    }

    const createdAt = moment(item?.postcreatedat).format('MMM D');
    
    const liked = likes.filter(r => r.userid == currentUser?.accountid).length > 0;

   
    return (
      <View style={[styles.container, hasShadow && shadowStyles]}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar
              size={hp(4.5)}
              source={getUserImageSource(item?.user?.profileimage)}
              rounded={theme.radius.md}
            />
            <View style={{ gap: 2 }}>
              <Text style={styles.username}>{item?.user?.username}</Text>
              <Text style={styles.postTime}>{createdAt}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onMenuPress}>
            <Icon
              name="threeDotsHorizontal"
              size={hp(3.4)}
              strokeWidth={3}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.postBody}>
            {item?.postcontent && (
              <RenderHtml
                contentWidth={wp(100)}
                source={{ html: item?.postcontent }}
                tagsStyles={tagsStyles}
              />
            )}
          </View>


          

          {/* --- IMAGE FIX --- */}
          {item?.postfile && (
            <Image
              // CORRECTED: Added 'postImages' bucket name
              source={getSupabaseFileUrl("postImages", item?.postfile)}
              transition={100}
              style={styles.postMedia}
              contentFit="cover"
            />
          )}
          {/* --- VIDEO FIX --- */}
          {item?.postfile && item?.postfile.includes("postVideos") && (
            <Video
              style={[styles.postMedia, { height: hp(30) }]}
              // CORRECTED: Added 'postImages' bucket name (assuming videos are in same bucket or you change this to 'postVideos')
              source={getSupabaseFileUrl("postImages", item?.postfile)}
              useNativeControls
              resizeMode="cover"
              isLooping
            />
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerButton}>
            <TouchableOpacity onPress={onLike}>
              <Icon
                name="heart"
                size={24}
                fill={liked ? theme.colors.rose : "transparent"}
                color={liked ? theme.colors.rose : theme.colors.textLight}
              />
            </TouchableOpacity>
            <Text style={styles.count}>
                {likes.length}
                </Text>
          </View>
          <View style={styles.footerButton}>
            <TouchableOpacity onPress={openPostDetails}>
              <Icon name="comment" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>
            <Text style={styles.count}>{item?.replies?.[0]?.count || 0}</Text>
          </View>
          <View style={styles.footerButton}>
            <TouchableOpacity onPress={onShare}>
              <Icon name="share" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
}

export default PostCard

const styles = StyleSheet.create({
    container: {
        gap: 10,
        marginBottom: 15,
        borderRadius: theme.radius.xxl * 1.1,
        borderCurve: 'continuous',
        padding: 10,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: theme.colors.gray,
        shadowColor: '#000'
    },
    header: { flexDirection: 'row', justifyContent: 'space-between' },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    username: { fontSize: hp(1.7), color: theme.colors.textDark, fontWeight: theme.fonts.medium },
    postTime: { fontSize: hp(1.4), color: theme.colors.textLight, fontWeight: theme.fonts.medium },
    content: { gap: 10 },
    postMedia: { height: hp(40), width: '100%', borderRadius: theme.radius.xl, borderCurve: 'continuous' },
    postBody: { marginLeft: 5 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    footerButton: { marginLeft: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
    count: { color: theme.colors.text, fontSize: hp(1.8) }
})