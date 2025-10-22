const { prepareDepartmentReportData } = require('../../../factory/aggregateDepartment');
const { fetchProfileDetails } = require('../../../services/callingService');
const { generateBar } = require('../../../factory/makeCharts');

jest.mock('../../../services/callingService');
jest.mock('../../../factory/makeCharts');

describe('aggregateDepartment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    generateBar.mockResolvedValue('data:image/png;base64,mockChart');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockDept = { id: 'dept-1', name: 'Engineering', head_id: 'head-1', members: ['a','b','c'] };
  const mockProfiles = {
    'head-1': { name: 'Head', email: 'head@x.com', dept: 'Engineering' },
    a: { name: 'Ann',  email: 'ann@x.com',  dept: 'Engineering' },
    b: { name: 'Ben',  email: 'ben@x.com',  dept: 'Engineering' },
    c: { name: 'Cara', email: 'cara@x.com', dept: 'Engineering' }
  };
  const mockTasks = [
    { id: 't1', title: 'Refactor', status: 'Completed', deadline: '2024-02-10T00:00:00Z', priority: 5, parent_task_id: null,
      participants: [{ profile_id: 'a', is_owner: true }] },
    { id: 't2', title: 'Deploy', status: 'Ongoing', deadline: '2024-02-14T00:00:00Z', priority: 6, parent_task_id: null,
      participants: [{ profile_id: 'b', is_owner: true }] },
    { id: 't3', title: 'Incident', status: 'Overdue', deadline: '2024-02-05T00:00:00Z', priority: 9, parent_task_id: null,
      participants: [{ profile_id: 'a', is_owner: false }, { profile_id: 'c', is_owner: true }] },
    { id: 'st1', title: 'Postmortem', status: 'Under Review', deadline: '2024-02-06T00:00:00Z', priority: 8, parent_task_id: 't3',
      participants: [{ profile_id: 'c', is_owner: true }] }
  ];

  test('prepares department report data with aliases', async () => {
    fetchProfileDetails.mockResolvedValue(mockProfiles);
    const out = await prepareDepartmentReportData(mockDept, mockTasks, '2024-02-01', '2024-02-29');

    expect(out.title).toBe('Engineering');
    expect(out.reportPeriod).toBe('2024-02-01 - 2024-02-29');
    expect(out.totalTasks).toBe(4);
    expect(out.members).toHaveLength(3);

    expect(out.projectTitle).toBe('Engineering');
    expect(out.projectKPIs.totalTasks).toBe(4);
    expect(out.collaborators).toHaveLength(3);
  });

  test('computes KPIs & charts', async () => {
    fetchProfileDetails.mockResolvedValue(mockProfiles);
    const out = await prepareDepartmentReportData(mockDept, mockTasks, '2024-02-01', '2024-02-29');

    expect(out.groupKPIs).toEqual({
      totalTasks: 4,
      totalMembers: 3,
      completedTasks: 1,
      ongoingTasks: 1,
      overdueTasks: 1,
      underReviewTasks: 1,
      completionRate: 25
    });
    expect(generateBar).toHaveBeenCalledTimes(2);
    expect(out.charts.statusBar).toBeTruthy();
    expect(out.charts.memberPerformance || out.charts.collaboratorPerformance).toBeTruthy();
  });

  test('structures tasks hierarchically', async () => {
    fetchProfileDetails.mockResolvedValue(mockProfiles);
    const out = await prepareDepartmentReportData(mockDept, mockTasks, '2024-02-01', '2024-02-29');

    const userC = out.members.find(m => m.id === 'c');
    const parent = userC.tasks.find(t => t.id === 't3');
    expect(parent).toBeDefined();
    expect(Array.isArray(parent.subtasks)).toBe(true);
  });

  test('handles no tasks', async () => {
    fetchProfileDetails.mockResolvedValue(mockProfiles);
    const out = await prepareDepartmentReportData(mockDept, [], '2024-02-01', '2024-02-29');
    expect(out.groupKPIs.totalTasks).toBe(0);
    expect(out.groupKPIs.completionRate).toBe(0);
    expect(out.totalTasks).toBe(0);
  });
});
