import { supabase } from "../lib/supabase";

// 1. 获取帖子列表 (Fetch Posts)
export const fetchPosts = async (limit = 10) => {
    try {
        const { data, error } = await supabase
            .from('post') 
            .select(`
                *,
                user: account (accountid, username, role), 
                reactions: reaction (*),
                replies: reply (count)
            `)
            .order('postcreatedat', { ascending: false }) 
            .limit(limit);

        if (error) {
            console.log('fetchPosts error: ', error);
            return { success: false, msg: 'Could not fetch posts' };
        }

        return { success: true, data: data };

    } catch (error) {
        console.log('fetchPosts error: ', error);
        return { success: false, msg: 'Could not fetch posts' };
    }
}

// 2. 点赞 (Create Like)
export const createPostLike = async (postLike) => {
    try {
        const { data, error } = await supabase
            .from('reaction') 
            .insert(postLike)
            .select()
            .single();

        if (error) {
            console.log('postLike error: ', error);
            return { success: false, msg: 'Could not like the post' };
        }
        return { success: true, data: data };

    } catch (error) {
        console.log('postLike error: ', error);
        return { success: false, msg: 'Could not like the post' };
    }
}

// 3. 取消点赞 (Remove Like)
export const removePostLike = async (postId, userId) => {
    try {
        const { error } = await supabase
            .from('reaction') 
            .delete()
            // ✅ CORRECTION: Changed 'accountid' to 'userid' to match your database table
            .eq('userid', userId) 
            .eq('postid', postId); 

        if (error) {
            console.log('removePostLike error: ', error);
            return { success: false, msg: 'Could not remove the like' };
        }
        return { success: true };

    } catch (error) {
        console.log('removePostLike error: ', error);
        return { success: false, msg: 'Could not remove the like' };
    }
}