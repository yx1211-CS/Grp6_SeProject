import { supabase } from "../lib/supabase";

export const fetchPosts = async (limit = 10) => {
    try {
        const { data, error } = await supabase
            .from('post') // <--- 你的表名是 post (单数)
            .select(`
                *,
                user: account (accountid, username, role), 
                reactions: reaction (*),
                replies: reply (count)
            `)
            .order('postcreatedat', { ascending: false }) // <--- 你的时间字段是 postCreatedAt
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