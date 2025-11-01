// logic for routes in api/notificationRoutes
const { supabase } = require("../db/supabase");

// NOTIFICATIONS TABLE

async function getUserNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications_with_user")
    .select("*")
    .eq("to_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch notifications: ${JSON.stringify(error)}`);
  return data;
}

async function markAsRead(ids) {
  if (!Array.isArray(ids) || ids.length === 0)
    throw new Error("No notification IDs provided");

  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .in("id", ids)
    .select();

  if (error) throw new Error(`Failed to mark as read: ${JSON.stringify(error)}`);
  return data;
}

async function deleteAll(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("to_user_id", userId)
    .select();

  if (error) throw new Error("Failed to delete all");
  return data;
}

async function deleteOne(userId, notificationId) {
  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("to_user_id", userId)
    .eq("id", notificationId)
    .select();

  if (error) throw new Error("Failed to delete notification");
  if (!data.length) throw new Error("Notification not found");
  return data[0];
}

async function toggleRead(notifId) {
  if (!notifId) throw new Error("No notification ID provided");

  const { data: notif, error: fetchError } = await supabase
    .from("notifications")
    .select("user_set_read")
    .eq("id", notifId)
    .single();

  if (fetchError || !notif) throw new Error("Notification not found");

  const newValue = !notif.user_set_read;

  const { data, error: updateError } = await supabase
    .from("notifications")
    .update({ user_set_read: newValue })
    .eq("id", notifId)
    .select()
    .single();

  if (updateError) throw new Error("Failed to toggle read");

  return data;
}


module.exports = {
  getUserNotifications,
  markAsRead,
  deleteAll,
  deleteOne,
  toggleRead,
};
