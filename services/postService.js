import { supabase } from "../lib/supabase";

// 1. 获取帖子列表 (Fetch Posts)
export const fetchPosts = async (limit = 10, userId) => {
    try {
        // 2. 先建立 Query "构造器" (注意：这里不要加 await)
        // 这里的 query 只是一个准备好的指令，还没发射出去
        let query = supabase
            .from('post') 
            .select(`
                *,
                user: account (accountid, username, role, profileimage), 
                reactions: reaction (*),
                replies: reply (count)
            `)
            .order('postcreatedat', { ascending: false }) 
            .limit(limit);

        // 3. 如果有 userId，就在指令里追加一个筛选条件
        if (userId) {
            query = query.eq('userid', userId); // ✅ 这里追加条件
        }

        // 4. 一切准备就绪，在这里才加上 await 发射请求
        const { data, error } = await query;


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

// 2. 删除帖子 (Delete)
export const removePost = async (postId) => {
    try {
        const { error } = await supabase
            .from('post') // ✅ 改成 'post'
            .delete()
            .eq('postid', postId); // ✅ 改成 'postid'

        if (error) {
            console.log('removePost error: ', error);
            return { success: false, msg: 'Could not remove the post' };
        }
        return { success: true, data: { postId } };

    } catch (error) {
        console.log('removePost error: ', error);
        return { success: false, msg: 'Could not remove the post' };
    }
}

// 3. 创建或更新帖子 (Upsert)
export const createOrUpdatePost = async (postData) => {
    try {
        const { data, error } = await supabase
            .from('post') // ✅ 改成 'post'
            .upsert(postData) // Upsert 会根据 postid 自动判断是插入还是更新
            .select()
            .single();

        if (error) {
            console.log('createOrUpdatePost error: ', error);
            return { success: false, msg: 'Could not create/update post' };
        }
        return { success: true, data: data };

    } catch (error) {
        console.log('createOrUpdatePost error: ', error);
        return { success: false, msg: 'Could not create/update post' };
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
                user: account (username, profileimage) 
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