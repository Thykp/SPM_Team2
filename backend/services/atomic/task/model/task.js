const { supabase } = require("../db/supabase");

const TASK_TABLE = "revamped_task";                  // id, project_id, parent_task_id, title, deadline, description, status
const TP_TABLE = "revamped_task_participant";        // task_id, profile_id, is_owner

// Accepted outputs: "Ongoing", "Under Review", "Completed", "Overdue"
function normalizeStatus(input) {
  if (!input) return null;
  const s = String(input).trim().toLowerCase().replace(/[_-]+/g, " ");
  if (/^under\s*review$/.test(s)) return "Under Review";
  if (/^(completed|done)$/.test(s)) return "Completed";
  if (/^(overdue)$/.test(s)) return "Overdue";
  if (/^(ongoing|in\s*progress|pending)$/.test(s)) return "Ongoing";
  if (s === "ongoing") return "Ongoing";
  if (s === "under review") return "Under Review";
  if (s === "completed") return "Completed";
  if (s === "overdue") return "Overdue";
  return input; // let DB enforce the enum
}

// helpers
async function getTasksByUsers(userIds = []) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const { data, error } = await supabase
    .from(TP_TABLE)
    .select("profile_id, is_owner, task:revamped_task(id, title, deadline, status, project_id, parent_task_id)")
    .in("profile_id", userIds);
  if (error) throw new Error(error.message);

  const map = new Map();
  for (const row of data || []) {
    const t = row.task;
    if (t && !map.has(t.id)) map.set(t.id, t);
  }

  // sort by deadline ascending; nulls last
  return Array.from(map.values()).sort((a, b) => {
    const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
    const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });
}

async function getAllTasks() {
  const { data, error } = await supabase.from(TASK_TABLE).select("*");
  if (error) throw new Error(error.message);
  return data || [];
}

async function getTaskById(taskId) {
  const { data, error } = await supabase
    .from(TASK_TABLE)
    .select("*")
    .eq("id", taskId)
    .single();
  if (error) return null;
  return data;
}

async function getSubTasksByParent(taskId) {
  const { data, error } = await supabase
    .from(TASK_TABLE)
    .select("*")
    .eq("parent_task_id", taskId);
  if (error) return null;
  return data || [];
}

// Create task + participants
async function addNewTask(task) {
  const insertPayload = {
    title: task.title ?? null,
    deadline: task.deadline ?? null,
    description: task.description ?? null,
    status: normalizeStatus(task.status) ?? null,
    project_id: task.project_id ?? null,
    parent_task_id: task.parent_task_id ?? null,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from(TASK_TABLE)
    .insert([insertPayload])
    .select()
    .single();
  if (insertErr) {
    console.error("Error inserting task:", insertErr);
    throw insertErr;
  }

  const taskId = inserted.id;
  const ownerId = task.owner || null;
  const collabs = Array.isArray(task.collaborators) ? task.collaborators : [];
  const rows = [];
  const seen = new Set();

  if (ownerId) {
    seen.add(ownerId);
    rows.push({ task_id: taskId, profile_id: ownerId, is_owner: true });
  }
  for (const pid of collabs) {
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    rows.push({ task_id: taskId, profile_id: pid, is_owner: false });
  }

  if (rows.length > 0) {
    const { error: partErr } = await supabase.from(TP_TABLE).insert(rows);
    if (partErr) {
      console.error("Error inserting participants:", partErr);
      throw partErr;
    }
  }

  return inserted;
}

// Update task + (optional) replace participants
async function updateTask(taskId, updatedTask) {
  const up = {};
  if ("title" in updatedTask) up.title = updatedTask.title;
  if ("deadline" in updatedTask) up.deadline = updatedTask.deadline;
  if ("description" in updatedTask) up.description = updatedTask.description;
  if ("status" in updatedTask) up.status = normalizeStatus(updatedTask.status);
  if ("project_id" in updatedTask) up.project_id = updatedTask.project_id;
  if ("parent_task_id" in updatedTask) up.parent_task_id = updatedTask.parent_task_id;

  if (Object.keys(up).length > 0) {
    const { error: updErr } = await supabase.from(TASK_TABLE).update(up).eq("id", taskId);
    if (updErr) {
      console.error("Error updating task:", updErr);
      throw updErr;
    }
  }

  const hasOwner = Object.prototype.hasOwnProperty.call(updatedTask, "owner");
  const hasCollabs = Object.prototype.hasOwnProperty.call(updatedTask, "collaborators");

  if (hasOwner || hasCollabs) {
    const { error: delErr } = await supabase.from(TP_TABLE).delete().eq("task_id", taskId);
    if (delErr) {
      console.error("Error clearing participants:", delErr);
      throw delErr;
    }

    const ownerId = hasOwner ? updatedTask.owner : null;
    const collabs = hasCollabs && Array.isArray(updatedTask.collaborators) ? updatedTask.collaborators : [];
    const rows = [];
    const seen = new Set();

    if (ownerId) {
      seen.add(ownerId);
      rows.push({ task_id: taskId, profile_id: ownerId, is_owner: true });
    }
    for (const pid of collabs) {
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      rows.push({ task_id: taskId, profile_id: pid, is_owner: false });
    }

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from(TP_TABLE).insert(rows);
      if (insErr) {
        console.error("Error inserting participants:", insErr);
        throw insErr;
      }
    }
  }

  return await getTaskById(taskId);
}

async function getTasksPerUser(userId) {
  return getTasksByUsers([userId]);
}

module.exports = {
  getAllTasks,
  getTaskById,
  getSubTasksByParent,
  getTasksByUsers,
  getTasksPerUser,
  addNewTask,
  updateTask,
};
