import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { wp, hp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from '../../components/Avatar'
import { useRouter } from 'expo-router'
import Icon from '../../assets/icons'

// ✅ 1. Import your teammate's follow service
// (Make sure getUsersWithSimilarInterests is still imported!)
import { getUsersWithSimilarInterests, followUser, unfollowUser, getUserFollowingList, } from '../../services/userService'

const FindFriends = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Track which users have been followed locally to update UI instantly
    const [followedUsers, setFollowedUsers] = useState([]); 

    useEffect(() => {
        if(user) {
            fetchSimilarUsers();
            fetchFollowing();
        }
    }, [user]);

    const fetchSimilarUsers = async () => {
        setLoading(true);
        let res = await getUsersWithSimilarInterests(user.id);
        if (res.success) {
            setUsers(res.data);
        }
        setLoading(false);
    }

    // ✅ 3. 获取我已关注的人的 ID，并存入 state
    const fetchFollowing = async () => {
        let res = await getUserFollowingList(user.id);
        if (res.success) {
            setFollowedUsers(res.data); // 这样 UI 就会自动显示 "Following"
        }
    }

    // ✅ 2. Use the Follow function instead of Friend Request
    const handleFollow = async (targetUser) => {
        // Optimistic Update: Mark as followed immediately so button changes
        setFollowedUsers(prev => [...prev, targetUser.accountid]);

        // Call your teammate's function
        // Note: verify if your teammate needs (followerId, followingId) order
        // Based on profile.jsx, it seems to be: followUser(myId, targetId)
        let res = await followUser(user.id, targetUser.accountid);
        
        if (res.success) {
            console.log("Followed successfully");
        } else {
            // Revert if failed
            Alert.alert("Error", "Could not follow user");
            setFollowedUsers(prev => prev.filter(id => id !== targetUser.accountid));
        }
    }

    const handleUnfollow = async (targetUser) => {
        // 乐观更新：立刻把 ID 从列表里移除，让按钮变回 "Follow"
        setFollowedUsers(prev => prev.filter(id => id !== targetUser.accountid));

        const res = await unfollowUser(user.id, targetUser.accountid);
        
        if (res.success) {
            console.log("Unfollowed successfully");
        } else {
            Alert.alert("Error", "Could not unfollow user");
            // 失败回滚：如果 API 失败了，把 ID 加回去
            setFollowedUsers(prev => [...prev, targetUser.accountid]);
        }
    }

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={()=> router.back()}>
                        <Icon name="arrowLeft" size={hp(3.2)} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Find Friends</Text>
                    <View style={{width: hp(3.2)}} /> 
                </View>
                
                <Text style={styles.subTitle}>People with similar interests</Text>

                <FlatList 
                    data={users}
                    keyExtractor={item => item.accountid.toString()} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{paddingBottom: 30}}
                    renderItem={({item}) => {
                        // Check if we just followed them
                        const isFollowed = followedUsers.includes(item.accountid);

                        return (
                            <View style={styles.card}>
                                <TouchableOpacity 
                                    style={{flexDirection:'row', alignItems:'center', flex:1, gap:12}}
                                    onPress={() => router.push({
                                        pathname: 'profile',
                                        params: { userId: item.accountid }
                                    })}
                                >
                                    <Avatar 
                                        uri={item?.profileimage} 
                                        size={hp(6)}
                                        rounded={theme.radius.md}
                                    />
                                    <View style={{gap: 2}}>
                                        <Text style={styles.username}>{item.username}</Text>
                                        <Text style={styles.matchText}>
                                            {item.matchedInterests.length} shared interests
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* ✅ 3. Updated Button UI to "Follow" style */}
                                <TouchableOpacity 
                                    style={[
                                        styles.followButton, 
                                        isFollowed && styles.followingButton
                                    ]}
                                    // 如果 isFollowed 为 true -> 执行 handleUnfollow
                                    // 如果 isFollowed 为 false -> 执行 handleFollow
                                    onPress={() => isFollowed ? handleUnfollow(item) : handleFollow(item)}
                                    
                                >
                                    <Text style={[
                                        styles.followText, 
                                        isFollowed && styles.followingText
                                    ]}>
                                        {isFollowed ? "Following" : "Follow"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )
                    }}
                    ListEmptyComponent={
                        !loading && (
                            <Text style={styles.noData}>No new matches found.</Text>
                        )
                    }
                />
            </View>
        </ScreenWrapper>
    )
}

export default FindFriends

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(4),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    title: {
        fontSize: hp(2.5),
        fontWeight: theme.fonts.bold,
        color: theme.colors.text
    },
    subTitle: {
        fontSize: hp(1.6),
        color: theme.colors.textLight,
        marginBottom: 20
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', 
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: theme.colors.gray,
        padding: 12,
        borderRadius: theme.radius.md,
        marginBottom: 10,
    },
    username: {
        fontSize: hp(1.8),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textDark
    },
    matchText: {
        fontSize: hp(1.3),
        color: theme.colors.primary,
        fontWeight: '500'
    },
    noData: {
        textAlign: 'center',
        marginTop: 50,
        color: theme.colors.textLight
    },
    // ✅ 4. New Styles for the Follow Button
    followButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: theme.radius.md,
    },
    followingButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    followText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: hp(1.5),
    },
    followingText: {
        color: theme.colors.primary,
    }
})