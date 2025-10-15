const {getProjectDetails} = require("../services/taskService");
const { generateBar, generatePie } = require("./makeCharts");

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
      .map(task => task.project_id)
      .filter(id => id != null);
    const uniqueProjectIds = [...new Set(projectIdArr)];

    projectInfo = await getProjectDetails(uniqueProjectIds);


    const transformedTasks = taskList
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        deadline: formatDate(task.deadline),
        rawDeadline: task.deadline, // for sorting
        priority: task.priority,
        project_name: task.project_id != null ? projectInfo[task.project_id] : null,
        role: task.role
      }))
      .sort((a, b) => {
        const dateA = a.rawDeadline ? new Date(a.rawDeadline) : new Date(8640000000000000);
        const dateB = b.rawDeadline ? new Date(b.rawDeadline) : new Date(8640000000000000);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.priority - b.priority;
      });

    const taskKPIs = {
      totalTasks: transformedTasks.length,
      completedTasks: transformedTasks.filter((task)=>task.status == "Completed").length,
      underReviewTasks: transformedTasks.filter((task)=>task.status == "Under Review").length,
      ongoingTasks: transformedTasks.filter((task)=>task.status == "Ongoing").length,
      overdueTasks: transformedTasks.filter((task)=>task.status == "Overdue").length,
      highPriorityTasks: transformedTasks.filter(t => t.priority <= 3).length,
      mediumPriorityTasks: transformedTasks.filter(t => t.priority >= 4 && t.priority <= 7).length,
      lowPriorityTasks: transformedTasks.filter(t => t.priority >= 8 && t.priority <= 10).length
    }

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
    console.error("Something wrong with prepareReportData: ",error);
    throw error;
  }
};

module.exports = { prepareReportData };
