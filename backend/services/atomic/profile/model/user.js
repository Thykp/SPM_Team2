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

// Fetch user details by ID
async function getUserDetailsById(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, department")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user details: ${error.message}`);
  }

  return data;
}

module.exports = {
  getAllUsersDropdown,
  getAllUsers,
  getStaffByDepartment,
  getUserDetailsById,
};
