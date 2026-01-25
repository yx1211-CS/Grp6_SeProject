import { supabase } from "../lib/supabase";

// 1. 创建通知
export const createNotification = async (notification) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) {
            console.log('notification error: ', error);
            return { success: false, msg: 'Something went wrong!' };
        }
        return { success: true, data: data };

    } catch (error) {
        console.log('notification error: ', error);
        return { success: false, msg: 'Something went wrong!' };
    }
}

// 2. 获取通知列表
export const fetchNotifications = async (receiverId) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                sender: senderid (accountid, username, profileimage) 
            `) 
            // 👆 这里关键：senderid 是你在 notification 表里的列名
            // accountid, username... 是你 account 表里的列名
            .eq('receiverid', receiverId) // 筛选发给我的
            .order('created_at', { ascending: false });

        if (error) {
            console.log('fetchNotifications error: ', error);
            return { success: false, msg: 'Could not fetch notifications' };
        }
        return { success: true, data: data };

    } catch (error) {
        console.log('fetchNotifications error: ', error);
        return { success: false, msg: 'Could not fetch notifications' };
    }
}