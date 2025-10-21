const { supabase } = require("../db/supabase");


async function postToSupabase(notification) {
  try {
    const {
      to_user_ids,
      from_user_id,
      notif_type,
      resource_type,
      resource_id,
      project_id = "",
      task_priority = 1,
      notif_text,
      link_url = "",
    } = notification;

    const userArray = Array.isArray(to_user_ids) ? to_user_ids : [to_user_ids];

    const records = userArray.map((uid) => ({
      to_user_id: uid,
      from_user_id,
      notif_type,
      resource_type,
      resource_id,
      project_id,
      task_priority,
      notif_text,
      link_url,
      read: false,
      user_set_read: false,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(records)
      .select();

    if (error) throw error;

    console.info(`[supabaseHelper] Inserted ${records.length} notification(s)`);
    return data;
  } catch (err) {
    console.error('[supabaseHelper] Error inserting notification:', err.message);
  }
}

module.exports = { postToSupabase };