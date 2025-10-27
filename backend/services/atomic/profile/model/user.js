const { supabase } = require("../db/supabase");

const PROFILE_TABLE = "revamped_profiles"; // Main table
const TEAM_TABLE = "revamped_teams";       // id, name, department_id
const DEPT_TABLE = "revamped_departments"; // id, name

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
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select(`
      id,
      display_name,
      role,
      team_id,
      department_id,
      department:${DEPT_TABLE}(name),
      team:${TEAM_TABLE}(name)
    `);

  if (error) throw new Error(error.message);

  // Flatten the nested objects for easier consumption
  const normalizedData = data.map((user) => ({
    ...user,
    department_name: user.department?.name || null,
    team_name: user.team?.name || null,
  }));

  return normalizedData || [];
}

// Filter: by team_id OR department_id (UUIDs), with role (default "Staff").
// If both are provided, team_id takes precedence.
async function getStaffByScope({ team_id, department_id, role = "Staff" }) {
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
    .from(PROFILE_TABLE)
    .select(`
      *,
      department:${DEPT_TABLE}(name),
      team:${TEAM_TABLE}(name)
    `)
    .eq("id", user_id)
    .single();

  if (error) throw new Error(error.message);

  if (!data) return [];

  // Flatten department and team objects
  const result = {
    ...data,
    department_name: data.department?.name || null,
    team_name: data.team?.name || null,
  };

  // Remove nested objects
  delete result.department;
  delete result.team;

  return result;
}

// Fetch users based on the current user's role, team_id, and department_id
async function getUsersByRoleScope({ role, team_id, department_id }) {
  console.log("getUsersByRoleScope called with:", { role, team_id, department_id });

  let query = supabase
    .from(PROFILE_TABLE)
    .select("id, display_name, role, team_id, department_id")
    .order("display_name", { ascending: true });

  if (role === "Manager") {
    if (team_id) {
      query = query.eq("team_id", team_id).eq("role", "Staff");
    } else {
      return []; 
    }
  } else if (role === "Director") {
    if (department_id) {
      query = query.eq("department_id", department_id).in("role", ["Manager", "Staff"]);
    } else {
      return [];
    }
  } else if (role === "Senior Management") {
    // No additional filters for Senior Management
  } else {
    // Default case: return an empty list for unsupported roles
    return [];
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}

// Fetch all teams (id, name, department_id)
async function getAllTeams() {
  const { data, error } = await supabase
    .from(TEAM_TABLE)
    .select("id, name, department_id")
    .order("name", { ascending: true }); // Sort teams alphabetically by name

  if (error) throw new Error(error.message);
  return data || [];
}

// Fetch all departments (id, name)
async function getAllDepartments() {
  const { data, error } = await supabase
    .from(DEPT_TABLE)
    .select("id, name")
    .order("name", { ascending: true }); // Sort departments alphabetically by name

  if (error) throw new Error(error.message);
  return data || [];
}

module.exports = {
  getAllUsersDropdown,
  getAllUsers,
  getStaffByScope,
  getUserDetailsWithId,
  getUsersByRoleScope,
  getAllTeams,
  getAllDepartments,
};
