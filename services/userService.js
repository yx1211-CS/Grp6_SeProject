import { supabase } from "../lib/supabase";

export const getUserData = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('account') // <--- 你的用户表叫 account
            .select('*')
            .eq('accountid', userId) // <--- 你的ID字段叫 accountID
            .single();

        if (error) {
            return { success: false, msg: error?.message };
        }
        return { success: true, data };
    } catch (error) {
        console.log('got error: ', error);
        return { success: false, msg: error.message };
    }
}

export const updateUser = async (userId, data) => {
    const { error } = await supabase
        .from('account') // ⚠️ 修改点 1: 你的表名叫 account
        .update({
            username: data.username,
            phonenumber: data.phoneNumber,   // 前端是 phoneNumber -> 数据库是 phonenumber
            profileimage: data.profileImage, // 前端是 profileImage -> 数据库是 profileimage
            address: data.address,
            bio: data.bio
        })
        .eq('accountid', userId); // ⚠️ 修改点 2: 你的主键叫 accountID
        
    if (error) {
        return { success: false, msg: error.message };
    }
    return { success: true, data };
}