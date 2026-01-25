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
import { createNotification } from '../services/notificationService';

const PostDetails = () => {
    const { postId, commentId } = useLocalSearchParams();
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

            if (user.id != post.userid) {
                let notify = {
                    senderid: user.id,   // ✅ 适配：senderid
                    receiverid: post.userid, // ✅ 适配：receiverid
                    title: 'commented on your post',
                    // 把 postId 和 新生成的 replyid 存进去
                    data: JSON.stringify({ postId: postId, commentId: res.data.replyid }) 
                }
                createNotification(notify);
            }

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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Icon name="arrowLeft" size={hp(3.2)} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Post Details</Text>
            <View style={{ width: hp(3.2) }} />
          </View>

          {/* The Main Post */}
          <PostCard
            item={{
              ...post,
              replies: [{ count: replies.length }],
            }}
            currentUser={user}
            router={router}
            hasShadow={false}
            showMoreIcon={false}
            onDelete={() => router.back()}
          />

          {/* Comments Section */}
          <View style={styles.replies}>
            <Text style={styles.replyTitle}>Comments ({replies.length})</Text>
            {replies.map((reply) => (
              <CommentItem
                key={reply?.replyid?.toString()}
                item={reply}
                // Logic: Allow delete if current user owns comment OR current user owns the post
                highlight={reply.replyid == commentId}
                canDelete={
                  user?.id == reply?.userid || user?.id == post?.userid
                }
                onDelete={onDeleteComment} // <--- Added this prop
              />
            ))}
          </View>
        </ScrollView>

        {/* Input Footer */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              onChangeText={(value) => (commentRef.current = value)}
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
    );
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