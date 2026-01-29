import { supabase } from "../lib/supabase";

// Existing history function...
export const getMoodHistory = async (userId) => {
  // ... (Keep your existing code here)
};

// --- NEW FUNCTIONS ---

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

// 2. Add a new mood entry (This builds the history for counselors)
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
