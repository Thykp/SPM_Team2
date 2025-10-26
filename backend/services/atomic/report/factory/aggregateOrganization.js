const { fetchProfileDetails, fetchAllDepartments, fetchTasksForDepartment } = require('../services/callingService');
const { generateBar } = require('./makeCharts');
const { InternalError } = require('../model/AppError');

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
}

async function prepareOrganizationReportData(startDate, endDate) {
  try {
    console.log('=== Organization Report Debug ===');
    
    // Get all departments
    const allDepartments = await fetchAllDepartments();
    console.log('All Departments:', allDepartments);
    
    // Process each department
    const departments = [];
    let allTasksAccumulated = [];
    
    for (const dept of allDepartments) {
      const deptId = dept.id;
      
      // Fetch ALL members for this department (regardless of role)
      let memberIds = [];
      try {
        const profileAddress = process.env.PROFILE_PATH || "http://localhost:3030";
        const axios = require('axios').default;
        
        // Fetch all users and filter by this department
        const allUsersResp = await axios.get(`${profileAddress}/user/all`);
        const allUsers = allUsersResp.data || [];
        
        // Filter users belonging to this department
        const deptMembers = allUsers.filter(user => user.department_id === deptId);
        memberIds = deptMembers.map(user => user.id);
        
        console.log(`Department ${dept.name} (${deptId}) has ${memberIds.length} members`);
      } catch (err) {
        console.error(`Failed to fetch members for department ${deptId}:`, err.message);
      }
      
      // Fetch tasks for this department
      let deptTasks = [];
      // Skip if department has no members
      if (memberIds.length > 0) {
        try {
          deptTasks = await fetchTasksForDepartment(deptId, startDate, endDate);
        } catch (err) {
          // It's OK if a department has no tasks in this period
          console.log(`No tasks found for department ${deptId} (${dept.name}):`, err.message);
        }
      } else {
        console.log(`Skipping department ${deptId} (${dept.name}) - no members`);
      }
      
      // Calculate department KPIs
      const totalTasks = deptTasks.length;
      const completed = deptTasks.filter(t => t.status === 'Completed').length;
      const ongoing = deptTasks.filter(t => t.status === 'Ongoing').length;
      const underReview = deptTasks.filter(t => t.status === 'Under Review').length;
      const overdue = deptTasks.filter(t => t.status === 'Overdue').length;
      const highPriority = deptTasks.filter(t => (t.priority || 0) >= 7).length;
      const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
      const overduePercentage = totalTasks > 0 ? Math.round((overdue / totalTasks) * 100) : 0;
      
      // Get profile details for top contributors
      const profileIds = new Set();
      deptTasks.forEach(task => {
        const participants = task.participants || [];
        participants.forEach(p => profileIds.add(p.profile_id));
      });
      const profileDetails = await fetchProfileDetails(Array.from(profileIds));
      
      // Count tasks per person
      const taskCounts = {};
      deptTasks.forEach(task => {
        const participants = task.participants || [];
        participants.forEach(p => {
          const uid = p.profile_id;
          taskCounts[uid] = (taskCounts[uid] || 0) + 1;
        });
      });
      
      // Top 3 contributors
      const topContributors = Object.entries(taskCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([uid, count]) => ({
          name: profileDetails[uid]?.name || 'Unknown',
          taskCount: count
        }));
      
      // Get team count (approximate by assuming teams exist in department)
      let teamCount = 1; // Default fallback
      try {
        const profileAddress = process.env.PROFILE_PATH || "http://localhost:3030";
        const teamsResp = await require('axios').default.get(`${profileAddress}/user/teams`);
        const deptTeams = (teamsResp.data || []).filter(t => t.department_id === deptId);
        teamCount = deptTeams.length || 1;
      } catch (_) {}
      
      departments.push({
        id: deptId,
        name: dept.name || 'Department',
        description: dept.description || '',
        totalTasks,
        completed,
        ongoing,
        underReview,
        overdue,
        highPriority,
        completionRate,
        overduePercentage,
        employeeCount: memberIds.length,
        teamCount,
        topContributors,
        tasks: deptTasks
      });
      
      allTasksAccumulated = allTasksAccumulated.concat(deptTasks);
    }
    
    console.log('=== Task Deduplication Debug ===');
    console.log('Total tasks accumulated (before dedup):', allTasksAccumulated.length);
    console.log('Task IDs (before dedup):', allTasksAccumulated.map(t => t.id));
    
    // Remove duplicate tasks (same task across departments)
    const taskMap = new Map();
    allTasksAccumulated.forEach(task => {
      if (!taskMap.has(task.id)) {
        taskMap.set(task.id, task);
      } else {
        console.log(`Duplicate task found: ${task.id} (${task.title})`);
      }
    });
    const allTasks = Array.from(taskMap.values());
    
    console.log('Total unique tasks (after dedup):', allTasks.length);
    console.log('Unique task IDs:', allTasks.map(t => t.id));
    
    // Calculate organization-wide KPIs
    const orgKPIs = {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'Completed').length,
      ongoingTasks: allTasks.filter(t => t.status === 'Ongoing').length,
      overdueTasks: allTasks.filter(t => t.status === 'Overdue').length,
      underReviewTasks: allTasks.filter(t => t.status === 'Under Review').length,
      highPriorityTasks: allTasks.filter(t => (t.priority || 0) >= 7).length
    };
    
    orgKPIs.completionRate = orgKPIs.totalTasks > 0 
      ? Math.round((orgKPIs.completedTasks / orgKPIs.totalTasks) * 100) 
      : 0;
    
    orgKPIs.overduePercentage = orgKPIs.totalTasks > 0
      ? Math.round((orgKPIs.overdueTasks / orgKPIs.totalTasks) * 100)
      : 0;
    
    // Get total employees in organization (sum of all department members)
    // Note: This assumes employees don't belong to multiple departments
    const totalEmployees = departments.reduce((sum, dept) => sum + dept.employeeCount, 0);
    orgKPIs.activeEmployees = totalEmployees;
    orgKPIs.totalDepartments = departments.length;
    
    // Generate charts
    const statusBarChart = await generateBar(
      ['Completed', 'Ongoing', 'Under Review', 'Overdue'],
      [
        orgKPIs.completedTasks,
        orgKPIs.ongoingTasks,
        orgKPIs.underReviewTasks,
        orgKPIs.overdueTasks
      ]
    );
    
    // Department task distribution chart
    const deptNames = departments.map(d => d.name);
    const deptTaskCounts = departments.map(d => d.totalTasks);
    const departmentBarChart = deptTaskCounts.length > 0
      ? await generateBar(deptNames, deptTaskCounts)
      : null;
    
    // Get high priority tasks across organization
    const highPriorityTasksRaw = allTasks
      .filter(t => (t.priority || 0) >= 7)
      .slice(0, 10); // Top 10 high priority
    
    // Collect all unique profile IDs from high priority tasks
    const highPriorityUserIds = new Set();
    highPriorityTasksRaw.forEach(task => {
      const participants = task.participants || [];
      participants.forEach(p => highPriorityUserIds.add(p.profile_id));
    });
    
    // Fetch profile details for these users
    const highPriorityProfiles = await fetchProfileDetails(Array.from(highPriorityUserIds));
    
    // Map tasks with actual names
    const highPriorityTasks = highPriorityTasksRaw.map(task => {
      const participants = task.participants || [];
      
      // Get department name for this task
      let deptName = 'Unknown';
      for (const dept of departments) {
        if (dept.tasks.some(t => t.id === task.id)) {
          deptName = dept.name;
          break;
        }
      }
      
      // Map participant IDs to names
      const assigneeNames = participants
        .map(p => highPriorityProfiles[p.profile_id]?.name || 'Unknown')
        .join(', ');
      
      return {
        id: task.id,
        title: task.title,
        department: deptName,
        status: task.status,
        priority: task.priority || 0,
        deadline: formatDate(task.deadline),
        assignees: assigneeNames || 'Unassigned'
      };
    });
    
    // Generate insights
    const topPerformerDept = departments
      .sort((a, b) => b.completionRate - a.completionRate)[0];
    
    const needsAttention = departments
      .filter(d => d.completionRate < 60 || d.overduePercentage > 15)
      .map(d => d.name);
    
    const insights = {
      overallPerformance: `Organization achieved ${orgKPIs.completionRate}% completion rate. ${topPerformerDept?.name || 'Top department'} leading with ${topPerformerDept?.completionRate || 0}% completion rate.`,
      topPerformer: `${topPerformerDept?.name || 'Unknown'} department leads with ${topPerformerDept?.completionRate || 0}% completion rate and ${topPerformerDept?.overdue || 0} overdue tasks out of ${topPerformerDept?.totalTasks || 0} total tasks.`,
      attentionNeeded: needsAttention.length > 0 
        ? `${needsAttention.join(', ')} ${needsAttention.length === 1 ? 'department' : 'departments'} showing lower completion rates or higher overdue percentages. Consider resource reallocation or workload review.`
        : 'All departments performing well.',
      unassignedCount: 0 // This would need to be calculated based on your logic
    };
    
    console.log('Organization KPIs:', orgKPIs);
    console.log('Departments processed:', departments.length);
    
    return {
      reportPeriod: `${formatDate(startDate)} - ${formatDate(endDate)}`,
      orgKPIs,
      departments,
      highPriorityTasks,
      insights,
      charts: {
        statusBar: statusBarChart,
        departmentBar: departmentBarChart
      }
    };
    
  } catch (error) {
    console.error('Error preparing organization report:', error);
    throw new InternalError('prepare organization report data', error);
  }
}

module.exports = { prepareOrganizationReportData };

