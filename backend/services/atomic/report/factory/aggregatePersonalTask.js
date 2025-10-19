const {getProjectDetails} = require("../services/callingService");
const { generateBar, generatePie } = require("./makeCharts");
const { InternalError } = require("../model/AppError");

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
}

async function prepareReportData(taskList, startDate, endDate){
  // get list of project_ids
  // run function that will return list of project objects
  // map the tasks to the according project name
  // Calculate KPIs, total tasks, Under Review, Ongoing, Completed, Overdue
  // Format dates for display
  // Generate chart images

  try {
    const projectIdArr = taskList
      .map(task => task.projectId)
      .filter(id => id != null);
    
    const uniqueProjectIds = [...new Set(projectIdArr)];

    const projectInfo = await getProjectDetails(uniqueProjectIds);

    const transformedTasks = taskList
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        deadline: formatDate(task.deadline),
        rawDeadline: task.deadline, // for sorting
        priority: task.priority,
        projectName: task.projectId != null ? projectInfo[task.projectId] : null,
        role: task.role,
      }))
      .sort((a, b) => {
        const dateA = a.rawDeadline ? new Date(a.rawDeadline) : new Date(8640000000000000);
        const dateB = b.rawDeadline ? new Date(b.rawDeadline) : new Date(8640000000000000);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.priority - b.priority;
      });

    // Calculate KPIs in a single pass for better performance
    const taskKPIs = transformedTasks.reduce((acc, task) => {
      acc.totalTasks++;
      if (task.status === "Completed") acc.completedTasks++;
      if (task.status === "Under Review") acc.underReviewTasks++;
      if (task.status === "Ongoing") acc.ongoingTasks++;
      if (task.status === "Overdue") acc.overdueTasks++;
      
      if (task.priority <= 3) acc.highPriorityTasks++;
      else if (task.priority <= 7) acc.mediumPriorityTasks++;
      else acc.lowPriorityTasks++;
      
      return acc;
    }, {
      totalTasks: 0,
      completedTasks: 0,
      underReviewTasks: 0,
      ongoingTasks: 0,
      overdueTasks: 0,
      highPriorityTasks: 0,
      mediumPriorityTasks: 0,
      lowPriorityTasks: 0
    });

    // Format report period
    const reportPeriod = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    
    // Generate chart images as base64 data URIs
    const statusBarChart = await generateBar(
      ['Completed', 'Ongoing', 'Under Review', 'Overdue'],
      [taskKPIs.completedTasks, taskKPIs.ongoingTasks, taskKPIs.underReviewTasks, taskKPIs.overdueTasks]
    );

    const priorityPieChart = await generatePie(
      ['High (1-3)', 'Medium (4-7)', 'Low (8-10)'],
      [taskKPIs.highPriorityTasks, taskKPIs.mediumPriorityTasks, taskKPIs.lowPriorityTasks]
    );
    
    return {
      tasks: transformedTasks,
      kpis: taskKPIs,
      reportPeriod,
      charts: {
        statusBar: statusBarChart,
        priorityPie: priorityPieChart
      }
    }
  } catch (error) {
    throw new InternalError('prepare report data', error);
  }
};

module.exports = { prepareReportData };
