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
  getStaffByDepartment,
  getUserDetailsWithId
};
