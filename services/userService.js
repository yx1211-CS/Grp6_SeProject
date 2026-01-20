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