const { fetchProfileDetails } = require("../services/callingService");
const { generateBar } = require("./makeCharts");
const { InternalError } = require("../model/AppError");

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
}

async function prepareProjectReportData(projectData, taskList, startDate, endDate) {
  try {
    console.log('=== Project Report Debug ===');
    console.log('Project Data:', JSON.stringify(projectData, null, 2));
    console.log('Task List Length:', taskList.length);
    console.log('First Task:', taskList[0]);
    console.log('Sample tasks with participants:', taskList.slice(0, 5).map(t => ({
      title: t.title,
      participantCount: t.participants?.length || 0,
      participants: t.participants
    })));
    
    // Get all unique collaborator IDs
    const collaboratorIds = projectData.collaborators || [];
    console.log('Collaborator IDs:', collaboratorIds);
    
    const profileDetails = await fetchProfileDetails(collaboratorIds);
    console.log('Profile Details:', JSON.stringify(profileDetails, null, 2));
    
    // Initialize structure for each collaborator
    const tasksByCollaborator = {};
    collaboratorIds.forEach(id => {
      tasksByCollaborator[id] = {
        profile: profileDetails[id],
        tasks: [],
        kpis: {
          total: 0,
          completed: 0,
          ongoing: 0,
          underReview: 0,
          overdue: 0,
          highPriority: 0
        }
      };
    });
    
    // Track unassigned tasks (tasks with no participants)
    const unassignedTasks = [];
    
    // Categorize tasks by collaborator
    taskList.forEach(task => {
      const participants = task.participants || [];
      
      // If task has no participants, add to unassigned
      if (participants.length === 0) {
        unassignedTasks.push({
          id: task.id,
          title: task.title,
          status: task.status,
          deadline: formatDate(task.deadline),
          priority: task.priority,
          isSubtask: !!task.parent_task_id,
          parent_task_id: task.parent_task_id
        });
      } else {
        // Task has participants, distribute to collaborators
        participants.forEach(participant => {
          const userId = participant.profile_id;
          if (tasksByCollaborator[userId]) {
            const formattedTask = {
              id: task.id,
              title: task.title,
              status: task.status,
              deadline: formatDate(task.deadline),
              priority: task.priority,
              role: participant.is_owner ? 'Owner' : 'Collaborator',
              isSubtask: !!task.parent_task_id,
              parent_task_id: task.parent_task_id
            };
            
            tasksByCollaborator[userId].tasks.push(formattedTask);
            
            // Update KPIs
            const kpi = tasksByCollaborator[userId].kpis;
            kpi.total++;
            if (task.status === 'Completed') kpi.completed++;
            if (task.status === 'Ongoing') kpi.ongoing++;
            if (task.status === 'Under Review') kpi.underReview++;
            if (task.status === 'Overdue') kpi.overdue++;
            if (task.priority >= 7) kpi.highPriority++;
          }
        });
      }
    });
    
    // Organize tasks hierarchically (parent tasks with nested subtasks)
    Object.keys(tasksByCollaborator).forEach(userId => {
      const tasks = tasksByCollaborator[userId].tasks;
      const taskMap = {};
      const parentTasks = [];
      
      // Create a map of all tasks by ID
      tasks.forEach(task => {
        taskMap[task.id] = { ...task, subtasks: [] };
      });
      
      // Organize into hierarchy
      tasks.forEach(task => {
        if (task.parent_task_id && taskMap[task.parent_task_id]) {
          // This is a subtask, add it to parent's subtasks array
          taskMap[task.parent_task_id].subtasks.push(taskMap[task.id]);
        } else if (!task.parent_task_id) {
          // This is a parent task
          parentTasks.push(taskMap[task.id]);
        }
      });
      
      // Replace flat task list with hierarchical structure
      tasksByCollaborator[userId].tasks = parentTasks;
    });
    
    console.log('=== Unassigned Tasks Debug ===');
    console.log('Total unassigned tasks:', unassignedTasks.length);
    console.log('Unassigned task titles:', unassignedTasks.map(t => t.title));
    
    console.log('=== Collaborator Task Distribution ===');
    Object.entries(tasksByCollaborator).forEach(([id, data]) => {
      console.log(`${data.profile.name}: ${data.tasks.length} tasks`);
      console.log('  KPIs:', data.kpis);
    });
    
    // Calculate project-level KPIs
    const projectKPIs = {
      totalTasks: taskList.length,
      totalCollaborators: collaboratorIds.length,
      completedTasks: taskList.filter(t => t.status === 'Completed').length,
      ongoingTasks: taskList.filter(t => t.status === 'Ongoing').length,
      overdueTasks: taskList.filter(t => t.status === 'Overdue').length,
      underReviewTasks: taskList.filter(t => t.status === 'Under Review').length
    };
    
    // Calculate completion percentage
    projectKPIs.completionRate = projectKPIs.totalTasks > 0
      ? Math.round((projectKPIs.completedTasks / projectKPIs.totalTasks) * 100)
      : 0;
    
    // Generate charts
    const statusBarChart = await generateBar(
      ['Completed', 'Ongoing', 'Under Review', 'Overdue'],
      [
        projectKPIs.completedTasks,
        projectKPIs.ongoingTasks,
        projectKPIs.underReviewTasks,
        projectKPIs.overdueTasks
      ]
    );
    
    // Collaborator performance chart (top 5 most active)
    const sortedCollabs = Object.entries(tasksByCollaborator)
      .sort((a, b) => b[1].kpis.total - a[1].kpis.total)
      .slice(0, 5);
    
    const collabNames = sortedCollabs.map(([, data]) => data.profile.name);
    const collabTaskCounts = sortedCollabs.map(([, data]) => data.kpis.total);
    
    const collaboratorChart = collabTaskCounts.length > 0 
      ? await generateBar(collabNames, collabTaskCounts)
      : null;
    
    return {
      projectTitle: projectData.title,
      projectDescription: projectData.description,
      owner: profileDetails[projectData.owner] || { name: 'Unknown Owner', email: null, dept: null },
      reportPeriod: `${formatDate(startDate)} - ${formatDate(endDate)}`,
      projectKPIs,
      collaborators: Object.entries(tasksByCollaborator).map(([id, data]) => ({
        id,
        ...data
      })),
      unassignedTasks,
      charts: {
        statusBar: statusBarChart,
        collaboratorPerformance: collaboratorChart
      },
      totalTasks: taskList.length
    };
    
  } catch (error) {
    throw new InternalError('prepare project report data', error);
  }
}

module.exports = { prepareProjectReportData };
