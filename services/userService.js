import moment from "moment";
import { supabase } from "../lib/supabase";

// ==============================
// Existing Profile Functions
// ==============================

export const getUserData = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("account")
      .select("*")
      .eq("accountid", userId) //
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

export const getFollowersList = async (userId) => {
  try {
    // Query the 'follower' table, but join with the 'account' table (aliased as user)
    // We want the details of the 'follower_id' (the person doing the following)
    const { data, error } = await supabase
      .from("follower")
      .select(
        `
                follower_id,
                user:follower_id (
                    accountid,
                    username,
                    profileimage,
                    bio
                )
            `,
      )
      .eq("following_id", userId);

    if (error) throw error;

    // Flatten: Extract the 'user' object from the result
    const formattedData = data.map((item) => item.user);
    return { success: true, data: formattedData };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

export const getFollowingList = async (userId) => {
  try {
    // Query the 'follower' table, but join with the 'account' table (aliased as user)
    // We want the details of the 'following_id' (the person being followed)
    const { data, error } = await supabase
      .from("follower")
      .select(
        `
                following_id,
                user:following_id (
                    accountid,
                    username,
                    profileimage,
                    bio
                )
            `,
      )
      .eq("follower_id", userId);

    if (error) throw error;

    // Flatten: Extract the 'user' object from the result
    const formattedData = data.map((item) => item.user);
    return { success: true, data: formattedData };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

//Find similar interest friends
export const getUsersWithSimilarInterests = async (currentUserId) => {
  try {
    // STEP 1: 获取我的兴趣 ID
    const { data: myInterests, error: interestError } = await supabase
      .from("user_interest")
      .select("interestid")
      .eq("userid", currentUserId);

    if (interestError) throw interestError;
    if (!myInterests || myInterests.length === 0)
      return { success: true, data: [] };

    const interestIds = myInterests.map((i) => i.interestid);

    const excludeIds = new Set();
    excludeIds.add(currentUserId);

    const { data: matches, error: matchError } = await supabase
      .from("user_interest")
      .select(
        `
                userid,
                interestid,
                user:userid (
                    accountid,
                    username,
                    profileimage,
                    bio,
                    address
                )
            `,
      )
      .in("interestid", interestIds);

    if (matchError) throw matchError;

    const uniqueUsers = {};

    matches.forEach((match) => {
      const user = match.user;

      if (!user || excludeIds.has(user.accountid)) return;

      if (!uniqueUsers[user.accountid]) {
        uniqueUsers[user.accountid] = {
          ...user,
          matchedInterests: [],
        };
      }
      uniqueUsers[user.accountid].matchedInterests.push(match.interestid);
    });

    return { success: true, data: Object.values(uniqueUsers) };
  } catch (error) {
    console.log("getUsersWithSimilarInterests error: ", error);
    return { success: false, msg: error.message };
  }
};

export const getUserFollowingList = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("follower")
      .select("following_id")
      .eq("follower_id", userId);

    if (error) throw error;

    return { success: true, data: data.map((item) => item.following_id) };
  } catch (error) {
    console.log("getUserFollowingList error:", error);
    return { success: false, msg: error.message };
  }
};

export const getUserInterests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("user_interest")
      .select(
        `
                interest:interestid (interestname)
            `,
      )
      .eq("userid", userId);

    if (error) {
      console.log("getUserInterests error:", error.message);
      return { success: false, data: [] };
    }

    const formattedInterests = data
      .map((item) => item.interest?.interestname)
      .filter(Boolean);

    return { success: true, data: formattedInterests };
  } catch (error) {
    console.log("getUserInterests error:", error);
    return { success: false, msg: error.message };
  }
};
// ==============================
// Mood Logic
// ==============================

// 1. Get the very latest mood for the Profile display
export const getLatestMood = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("mood")
      .select("currentmood, note, moodcreatedat")
      .eq("userid", userId)
      .order("moodcreatedat", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // It's okay if no data exists yet (Row not found)
      if (error.code === "PGRST116") return { success: true, data: null };
      return { success: false, msg: error.message };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// 2. Add a new mood entry
export const addMood = async (userId, moodName, note) => {
  try {
    const { error } = await supabase.from("mood").insert({
      userid: userId,
      currentmood: moodName,
      note: note,
    });

    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};
// 3. Get the full mood history (for the Timeline/History page)
export const getMoodHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("mood")
      .select("moodid, userid, currentmood, note, moodcreatedat")
      .eq("userid", userId)
      .order("moodcreatedat", { ascending: false });

    if (error) {
      console.error("Supabase Error:", error.message);
      return { success: false, msg: error.message };
    }
    return { success: true, data };
  } catch (error) {
    console.log("Error fetching moods:", error);
    return { success: false, msg: error.message };
  }
};
// ==============================
// Search & Explore
// ==============================

// 1. Search Users by Username
export const searchUsers = async (query) => {
  try {
    if (!query) return { success: true, data: [] };

    const { data, error } = await supabase
      .from("account")
      .select("accountid, username, profileimage")
      .ilike("username", `%${query}%`) // Case-insensitive search
      .limit(20);

    if (error) return { success: false, msg: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// 2. Get Users by Specific Interest (e.g. "Music")
export const getUsersByInterest = async (interestName) => {
  try {
    // A. Find the Interest ID first
    const { data: interestData, error: iError } = await supabase
      .from("interest")
      .select("interestid")
      .ilike("interestname", interestName)
      .single();

    if (iError || !interestData) return { success: true, data: [] };

    // B. Find Users with this Interest ID
    const { data: userInterests, error: uiError } = await supabase
      .from("user_interest")
      .select("userid")
      .eq("interestid", interestData.interestid);

    if (uiError) return { success: false, msg: uiError.message };

    if (userInterests.length === 0) return { success: true, data: [] };

    const userIds = userInterests.map((ui) => ui.userid);

    // C. Fetch User Details
    const { data: users, error: uError } = await supabase
      .from("account")
      .select("accountid, username, profileimage")
      .in("accountid", userIds);

    if (uError) return { success: false, msg: uError.message };

    return { success: true, data: users };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};
