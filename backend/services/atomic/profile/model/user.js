const { supabase } = require("../db/supabase");
const profileTable = "profiles";
const teamTable = "teams";

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

async function getSubordinatesUnderManager(userId) {
  // Step 1: Fetch the manager's teams and validate the role
  const { data: managerData, error: managerError } = await supabase
    .from("profiles")
    .select("teams, role") // Fetch both teams and role
    .eq("id", userId)
    .single();

  if (managerError) {
    throw new Error(`Failed to fetch manager's details: ${managerError.message}`);
  }

  // Ensure the user is a manager
  if (managerData?.role !== "Manager") {
    throw new Error("The provided user ID does not belong to a manager.");
  }

  const managerTeams = managerData?.teams || [];

  // Step 2: Fetch subordinates whose teams overlap with the manager's teams
  const { data: subordinates, error: subordinatesError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("role", "Staff")
    .overlaps("teams", managerTeams);

  if (subordinatesError) {
    throw new Error(`Failed to fetch subordinates: ${subordinatesError.message}`);
  }

  return subordinates;
}

module.exports = {
  getAllUsersDropdown,
  getAllUsers,
  getStaffByDepartment,
  getUserDetailsById,
  getSubordinatesUnderManager,
};
