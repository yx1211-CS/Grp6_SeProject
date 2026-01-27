import moment from "moment";
import { supabase } from "../lib/supabase";

// ==============================
// Existing Profile Functions
// ==============================

export const getUserData = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("account") // <--- 你的用户表叫 account
      .select("*")
      .eq("accountid", userId) // <--- 你的ID字段叫 accountID
      .single();

    if (error) {
      return { success: false, msg: error?.message };
    }
    return { success: true, data };
  } catch (error) {
    console.log("got error: ", error);
    return { success: false, msg: error.message };
  }
};

export const updateUser = async (userId, data) => {
  try {
    const { error } = await supabase
      .from("account") // ⚠️ 修改点 1: 你的表名叫 account
      .update({
        username: data.username,
        phonenumber: data.phoneNumber, // 前端是 phoneNumber -> 数据库是 phonenumber
        profileimage: data.profileImage, // 前端是 profileImage -> 数据库是 profileimage
        address: data.address,
        bio: data.bio,
      })
      .eq("accountid", userId); // ⚠️ 修改点 2: 你的主键叫 accountID

    if (error) {
      return { success: false, msg: error.message };
    }
    // Fixed: removed returning 'data' as it was undefined in this scope
    return { success: true };
  } catch (error) {
    console.log("updateUser error: ", error);
    return { success: false, msg: error.message };
  }
};

// ==============================
// Streak Logic Function
// ==============================

export const checkUserStreak = async (userId) => {
  try {
    // 1. Fetch current streak data directly from the 'account' table
    // We use accountid to find the user
    const { data: user, error } = await supabase
      .from("account")
      .select("last_login, streak_count")
      .eq("accountid", userId)
      .single();

    if (error) {
      console.log("Error fetching user streak data:", error.message);
      // If fetch fails, return current state (or 0) without breaking UI.
      return {
        success: false,
        streak: user?.streak_count || 0,
        msg: "Could not fetch streak data",
      };
    }

    // 2. Define time references for comparison (YYYY-MM-DD format for accurate day comparison)
    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    // Convert saved ISO timestamp to just the date part. Handle null for new users.
    const lastLoginDateStr = user.last_login
      ? moment(user.last_login).format("YYYY-MM-DD")
      : null;

    let newStreak = user.streak_count || 0;
    let shouldUpdate = false;

    // --- CORE LOGIC ---

    // CASE 1: First time login OR missed at least one day (Reset to 1)
    if (lastLoginDateStr !== today && lastLoginDateStr !== yesterday) {
      newStreak = 1;
      shouldUpdate = true;
    }
    // CASE 2: Logged in yesterday (Increment +1)
    else if (lastLoginDateStr === yesterday) {
      newStreak += 1;
      shouldUpdate = true;
    }
    // CASE 3: Already logged in today (Do nothing)

    // 3. Only update Database if status changed
    if (shouldUpdate) {
      const { error: updateError } = await supabase
        .from("account")
        .update({
          last_login: moment().toISOString(), // Save full timestamp
          streak_count: newStreak,
        })
        .eq("accountid", userId);

      if (updateError) {
        console.log("Streak Update Error:", updateError.message);
        // Return calculated streak even if DB update failed so UI looks right temporarily
        return {
          success: false,
          streak: newStreak,
          msg: "Failed to update streak in DB",
        };
      }
    }

    // Return success with the final number
    return { success: true, streak: newStreak };
  } catch (error) {
    console.log("checkUserStreak internal error: ", error);
    return { success: false, streak: 0, msg: error.message };
  }
};

// ==============================
// New Friend/Follow Logic
// ==============================

/**
 * Follow a user
 * @param {string} followerId - The ID of the user doing the following (You)
 * @param {string} followingId - The ID of the user being followed (Them)
 */
export const followUser = async (followerId, followingId) => {
  try {
    const { error } = await supabase
      .from("follower")
      .insert({ follower_id: followerId, following_id: followingId });

    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followerId, followingId) => {
  try {
    const { error } = await supabase
      .from("follower")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

/**
 * Check if I am already following this user
 */
export const getFollowStatus = async (followerId, followingId) => {
  try {
    const { data, error } = await supabase
      .from("follower")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "Row not found" (not an error really)
      return { success: false, isFollowing: false };
    }
    return { success: true, isFollowing: !!data }; // If data exists, true
  } catch (error) {
    return { success: false, isFollowing: false };
  }
};

/**
 * Get follower and following counts for a user
 */
export const getFollowCounts = async (userId) => {
  try {
    // Count who follows THIS user
    const { count: followersCount, error: e1 } = await supabase
      .from("follower")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    // Count who THIS user follows
    const { count: followingCount, error: e2 } = await supabase
      .from("follower")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (e1 || e2) return { success: false, msg: "Error fetching counts" };

    return {
      success: true,
      followers: followersCount,
      following: followingCount,
    };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};


//Find similar interest friends
export const getUsersWithSimilarInterests = async (currentUserId) => {
    try {
        // STEP 1: 获取我的兴趣 ID
        const { data: myInterests, error: interestError } = await supabase
            .from('user_interest')
            .select('interestid')
            .eq('userid', currentUserId);

        if (interestError) throw interestError;
        if (!myInterests || myInterests.length === 0) return { success: true, data: [] };

        const interestIds = myInterests.map(i => i.interestid);

        // 🔥 STEP 2: 获取我已经关注的人 (查 follower 表)
        // 逻辑：我是 follower，我要找出我正在 following 谁
        //const { data: followingList, error: followError } = await supabase
        //    .from('follower')
        //    .select('following_id') 
        //    .eq('follower_id', currentUserId);
        //if (followError) throw followError;


        // 创建一个排除名单 Set
        const excludeIds = new Set();
        excludeIds.add(currentUserId); // 排除我自己

        // 把我关注的人的 ID 都加进去
        //followingList.forEach(item => {
        //    excludeIds.add(item.following_id);
        //});

        // STEP 3: 寻找有相同兴趣的其他用户
        // (这部分逻辑不变，但现在排除了已关注的人)
        const { data: matches, error: matchError } = await supabase
            .from('user_interest')
            .select(`
                userid,
                interestid,
                user:userid (
                    accountid,
                    username,
                    profileimage,
                    bio,
                    address
                )
            `)
            .in('interestid', interestIds);

        if (matchError) throw matchError;

        // STEP 4: 去重和过滤
        const uniqueUsers = {};

        matches.forEach(match => {
            const user = match.user;
            
            // 如果用户不存在，或者已经在排除名单里(已关注)，就跳过
            if (!user || excludeIds.has(user.accountid)) return;

            if (!uniqueUsers[user.accountid]) {
                uniqueUsers[user.accountid] = {
                    ...user,
                    matchedInterests: [] 
                };
            }
            uniqueUsers[user.accountid].matchedInterests.push(match.interestid);
        });

        return { success: true, data: Object.values(uniqueUsers) };

    } catch (error) {
        console.log('getUsersWithSimilarInterests error: ', error);
        return { success: false, msg: error.message };
    }
}

// 🔥 新增这个辅助函数：获取我正在关注的所有人 ID
// 这样前端页面加载时，就可以知道谁已经是 "Following" 状态了
export const getUserFollowingList = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('follower')
            .select('following_id')
            .eq('follower_id', userId);
        
        if (error) throw error;
        
        // 返回一个纯 ID 数组: ['user_id_1', 'user_id_2']
        return { success: true, data: data.map(item => item.following_id) };
    } catch (error) {
        console.log('getUserFollowingList error:', error);
        return { success: false, msg: error.message };
    }
}

export const getUserInterests = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('user_interest')
            .select(`
                interest:interestid (interestname)
            `)
            .eq('userid', userId);

        if (error) {
            console.log('getUserInterests error:', error.message);
            return { success: false, data: [] };
        }

        // Transform data from [{interest: {interestname: 'Coding'}}] to ['Coding']
        const formattedInterests = data.map(item => item.interest?.interestname).filter(Boolean);
        
        return { success: true, data: formattedInterests };
    } catch (error) {
        console.log('getUserInterests error:', error);
        return { success: false, msg: error.message };
    }
}
