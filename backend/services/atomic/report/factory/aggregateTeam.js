const { prepareGroupReportData } = require('./aggregateGroup');

async function prepareTeamReportData(teamData, taskList, startDate, endDate) {
  const members = teamData.members || [];
  return prepareGroupReportData({
    membersIds: members,
    taskList,
    startDate,
    endDate,
    entityMeta: {
      title: teamData.name || 'Team',
      description: teamData.department_id ? `Department: ${teamData.department_id}` : '',
      ownerId: teamData.lead_id || teamData.manager_id,
      ownerFallbackLabel: 'Team Lead'
    }
  });
}

module.exports = { prepareTeamReportData };
