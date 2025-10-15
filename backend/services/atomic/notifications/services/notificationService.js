// logic for routes in api/notificationRoutes

const { json } = require("express");
const { supabase } = require("../db/supabase");
const { publishNotification } = require("./redisPublisher");

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

  if (error) throw new Error(`Failed to mark as read: ${json.stringify(error)}`);
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

async function createNotification(notif) {
  if (!notif.to_user_id || !notif.notif_text || !notif.notif_type)
    throw new Error("Missing required notification fields");

  const payload = {
    notif_text: notif.notif_text,
    notif_type: notif.notif_type,
    from_user_id: notif.from_user_id || null,
    to_user_id: notif.to_user_id,
    resource_type: notif.resource_type || null,
    resource_id: notif.resource_id || null,
    project_id: notif.project_id || null,
    task_priority: notif.task_priority ?? 10, 
    read: false,
    user_set_read: false,
    link_url: notif.link_url || null,
  };

  const { data, error } = await supabase
    .from("notifications")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(`Failed to store notification: ${JSON.stringify(error)}`);

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
