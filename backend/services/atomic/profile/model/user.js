const { supabase } = require("../db/supabase");
const profileTable = "profiles";

// Get a list of users for dropdowns
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

module.exports = {
  getAllUsersDropdown,
  getAllUsers,
};
