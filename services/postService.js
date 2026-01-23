import { supabase } from "../lib/supabase";

// 1. 获取帖子列表 (Fetch Posts)
export const fetchPosts = async (limit = 10) => {
    try {
        const { data, error } = await supabase
            .from('post') 
            .select(`
                *,
                user: account (accountid, username, role, profileimage), 
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

// ---------------------------------------------------------
// NEW FUNCTIONS FOR COMMENTS (Step 1)
// ---------------------------------------------------------

// 4. 获取评论 (Fetch Replies)
export const fetchPostReplies = async (postId) => {
    try {
        const { data, error } = await supabase
            .from('reply')
            .select(`
                *,
                user: userid (username, image) 
            `) // 这里改用 userid，因为它指向 account 表
            .eq('postid', postId)
            .order('replycreatedat', { ascending: true }); // 评论通常按时间正序排列

        if (error) {
            console.log('fetchPostReplies error: ', error);
            return { success: false, msg: 'Could not fetch replies' };
        }
        
        // 调试：看看返回的 data 里是否有 user 对象
        // console.log('Fetched replies with user info: ', data[0]?.user);
        
        return { success: true, data: data };

    } catch (error) {
        console.log('fetchPostReplies error: ', error);
        return { success: false, msg: 'Could not fetch replies' };
    }
}

// 5. 发送评论 (Create Reply)
export const createReply = async (replyData) => {
    try {
        const { data, error } = await supabase
            .from('reply')
            .insert(replyData)
            .select(`
                *,
                user: account (accountid, username, profileimage)
            `)
            .single();

        if (error) {
            console.log('createReply error: ', error);
            return { success: false, msg: 'Could not create reply' };
        }
        return { success: true, data: data };

    } catch (error) {
        console.log('createReply error: ', error);
        return { success: false, msg: 'Could not create reply' };
    }
}
// 6. 删除评论 (Delete Reply)
export const removeReply = async (replyId) => {
    try {
        const { error } = await supabase
            .from('reply')
            .delete()
            .eq('replyid', replyId);

        if (error) {
            console.log('removeReply error: ', error);
            return { success: false, msg: 'Could not remove reply' };
        }
        return { success: true };

    } catch (error) {
        console.log('removeReply error: ', error);
        return { success: false, msg: 'Could not remove reply' };
    }
}