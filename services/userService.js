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
// New Streak Logic Function
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
