import { useRouter } from 'expo-router'
import { Alert, Button, StyleSheet, Text, View } from 'react-native'
import ScreenWrapper from '../../components/ScreenWrapper'
import { theme } from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { hp, wp } from '../../helpers/common'
import { supabase } from '../../lib/supabase'

import { useEffect, useState } from 'react'
import { FlatList, Pressable} from 'react-native'
import Icon from '../../assets/icons'
import Avatar from '../../components/Avatar'
import Loading from '../../components/Loading'
import PostCard from '../../components/PostCard'
import { fetchPosts } from '../../services/postService'
import { getUserData } from '../../services/userService'

let limit = 0;

const Home = () => {

    const router = useRouter(); 
    const { user, setAuth } = useAuth();

    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // REALTIME UPDATES: Listen for new posts
    const handlePostEvent = async (payload) => {
        // UPDATED: Check for 'postID' (your database primary key)
        if(payload.eventType == 'INSERT' && payload?.new?.postID){
            let newPost = {...payload.new};
            
            // UPDATED: Fetch user data using 'userID' (your foreign key)
            // Note: Ensure your getUserData service is also updated to query the 'account' table!
            let res = await getUserData(newPost.userID);
            
            // UPDATED: Initialize 'reactions' array (was post_likes)
            newPost.reactions = [];
            // UPDATED: Initialize 'replies' count (was comments)
            newPost.replies = [{count: 0}];
            
            newPost.user = res.success? res.data : {};
            setPosts(prevPosts => [newPost, ...prevPosts]);
        }
    }

    useEffect(() => {
        // Subscribe to Supabase Realtime Channel
        const postChannel = supabase
        .channel('posts')
        // UPDATED: Table name is 'post' (singular), not 'posts'
        .on('postgres_changes', {event: '*', schema: 'public', table: 'post'}, handlePostEvent)
        .subscribe();

        // Initial Load
        getPosts();

        return () => {
            supabase.removeChannel(postChannel);
        }
    }, [])

    const getPosts = async () => {
        if(!hasMore) return null;
        limit = limit + 10;
        
        console.log('fetching posts: ', limit);
        let res = await fetchPosts(limit);
        if(res.success){
            if(posts.length == res.data.length) setHasMore(false);
            setPosts(res.data);
        }
    }


    

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
         {/* Header */}
        <View style={styles.header}>
            <Text style={styles.title}>LinkUp</Text>
            <View style={styles.icons}>
                <Pressable onPress={() => router.push('notifications')}>
                     <Icon name="heart" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
                </Pressable>
                <Pressable onPress={() => router.push('newPost')}>
                     <Icon name="plus" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
                </Pressable>
                <Pressable onPress={() => router.push('profile')}>
                     <Avatar
                        uri={user?.image}
                        size={hp(4.3)}
                        rounded={theme.radius.sm}
                        style={{borderWidth: 2}}
                     />
                </Pressable>
            </View>
        </View>

        {/* Post Feed */}
        <FlatList
            data={posts}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listStyle}
            // UPDATED: keyExtractor uses item.postID
            keyExtractor={item => item.postid.toString()}
            renderItem={({item}) => <PostCard item={item} currentUser={user} router={router} />}
            onEndReached={()=>{
                getPosts();
            }}
            onEndReachedThreshold={0}
            ListFooterComponent={hasMore? (
               <View style={{marginVertical: 30}}>
                   <Loading />
               </View>
            ) : (
                <View style={{marginVertical: 30}}>
                    <Text style={styles.noPosts}>No more posts</Text>
                </View>
            )}
        />


        <View style={{marginTop: 50}}>
            <Button 
                title="Go to Counselor （DEMObutton）" 
                onPress={() => router.push('/counselor')} 
            />
            <Button 
                title="Go to moderator （DEMObutton）" 
                onPress={() => router.push('/moderator')} 
            />
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(4)
    },
     header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginHorizontal: wp(4)
    },
    title: {
        fontSize: hp(3),
        fontWeight: theme.fonts.bold,
        color: theme.colors.text
    },
     icons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18
    },
    listStyle: {
        paddingTop: 20,
        paddingHorizontal: wp(4)
    },
    noPosts: {
        fontSize: hp(2),
        textAlign: 'center',
        color: theme.colors.text
    }
})