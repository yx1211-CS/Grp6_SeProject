import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from '../assets/icons';
import CommentItem from '../components/CommentItem';
import PostCard from '../components/PostCard';
import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';
// Unified imports
import { createReply, fetchPostReplies, removeReply } from '../services/postService';
import { removePost } from '../services/postService';

const PostDetails = () => {
    const { postId } = useLocalSearchParams();
    const {user} = useAuth();
    const router = useRouter();
    
    const [post, setPost] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const inputRef = useRef(null);
    const commentRef = useRef('');

    useEffect(() => {
        getPostDetails();
        getReplies();
    }, []);

    const onMenuPress = () => {
      // 1. 权限检查：只有作者本人能操作
      // 注意：Supabase 返回的 userid 可能是 string，确保类型一致
      const isOwner = user?.id == post?.userid;

      if (!isOwner) {
        // 如果不是作者，只显示举报
        Alert.alert("Post", "Options", [
          { text: "Cancel", style: "cancel" },
          { text: "Report Post", onPress: () => console.log("Reported") },
        ]);
        return;
      }

      // 2. 如果是作者，显示编辑/删除
      Alert.alert("Post", "Options", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit",
          onPress: () => {
            // ✅ 跳转去 NewPost，把当前帖子数据传过去
            // 注意：这里会自动把 postcontent, postfile 等传过去
            router.push({ pathname: "newPost", params: { ...post } });
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // ✅ 执行删除
            const res = await removePost(post?.postid);
            if (res.success) {
              // 如果是在详情页，删除后退回上一页
              // router.back();
              // 如果是在首页，这里通常需要通知父组件刷新 list
            } else {
              Alert.alert("Error", res.msg);
            }
          },
        },
      ]);
    };

    // 1. Fetch the Post Data
    const getPostDetails = async () => {
        const { data, error } = await supabase
            .from('post')
            .select('*, user: account (username, profileimage), reactions: reaction (*)')
            .eq('postid', postId)
            .single();
        
        //if (error) {console.log('getPostDetails error:', error); // 加个 log 方便排查
        //}
        if (data) setPost(data);
        setLoading(false);
    }

    // 2. Fetch Replies
    const getReplies = async () => {
        let res = await fetchPostReplies(postId);
        if (res.success) setReplies(res.data);
    }

    // 3. Send Reply
    const onNewReply = async () => {
        if (!commentRef.current) return null;
        let data = {
            postid: postId,
            userid: user?.id,
            replycontent: commentRef.current,
        };

        setSending(true);
        let res = await createReply(data);
        setSending(false);

        if (res.success) {
            // Optimistic Update
            let newReply = { ...res.data, user: user }; 
            setReplies([...replies, newReply]);
            
            // Clear input
            inputRef?.current?.clear();
            commentRef.current = "";
            Keyboard.dismiss();
        } else {
            Alert.alert('Comment', res.msg);
        }
    }

    // 4. Delete Reply (NEW FUNCTION)
    const onDeleteComment = async (comment) => {
        // Optimistically remove from UI first for speed
        let updatedReplies = replies.filter(r => r.replyid != comment.replyid);
        setReplies([...updatedReplies]);

        // Send delete request to server
        let res = await removeReply(comment.replyid);
        if (!res.success) {
            Alert.alert('Error', 'Could not delete comment');
            // Revert if failed
            setReplies([...replies]); 
        }
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <Text>Loading...</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Icon name="arrowLeft" size={hp(3.2)} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Post Details</Text>
                    <View style={{width: hp(3.2)}} /> 
                </View>

                {/* The Main Post */}
                <PostCard
                    item={{
        ...post, 
        replies: [{ count: replies.length }] 
    }}
    currentUser={user}
    router={router}
    hasShadow={false}
    showMoreIcon={false} 
                />

                {/* Comments Section */}
                <View style={styles.replies}>
                    <Text style={styles.replyTitle}>Comments ({replies.length})</Text>
                    {
                        replies.map(reply => (
                             <CommentItem 
                                key={reply?.replyid?.toString()} 
                                item={reply} 
                                // Logic: Allow delete if current user owns comment OR current user owns the post
                                canDelete={user?.id == reply?.userid || user?.id == post?.userid} 
                                onDelete={onDeleteComment} // <--- Added this prop
                            />
                        ))
                    }
                </View>
            </ScrollView>

            {/* Input Footer */}
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        onChangeText={value => commentRef.current = value}
                        placeholder="Type comment..."
                        placeholderTextColor={theme.colors.textLight}
                        style={styles.input}
                    />
                    <TouchableOpacity onPress={onNewReply} style={styles.sendIcon}>
                        <Icon name="send" color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    )
}

export default PostDetails;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white', paddingVertical: wp(7) },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp(4), marginBottom: 15 },
    headerTitle: { fontSize: hp(2.5), fontWeight: theme.fonts.bold, color: theme.colors.text },
    list: { paddingHorizontal: wp(4), paddingBottom: 100 },
    replies: { marginTop: 20, gap: 15 },
    replyTitle: { fontSize: hp(2), fontWeight: theme.fonts.bold, color: theme.colors.text, marginBottom: 10 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: wp(4), paddingTop: 10, borderTopWidth: 1, borderColor: theme.colors.gray, backgroundColor: 'white' },
    input: { flex: 1, height: hp(6), borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.gray, paddingHorizontal: 15 },
    sendIcon: { height: hp(5.8), width: hp(5.8), borderRadius: theme.radius.xl, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.gray },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' }
})