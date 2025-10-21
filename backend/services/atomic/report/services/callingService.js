const axios = require('axios');
const { ServiceUnavailableError, NotFoundError } = require('../model/AppError');

const taskAddress = process.env.TASK_PATH || "http://localhost:3031";
const projectAddress = process.env.PROJECT_PATH || "http://localhost:3040";


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

module.exports = {fetchTasksForUser, getProjectDetails};