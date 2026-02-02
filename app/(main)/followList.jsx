import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Header from '../../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getFollowersList, getFollowingList } from '../../services/userService'
import Avatar from '../../components/Avatar'
import { theme } from '../../constants/theme'
import { hp, wp } from '../../helpers/common'
import Loading from '../../components/Loading'

const FollowList = () => {
    const router = useRouter();
    // 获取参数：userId 是谁的列表，type 是看 'followers' 还是 'following'
    const { userId, type } = useLocalSearchParams(); 
    
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(userId && type) {
            fetchData();
        }
    }, [userId, type]);

    const fetchData = async () => {
        setLoading(true);
        let res;
        
        // 根据类型调用不同的 Service 函数
        if (type === 'followers') {
            res = await getFollowersList(userId);
        } else {
            res = await getFollowingList(userId);
        }

        if (res.success) {
            setUsers(res.data);
        } else {
            Alert.alert("Error", res.msg);
        }
        setLoading(false);
    }

    const handleUserPress = (selectedUserId) => {
        // 点击列表里的某个人，跳转去他的 Profile
        router.push({
            pathname: '(main)/profile',
            params: { userId: selectedUserId }
        });
    }

    const renderItem = ({ item }) => {
        if(!item) return null; 
        
        return (
            <TouchableOpacity 
                style={styles.userCard} 
                onPress={() => handleUserPress(item.accountid)}
            >
                <Avatar 
                    uri={item.profileimage} 
                    size={hp(6)} 
                    rounded={theme.radius.xl} 
                />
                <View style={{flex: 1, gap: 2}}>
                    <Text style={styles.username}>{item.username}</Text>
                    {/* 如果有 Bio 就显示，太长就截断 */}
                    {item.bio && (
                        <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
                    )}
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                <Header title={type === 'followers' ? "Followers" : "Following"} showBackButton={true} />

                {loading ? (
                    <Loading />
                ) : (
                    <FlatList 
                        data={users}
                        renderItem={renderItem}
                        keyExtractor={item => item.accountid.toString()}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    {type === 'followers' ? "No followers yet." : "Not following anyone yet."}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </ScreenWrapper>
    )
}

export default FollowList

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(4),
    },
    listContent: {
        paddingTop: 20,
        gap: 15
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        padding: 10,
        backgroundColor: 'white',
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray,
        // 加点阴影让卡片更好看
        shadowColor: theme.colors.textLight,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    username: {
        fontSize: hp(1.8),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textDark
    },
    bio: {
        fontSize: hp(1.5),
        color: theme.colors.textLight
    },
    emptyContainer: {
        marginTop: 50,
        alignItems: 'center'
    },
    emptyText: {
        color: theme.colors.textLight,
        fontSize: hp(1.6)
    }
})