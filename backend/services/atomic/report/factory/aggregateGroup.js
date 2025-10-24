const { fetchProfileDetails } = require("../services/callingService");
const { generateBar } = require("./makeCharts");
const { InternalError } = require("../model/AppError");

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  return d.toISOString().split('T')[0];
}

async function prepareGroupReportData({ membersIds, taskList, startDate, endDate, entityMeta }) {
  try {
    const profileDetails = await fetchProfileDetails(membersIds || []);

    // init per member
    const byMember = {};
    (membersIds || []).forEach(id => {
      byMember[id] = {
        profile: profileDetails[id] || { name: 'Unknown User', email: null, dept: null },
        tasks: [],
        kpis: { total: 0, completed: 0, ongoing: 0, underReview: 0, overdue: 0, highPriority: 0 }
      };
    });

    const unassignedTasks = [];

    (taskList || []).forEach(task => {
      const participants = task.participants || [];
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
        return;
      }

      participants.forEach(p => {
        const uid = p.profile_id;
        if (!byMember[uid]) return;
        const t = {
          id: task.id,
          title: task.title,
          status: task.status,
          deadline: formatDate(task.deadline),
          priority: task.priority,
          role: p.is_owner ? 'Owner' : 'Collaborator',
          isSubtask: !!task.parent_task_id,
          parent_task_id: task.parent_task_id
        };
        byMember[uid].tasks.push(t);

        const k = byMember[uid].kpis;
        k.total++;
        if (task.status === 'Completed') k.completed++;
        if (task.status === 'Ongoing') k.ongoing++;
        if (task.status === 'Under Review') k.underReview++;
        if (task.status === 'Overdue') k.overdue++;
        if ((task.priority || 0) >= 7) k.highPriority++;
      });
    });

    // nest subtasks under parents per member
    Object.keys(byMember).forEach(uid => {
      const flat = byMember[uid].tasks;
      const map = {};
      const parents = [];
      flat.forEach(t => { map[t.id] = { ...t, subtasks: [] }; });
      flat.forEach(t => {
        if (t.parent_task_id && map[t.parent_task_id]) {
          map[t.parent_task_id].subtasks.push(map[t.id]);
        } else if (!t.parent_task_id) {
          parents.push(map[t.id]);
        }
      });
      byMember[uid].tasks = parents;
    });

    // KPIs
    const groupKPIs = {
      totalTasks: (taskList || []).length,
      totalMembers: (membersIds || []).length,
      completedTasks: (taskList || []).filter(t => t.status === 'Completed').length,
      ongoingTasks: (taskList || []).filter(t => t.status === 'Ongoing').length,
      overdueTasks: (taskList || []).filter(t => t.status === 'Overdue').length,
      underReviewTasks: (taskList || []).filter(t => t.status === 'Under Review').length
    };
    groupKPIs.completionRate = groupKPIs.totalTasks > 0
      ? Math.round((groupKPIs.completedTasks / groupKPIs.totalTasks) * 100)
      : 0;

    // Charts
    const statusBarChart = await generateBar(
      ['Completed', 'Ongoing', 'Under Review', 'Overdue'],
      [
        groupKPIs.completedTasks,
        groupKPIs.ongoingTasks,
        groupKPIs.underReviewTasks,
        groupKPIs.overdueTasks
      ]
    );

    const top = Object.entries(byMember)
      .sort((a, b) => b[1].kpis.total - a[1].kpis.total)
      .slice(0, 5);
    const names = top.map(([, d]) => d.profile.name);
    const counts = top.map(([, d]) => d.kpis.total);
    const memberChart = counts.length ? await generateBar(names, counts) : null;

    return {
      title: entityMeta.title,
      description: entityMeta.description || '',
      ownerId: entityMeta.ownerId,
      ownerLabel: entityMeta.ownerFallbackLabel || 'Owner',
      reportPeriod: `${formatDate(startDate)} - ${formatDate(endDate)}`,
      groupKPIs,
      members: Object.entries(byMember).map(([id, data]) => ({ id, ...data })),
      unassignedTasks,
      charts: { statusBar: statusBarChart, memberPerformance: memberChart },
      totalTasks: (taskList || []).length,

      // Aliases so projectReport.njk works unchanged:
      projectKPIs: groupKPIs,
      collaborators: Object.entries(byMember).map(([id, data]) => ({ id, ...data })),
      projectTitle: entityMeta.title,
      projectDescription: entityMeta.description || ''
    };
  } catch (e) {
    throw new InternalError('prepare group report data', e);
  }
}

module.exports = { prepareGroupReportData };
