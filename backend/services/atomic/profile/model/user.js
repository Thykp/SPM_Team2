const { supabase } = require("../db/supabase");

const profileTable = "revamped_profiles";
const deptTable = "revamped_departments";
const teamTable = "revamped_teams";

// Columns: id, display_name, role, department_id, team_id
// Sorted by display_name
async function getAllUsersDropdown() {
  const { data, error } = await supabase
    .from(profileTable)
    .select("id, display_name, role, department_id, team_id")
    .order("display_name", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

// Full list
// returns full profile rows (*) from revamped_profiles
async function getAllUsers() {
  const { data, error } = await supabase.from(profileTable).select("*");
  if (error) throw new Error(error.message);
  return data || [];
}

// Filter staff by team_id OR department_id (role defaults to "Staff")
// If both are provided, team_id takes precedence
async function getStaffByScope({ team_id, department_id, role = "Staff" }) {
  let q = supabase
    .from(profileTable)
    .select("id, display_name, role, team_id, department_id")
    .eq("role", role);

  if (team_id) {
    q = q.eq("team_id", team_id);
  } else if (department_id) {
    q = q.eq("department_id", department_id);
  }

  const { data, error } = await q.order("display_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

// Get user details by ID
async function getUserDetailsWithId(user_id) {
  const { data, error } = await supabase
  .from(profileTable)
  .select("*")
  .eq("id",user_id)

  if (error) throw new Error(error.message);
  return data || [];
}

module.exports = {
  getAllUsersDropdown,
  getAllUsers,
  getStaffByScope,
  getUserDetailsWithId,
};