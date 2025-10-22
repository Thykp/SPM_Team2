const { prepareGroupReportData } = require('./aggregateGroup');

async function prepareDepartmentReportData(deptData, taskList, startDate, endDate) {
  const members = deptData.members || [];
  return prepareGroupReportData({
    membersIds: members,
    taskList,
    startDate,
    endDate,
    entityMeta: {
      title: deptData.name || 'Department',
      description: '',
      ownerId: deptData.head_id,
      ownerFallbackLabel: 'Department Head'
    }
  });
}

module.exports = { prepareDepartmentReportData };
