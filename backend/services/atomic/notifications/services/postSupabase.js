const { supabase } = require("../db/supabase");

async function postToSupabase(notification) {
  try {
    const {
      id,
      user_id, 
      title,
      description,
      link,
    } = notification;

    const record = {
      id,
      "to_user_id": user_id,
      title,
      description,
      link,
      read: false,
      user_set_read: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([record])
      .select();

    if (error) throw error;

    console.info(`[supabaseHelper] Inserted notification for user ${user_id}`);
    return data;
  } catch (err) {
    console.error('[supabaseHelper] Error inserting notification:', err.message);
  }
}

module.exports = { postToSupabase };
