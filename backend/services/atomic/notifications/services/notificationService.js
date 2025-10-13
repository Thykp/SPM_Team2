// logic for routes in api/notificationRoutes

const { supabase } = require("../db/supabase");
const { publishNotification } = require("./redisPublisher");

async function getUserNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications_with_user")
    .select("*")
    .eq("to_user", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch notifications");
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

  if (error) throw new Error("Failed to mark as read");
  return data;
}

async function deleteAll(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("to_user", userId)
    .select();

  if (error) throw new Error("Failed to delete all");
  return data;
}

async function deleteOne(userId, notificationId) {
  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("to_user", userId)
    .eq("id", notificationId)
    .select();

  if (error) throw new Error("Failed to delete notification");
  if (!data.length) throw new Error("Notification not found");
  return data[0];
}

async function createNotification(notif) {
  if (!notif.to_user || !notif.notif_text || !notif.notif_type)
    throw new Error("Missing required notification fields");

  const payload = {
    notif_text: notif.notif_text,
    notif_type: notif.notif_type,
    from_user: notif.from_user || null,
    to_user: notif.to_user,
    resource_type: notif.resource_type || null,
    resource_id: notif.resource_id || null,
    project_id: notif.project_id || null,
    priority: notif.priority || 0,
    read: false,
  };

  const { data, error } = await supabase
    .from("notifications")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error("Failed to store notification");

  await publishNotification(data);
  return data;
}

// API call
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
  createNotification,
  toggleRead
};
