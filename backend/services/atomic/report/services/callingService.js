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

module.exports = {
  fetchTasksForUser, 
  getProjectDetails,
  fetchProjectWithCollaborators,
  fetchTasksForProject,
  fetchProfileDetails
};