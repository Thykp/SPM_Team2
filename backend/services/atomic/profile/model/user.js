const { supabase } = require("../db/supabase");
const profileTable = "profiles";

async function getAllUsersDropdown() {
  const { data, error } = await supabase
    .from(profileTable)
    .select("id, display_name, role, department")
    .order("display_name", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

async function getAllUsers() {
  const { data, error } = await supabase
    .from(profileTable)
    .select("*");

  if (error) throw new Error(error.message);
  return data || [];
}

async function getStaffByDepartment(department, role = "staff") {
  let query = supabase
    .from(profileTable)
    .select("id, display_name, role, department")
    .eq("role", role);

  if (department) {
    query = query.eq("department", department);
  }

  const { data, error } = await query.order("display_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function getUserDetailsWithId(user_id){
  const { data, error } = await supabase
  .from(profileTable)
  .select("*")
  .eq("id",user_id);

  if (error) throw new Error(error.message);
  return data || [];
}

// Get notification preferences
async function getNotificationPreferences(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('notification_delivery')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data.notification_delivery;
}

// Update notification preferences
async function updateNotificationPreferences(userId, prefs) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ notification_delivery: prefs })
    .eq('id', userId)
    .select('notification_delivery')
    .single();

  if (error) throw error;
  return data.notification_delivery;
}


module.exports = {
  getAllUsersDropdown,
  getAllUsers,
  getStaffByDepartment,
  getUserDetailsWithId,
  updateNotificationPreferences,
  getNotificationPreferences
};
