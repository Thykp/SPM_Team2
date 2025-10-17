// logic for routes in api/notificationRoutes

const { supabase } = require("../db/supabase");

// NOTIFICATION_PREFERENCES TABLE

// Get delivery method preferences
async function getNotificationDeliveryPreferences(userId) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select('delivery_method')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data.delivery_method; // returns array ["in-app", "email"]
}

// Update delivery method preferences
async function updateNotificationDeliveryPreferences(userId, prefs) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .update({ delivery_method : prefs })
    .eq('user_id', userId)
    .select('delivery_method')
    .single();

  if (error) throw error;
  return data.delivery_method;
}

// Get frequency preferences
async function getNotificationFrequencyPreferences(userId){
  const { data , error} = await supabase
    .from("notification_preferences")
    .select('delivery_frequency, delivery_time, delivery_day')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function updateNotificationFrequencyPreferences(userId, prefs) {
  const updatePayload = {
    delivery_frequency: prefs.delivery_frequency,
    delivery_time: prefs.delivery_time || "1970-01-01T09:00:00+00:00",
    delivery_day: prefs.delivery_day || "Monday",
  };

  const { data, error } = await supabase
    .from("notification_preferences")
    .update(updatePayload)
    .eq("user_id", userId)
    .select("delivery_frequency, delivery_time, delivery_day")
    .single();

  if (error) throw error;

  return data;
}


module.exports = {
  getNotificationDeliveryPreferences,
  updateNotificationDeliveryPreferences,
  getNotificationFrequencyPreferences,
  updateNotificationFrequencyPreferences
}