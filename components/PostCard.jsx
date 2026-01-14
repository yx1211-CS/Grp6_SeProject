import { StyleSheet, Text, View, TouchableOpacity, Share } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp, wp, stripHtmlTags } from '../helpers/common'
import Avatar from './Avatar'
import moment from 'moment'
import Icon from '../assets/icons'
import RenderHtml from 'react-native-render-html';
import { Image } from 'expo-image'
import { getSupabaseFileUrl } from '../services/imageService'
import { Video } from 'expo-av';

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
}) => {
    
    const shadowStyles = {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1
    }

    const openPostDetails = () => {
        console.log("Pressed post details");
    }

    const onLike = async () => {
        console.log("Pressed Like");
    }

    const onShare = async () => {
        // ✅ 修正为小写: postcontent
        let content = {message: stripHtmlTags(item?.postcontent)};
        Share.share(content);
    }

    // ✅ 修正为小写: postcreatedat
    const createdAt = moment(item?.postcreatedat).format('MMM D');

    return (
        <View style={[styles.container, hasShadow && shadowStyles]}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Avatar
                        size={hp(4.5)}
                        uri={null} 
                        rounded={theme.radius.md}
                    />
                    <View style={{ gap: 2 }}>
                        <Text style={styles.username}>{item?.user?.username}</Text>
                        <Text style={styles.postTime}>{createdAt}</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={openPostDetails}>
                     <Icon name="threeDotsHorizontal" size={hp(3.4)} strokeWidth={3} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.postBody}>
                    {
                        // ✅ 修正为小写: postcontent
                        item?.postcontent && (
                            <RenderHtml
                                contentWidth={wp(100)}
                                source={{ html: item?.postcontent }}
                                tagsStyles={tagsStyles}
                            />
                        )
                    }
                </View>

                {/* ✅ 修正为小写: postfile */}
                {
                    item?.postfile && (
                         <Image
                            source={getSupabaseFileUrl(item?.postfile)}
                            transition={100}
                            style={styles.postMedia}
                            contentFit='cover'
                        />
                    )
                }
                
                {/* ✅ 修正为小写: postfile */}
                {
                    item?.postfile && item?.postfile.includes('postVideos') && (
                         <Video
                            style={[styles.postMedia, {height: hp(30)}]}
                            source={getSupabaseFileUrl(item?.postfile)}
                            useNativeControls
                            resizeMode="cover"
                            isLooping
                        />
                    )
                }
            </View>

            <View style={styles.footer}>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={onLike}>
                         <Icon name="heart" size={24} fill={theme.colors.textLight} color={theme.colors.textLight} />
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {item?.reactions?.length || 0}
                    </Text>
                </View>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={openPostDetails}>
                         <Icon name="comment" size={24} color={theme.colors.textLight} />
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {item?.replies?.[0]?.count || 0}
                    </Text>
                </View>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={onShare}>
                         <Icon name="share" size={24} color={theme.colors.textLight} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
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