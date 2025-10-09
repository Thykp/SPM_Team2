const { supabase } = require("../db/supabase");

const PROFILE_TABLE = "revamped_profiles";      // id, display_name, role, team_id, department_id
const DEPT_TABLE = "revamped_departments";      // id, name

// Minimal list of users for dropdowns.
async function getAllUsersDropdown() {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("id, display_name, role, team_id, department_id")
    .order("display_name", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

// Full list (revamped_profiles).
async function getAllUsers() {
  const { data, error } = await supabase.from(PROFILE_TABLE).select("*");
  if (error) throw new Error(error.message);
  return data || [];
}

// filter: by team_id OR department_id (UUIDs), with role (default "staff").
 // If both are provided, team_id takes precedence.
async function getStaffByScope({ team_id, department_id, role = "staff" }) {
  let q = supabase
    .from(PROFILE_TABLE)
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

// Single user by id.
async function getUserDetailsWithId(user_id) {
  const { data, error } = await supabase
  .from("revamped_profiles")
  .select(`
    *,
    department:revamped_departments(name),
    team:revamped_teams(name)
  `)
  .eq("id",user_id)
  .single();

  if (error) throw new Error(error.message);
  
  if (!data) return [];
  
  // Flatten department and team objects
  const result = {
    ...data,
    department_name: data.department?.name || null,
    team_name: data.team?.name || null
  };
  
  // Remove nested objects
  delete result.department;
  delete result.team;
  
  return result;
}

module.exports = {
  getAllUsersDropdown,
  getAllUsers,
  getStaffByScope,
  getUserDetailsWithId,
};
