const axios = require('axios');
const { ServiceUnavailableError, NotFoundError } = require('../model/AppError');

const taskAddress = process.env.TASK_PATH || "http://localhost:3031";
const projectAddress = process.env.PROJECT_PATH || "http://localhost:3040";
const profileAddress = process.env.PROFILE_PATH || "http://localhost:3030";


function roleForUser(task, userId) {
  const owners = task.participants.filter(p => p.is_owner).map(p => p.profile_id);
  const collabs = task.participants.filter(p => !p.is_owner).map(p => p.profile_id);
  const isOwner = owners.includes(userId);
  const isCollab = collabs.includes(userId);
  if (isOwner) return "Owner";
  if (isCollab) return "Collaborator";
}

async function fetchTasksForUser(userId, startDate, endDate) {
  const taskList = [];

  try {
    const response = await axios.get(`${taskAddress}/task/users/${userId}?startDate=${startDate}&endDate=${endDate}`);
    const foundTasks = response.data;
    
    if (!foundTasks || foundTasks.length === 0) {
      throw new NotFoundError('No tasks found for the specified user and date range', {
        userId,
        startDate,
        endDate
      });
    }
    
    for (const t of foundTasks) {
      const role = roleForUser(t, userId);
      const normalized = {
        id: t.id,
        title: t.title,
        status: t.status,
        role: role,
        deadline: t.deadline,
        priority: t.priority,
        projectId: t.project_id,
        parent_task_id: t.parent_task_id,
        updatedAt: t.updated_at
      };
      taskList.push(normalized);
    }
    return taskList;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new ServiceUnavailableError('Task Service', error);
  }
}

async function getProjectDetails(projectIds){
  const projectDetails = {};
  for (const projectId of projectIds) {
    try {
      const response = await axios.get(`${projectAddress}/project/${projectId}`);
      projectDetails[projectId] = response.data.title;
    } catch (error) {
      projectDetails[projectId] = "Unknown Project";
    }
  }
  
  return projectDetails;
}

// Fetch project with collaborators
async function fetchProjectWithCollaborators(projectId) {
  try {
    const response = await axios.get(`${projectAddress}/project/${projectId}`);
    return response.data;
  } catch (error) {
    throw new ServiceUnavailableError('Project Service', error);
  }
}

// Fetch all tasks for a project
async function fetchTasksForProject(projectId, startDate, endDate) {
  try {
    const response = await axios.get(
      `${taskAddress}/task/project/${projectId}?startDate=${startDate}&endDate=${endDate}`
    );
    
    if (!response.data || response.data.length === 0) {
      throw new NotFoundError('No tasks found for the specified project and date range', {
        projectId,
        startDate,
        endDate
      });
    }
    
    return response.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new ServiceUnavailableError('Task Service', error);
  }
}

// Fetch profile details for collaborators
async function fetchProfileDetails(profileIds) {
  const profiles = {};
  
  for (const profileId of profileIds) {
    try {
      const response = await axios.get(`${profileAddress}/user/${profileId}`);
      profiles[profileId] = {
        name: response.data.display_name || response.data.name || 'Unknown User',
        email: response.data.email || null,
        dept: response.data.department_name || response.data.dept || null
      };
    } catch (error) {
      console.error(`Failed to fetch profile for ${profileId}:`, error.message);
      profiles[profileId] = { 
        name: 'Unknown User', 
        email: null, 
        dept: null 
      };
    }
  }
  
  return profiles;
}

function mergeTaskListsById(taskLists) {
  const byId = new Map();

  for (const list of taskLists) {
    for (const t of list) {
      const participants = Array.isArray(t.participants) ? t.participants : [];
      if (!byId.has(t.id)) {
        byId.set(t.id, { ...t, participants: [...participants] });
      } else {
        const existing = byId.get(t.id);
        // merge participants (dedupe by profile_id + is_owner)
        const merged = new Map();
        for (const p of existing.participants) merged.set(`${p.profile_id}:${p.is_owner ? 1 : 0}`, p);
        for (const p of participants) merged.set(`${p.profile_id}:${p.is_owner ? 1 : 0}`, p);
        existing.participants = Array.from(merged.values());
        byId.set(t.id, existing);
      }
    }
  }

  return Array.from(byId.values());
}

async function fetchTeamWithMembers(teamId) {
  try {
    // members
    const staffResp = await axios.get(`${profileAddress}/user/staff`, {
      params: { team_id: teamId, role: 'Staff' }
    });
    const members = (staffResp.data || []).map(r => r.id);
    if (!members.length) throw new NotFoundError('No members found for team', { teamId });

    // name (+ department_id) from /teams
    let name = 'Team';
    let department_id = null;
    try {
      const teamsResp = await axios.get(`${profileAddress}/user/teams`);
      const hit = (teamsResp.data || []).find(t => t.id === teamId);
      if (hit) {
        name = hit.name || name;
        if (hit.department_id) department_id = hit.department_id;
      }
    } catch (_) {  }

    return { id: teamId, name, members, department_id };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new ServiceUnavailableError('Profile Service (team)', error);
  }
}

// Department metadata + members
async function fetchDepartmentWithMembers(departmentId) {
  try {
    // Fetch all users and filter by department (no role filter)
    const allUsersResp = await axios.get(`${profileAddress}/user/all`);
    const allUsers = allUsersResp.data || [];
    
    // Filter users belonging to this department (all roles)
    const deptMembers = allUsers.filter(user => user.department_id === departmentId);
    const members = deptMembers.map(user => user.id);
    
    if (!members.length) throw new NotFoundError('No members found for department', { departmentId });

    // name from /departments
    let name = 'Department';
    try {
      const deptResp = await axios.get(`${profileAddress}/user/departments`);
      const hit = (deptResp.data || []).find(d => d.id === departmentId);
      if (hit?.name) name = hit.name;
    } catch (_) { }

    return { id: departmentId, name, members };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new ServiceUnavailableError('Profile Service (department)', error);
  }
}

// Aggregate tasks for a whole team (fan-out by members)
async function fetchTasksForTeam(teamId, startDate, endDate) {
  try {
    const { members } = await fetchTeamWithMembers(teamId);
    const perUser = await Promise.all(members.map(async (uid) => {
      try {
        const r = await axios.get(`${taskAddress}/task/users/${uid}`, {
          params: { startDate, endDate }
        });
        return r.data || [];
      } catch (e) {
        console.error(`fetchTasksForTeam: failed for user ${uid}:`, e.message);
        return [];
      }
    }));
    const merged = mergeTaskListsById(perUser);
    if (!merged.length) {
      throw new NotFoundError('No tasks found for team in date range', { teamId, startDate, endDate });
    }
    return merged;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new ServiceUnavailableError('Task Service (team aggregate)', error);
  }
}

// Aggregate tasks for a whole department (fan-out by members)
async function fetchTasksForDepartment(departmentId, startDate, endDate) {
  try {
    const { members } = await fetchDepartmentWithMembers(departmentId);
    const perUser = await Promise.all(members.map(async (uid) => {
      try {
        const r = await axios.get(`${taskAddress}/task/users/${uid}`, {
          params: { startDate, endDate }
        });
        return r.data || [];
      } catch (e) {
        console.error(`fetchTasksForDepartment: failed for user ${uid}:`, e.message);
        return [];
      }
    }));
    const merged = mergeTaskListsById(perUser);
    if (!merged.length) {
      throw new NotFoundError('No tasks found for department in date range', { departmentId, startDate, endDate });
    }
    return merged;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new ServiceUnavailableError('Task Service (department aggregate)', error);
  }
}

// Fetch all departments
async function fetchAllDepartments() {
  try {
    const response = await axios.get(`${profileAddress}/user/departments`);
    return response.data || [];
  } catch (error) {
    throw new ServiceUnavailableError('Profile Service (all departments)', error);
  }
}

// Fetch organization-wide tasks (all users)
async function fetchAllUsers() {
  try {
    const response = await axios.get(`${profileAddress}/user/all`);
    return response.data || [];
  } catch (error) {
    throw new ServiceUnavailableError('Profile Service (all users)', error);
  }
}

// Aggregate tasks for the entire organization (all departments)
async function fetchTasksForOrganization(startDate, endDate) {
  try {
    // Get all users in the organization
    const allUsers = await fetchAllUsers();
    const allUserIds = allUsers.map(u => u.id);
    
    if (!allUserIds.length) {
      throw new NotFoundError('No users found in organization', { startDate, endDate });
    }

    // Fetch tasks for all users
    const perUser = await Promise.all(allUserIds.map(async (uid) => {
      try {
        const r = await axios.get(`${taskAddress}/task/users/${uid}`, {
          params: { startDate, endDate }
        });
        return r.data || [];
      } catch (e) {
        console.error(`fetchTasksForOrganization: failed for user ${uid}:`, e.message);
        return [];
      }
    }));
    
    const merged = mergeTaskListsById(perUser);
    
    if (!merged.length) {
      throw new NotFoundError('No tasks found for organization in date range', { startDate, endDate });
    }
    
    return merged;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new ServiceUnavailableError('Task Service (organization aggregate)', error);
  }
}


module.exports = {
  fetchTasksForUser, 
  getProjectDetails,
  fetchProjectWithCollaborators,
  fetchTasksForProject,
  fetchProfileDetails,
  fetchTeamWithMembers,
  fetchTasksForTeam,
  fetchDepartmentWithMembers,
  fetchTasksForDepartment,
  fetchAllDepartments,
  fetchAllUsers,
  fetchTasksForOrganization
};