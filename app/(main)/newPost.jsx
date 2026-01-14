import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Icon from '../../assets/icons'
import ScreenWrapper from '../../components/ScreenWrapper'
import { theme } from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { hp, wp } from '../../helpers/common'
import { supabase } from '../../lib/supabase'
import { uploadFile } from '../../services/imageService'

const NewPost = () => {
    const router = useRouter();
    const { user } = useAuth();
    const textRef = useRef("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // 打开相册
const onPickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            // FIX: Use a simple string array. 
            // This satisfies both the new API (runtime) and the old Types (editor).
            mediaTypes: ['images'], 
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setFile(result.assets[0]);
        }
    }
    // 提交发布
    const onSubmit = async () => {
        if (!textRef.current && !file) {
            Alert.alert('Post', 'Please add some text or an image!');
            return;
        }

        setLoading(true);

        try {
            let postFile = null;

            // 1. 如果有图，先上传图
            if (file) {
                // 上传到 'postImages' 文件夹
                let res = await uploadFile('postImages', file.uri, true);
                if (res.success) {
                    postFile = res.data;
                } else {
                    setLoading(false);
                    Alert.alert('Post', 'Image upload failed!');
                    return;
                }
            }

            // 2. 准备数据
            let data = {
                postcontent: textRef.current,
                postfile: postFile,
                // UPDATED: Using 'userid' to match your DB schema
                // UPDATED: Using 'user.id' which is the standard Supabase Auth ID
                userid: user?.id, 
            };

            // 3. 写入数据库
            const { error } = await supabase
                .from('post')
                .insert(data);

            if (error) {
                Alert.alert('Post', error.message);
                setLoading(false);
            } else {
                setLoading(false);
                router.back(); // 成功回首页
            }

        } catch (error) {
            Alert.alert('Post', error.message);
            setLoading(false);
        }
    }

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Icon name="arrowLeft" size={hp(3.2)} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create New Post</Text>
                    <TouchableOpacity
                        onPress={onSubmit}
                        style={styles.sendBtn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.sendText}>Post</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ gap: 20 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.inputRow}>
                        {/* FIX: If your user object has an image property (e.g. user.image), 
                           use that instead of the hardcoded URL:
                           uri: user?.image || 'https://...default...'
                        */}
                        <Image
                            source={{ uri: user?.image || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                            style={styles.avatar}
                        />
                        <View style={{ gap: 2 }}>
                            <Text style={styles.username}>{user?.username}</Text>
                            <Text style={styles.publicText}>Public</Text>
                        </View>
                    </View>

                    <View style={styles.textEditor}>
                        <TextInput
                            placeholder="What's on your mind?"
                            placeholderTextColor={theme.colors.textLight}
                            style={styles.input}
                            multiline
                            onChangeText={value => textRef.current = value}
                        />
                    </View>

                    {/* 图片预览区域 */}
                    {
                        file && (
                            <View style={styles.file}>
                                <Image source={{ uri: file.uri }} style={{ flex: 1 }} resizeMode="cover" />
                                <TouchableOpacity onPress={() => setFile(null)} style={styles.closeIcon}>
                                    <Icon name="delete" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        )
                    }

                    <View style={styles.media}>
                        <Text style={styles.addImageText}>Add to your post</Text>
                        <View style={styles.mediaIcons}>
                            <TouchableOpacity onPress={onPickImage}>
                                <Icon name="image" size={30} color={theme.colors.dark} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    )
}

export default NewPost

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: wp(4), gap: 15 },
    title: { fontSize: hp(2.5), fontWeight: theme.fonts.semibold, color: theme.colors.text },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sendBtn: { height: hp(4.5), width: hp(8), borderRadius: theme.radius.xl, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', borderCurve: 'continuous' },
    sendText: { color: 'white', fontSize: hp(1.6), fontWeight: theme.fonts.semibold },
    avatar: { height: hp(6.5), width: hp(6.5), borderRadius: theme.radius.xl, borderCurve: 'continuous', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    username: { fontSize: hp(2.2), fontWeight: theme.fonts.semibold, color: theme.colors.text },
    publicText: { fontSize: hp(1.7), fontWeight: theme.fonts.medium, color: theme.colors.textLight },
    textEditor: { marginTop: 10, minHeight: hp(10) },
    input: { fontSize: hp(2.5), color: theme.colors.textDark },
    media: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, padding: 12, paddingHorizontal: 18, borderRadius: theme.radius.xl, borderColor: theme.colors.gray, borderCurve: 'continuous' },
    mediaIcons: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    addImageText: { fontSize: hp(1.9), fontWeight: theme.fonts.semibold, color: theme.colors.text },
    file: { height: hp(30), width: '100%', borderRadius: theme.radius.xl, overflow: 'hidden', borderCurve: 'continuous' },
    closeIcon: { position: 'absolute', top: 10, right: 10, padding: 7, borderRadius: 50, backgroundColor: 'rgba(255,0,0,0.6)' }
})