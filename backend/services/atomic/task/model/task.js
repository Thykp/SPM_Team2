const { supabase } = require("../db/supabase");
const taskTable = "task";

// Accepted outputs: "Ongoing", "Under Review", "Completed", "Overdue"
function normalizeStatus(input) {
  if (!input) return null;

  const s = String(input).trim().toLowerCase().replace(/[_-]+/g, " ");

  // order matters; check the most specific first
  if (/^under\s*review$/.test(s)) return "Under Review";
  if (/^(completed|done)$/.test(s)) return "Completed";
  if (/^(overdue)$/.test(s)) return "Overdue";
  if (/^(ongoing|in\s*progress|pending)$/.test(s)) return "Ongoing";

  // If it already matches, preserve original casing if provided,
  // otherwise capitalize nicely as a fallback.
  if (s === "ongoing") return "Ongoing";
  if (s === "under review") return "Under Review";
  if (s === "completed") return "Completed";
  if (s === "overdue") return "Overdue";

  // last resort: return the original input (lets Supabase error if invalid)
  return input;
}

// helper
async function getTasksByUsers(userIds = []) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  // Tasks where any of these users is the owner
  const { data: ownerTasks, error: ownerError } = await supabase
    .from(taskTable)
    .select("id, title, deadline, status, owner, collaborators")
    .in("owner", userIds)
    .order("deadline", { ascending: true });
  if (ownerError) throw new Error(ownerError.message);

  // Tasks where any of these users is a collaborator (array column)
  const { data: collabTasks, error: collabError } = await supabase
    .from(taskTable)
    .select("id, title, deadline, status, owner, collaborators")
    .overlaps("collaborators", userIds);
  if (collabError) throw new Error(collabError.message);

  // Merge + de-dupe by id, sort by deadline asc
  const all = [...(ownerTasks || []), ...(collabTasks || [])];
  const map = new Map(all.map((t) => [t.id, t]));
  return Array.from(map.values()).sort((a, b) =>
    String(a.deadline || "").localeCompare(String(b.deadline || ""))
  );
}

module.exports = {

    async getAllTasks() {
        const { data } = await supabase
            .from(taskTable)
            .select('*')

        console.log(data)
        return data;
    },

    async addNewTask(task) {
        const { data, error } = await supabase
          .from(taskTable)
          .insert([{
            title: task.title,
            deadline: task.deadline,
            description: task.description,
            status: normalizeStatus(task.status),
            collaborators: task.collaborators,
            owner: task.owner,
            parent: task.parent
          }])
          .select();
      
        if (error) {
          console.error("Error inserting task:", error);
          throw error;
        }
      
        console.log("Inserted task:", data);
        return data;
    },
    
    async getTasksPerUser(userId) {
      // Get tasks where user is owner
      const { data: ownerTasks, error: ownerError } = await supabase
        .from(taskTable)
        .select('*')
        .eq('owner', userId);
      if (ownerError) throw new Error(ownerError.message);

      // Get tasks where user is a collaborator
      const { data: collabTasks, error: collabError } = await supabase
        .from(taskTable)
        .select('*')
        .contains('collaborators', [userId]);
      if (collabError) throw new Error(collabError.message);

      const allTasks = [...ownerTasks, ...collabTasks];
      const uniqueTasks = Object.values(
        allTasks.reduce((acc, task) => {
          acc[task.id] = task;
          return acc;
        }, {})
      );
      return uniqueTasks;
    },

    async updateTask(taskId, updatedTask) {
        const { data, error } = await supabase
            .from(taskTable)
            .update({
                title: updatedTask.title,
                deadline: updatedTask.deadline,
                description: updatedTask.description,
                status: normalizeStatus(updatedTask.status),
                collaborators: updatedTask.collaborators,
                owner: updatedTask.owner,
                parent: updatedTask.parent
            })
            .eq('id', taskId); // Match the row where the id equals taskId

        if (error) {
            console.error("Error updating task:", error);
            throw error;
        }

        console.log("Updated task:", data);
        return data;
    },

    async getTaskById(taskId) {
        const { data, error } = await supabase
          .from(taskTable)
          .select("*")
          .eq("id", taskId)
          .single(); 

        if (error) {
          console.error("Error fetching task:", error);
          return null;
        }

        return data;
    },

    getTasksByUsers,

    async getSubTasksByParent(taskId){
        const { data, error } = await supabase
          .from(taskTable)
          .select("*")
          .eq("parent", taskId);

        if (error) {
          console.error("Error fetching task:", error);
          return null;
        }
        return data;
    }
}

