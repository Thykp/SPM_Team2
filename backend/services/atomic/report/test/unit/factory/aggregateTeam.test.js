const { prepareTeamReportData } = require('../../../factory/aggregateTeam');
const { fetchProfileDetails } = require('../../../services/callingService');
const { generateBar } = require('../../../factory/makeCharts');

jest.mock('../../../services/callingService');
jest.mock('../../../factory/makeCharts');

describe('aggregateTeam', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    generateBar.mockResolvedValue('data:image/png;base64,mockChart');
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  const mockTeam = { id: 'team-1', name: 'Alpha', department_id: 'dept-9', members: ['u1', 'u2'] };
  const mockProfiles = {
    u1: { name: 'Alice', email: 'alice@x.com', dept: 'Eng' },
    u2: { name: 'Bob',   email: 'bob@x.com',   dept: 'Eng' }
  };
  const mockTasks = [
    {
      id: 't1', title: 'Parent', status: 'Completed', deadline: '2024-01-10T00:00:00Z',
      priority: 5, parent_task_id: null,
      participants: [{ profile_id: 'u1', is_owner: true }, { profile_id: 'u2', is_owner: false }]
    },
    {
      id: 't2', title: 'Ongoing', status: 'Ongoing', deadline: '2024-01-20T00:00:00Z',
      priority: 4, parent_task_id: null,
      participants: [{ profile_id: 'u2', is_owner: true }]
    },
    {
      id: 'st1', title: 'Sub', status: 'Under Review', deadline: '2024-01-08T00:00:00Z',
      priority: 8, parent_task_id: 't1',
      participants: [{ profile_id: 'u2', is_owner: true }]
    },
    {
      id: 't3', title: 'Late', status: 'Overdue', deadline: '2024-01-05T00:00:00Z',
      priority: 9, parent_task_id: null,
      participants: [{ profile_id: 'u1', is_owner: false }, { profile_id: 'u2', is_owner: true }]
    }
  ];

  test('prepares team report data with aliases', async () => {
    fetchProfileDetails.mockResolvedValue(mockProfiles);

    const out = await prepareTeamReportData(mockTeam, mockTasks, '2024-01-01', '2024-01-31');

    expect(out.title).toBe('Alpha');
    expect(out.reportPeriod).toBe('2024-01-01 - 2024-01-31');
    expect(out.totalTasks).toBe(4);
    expect(out.members).toHaveLength(2);

    // aliases so project template works
    expect(out.projectTitle).toBe('Alpha');
    expect(out.projectKPIs.totalTasks).toBe(4);
    expect(out.collaborators).toHaveLength(2);
  });

  test('computes KPIs & charts', async () => {
    fetchProfileDetails.mockResolvedValue(mockProfiles);
    const out = await prepareTeamReportData(mockTeam, mockTasks, '2024-01-01', '2024-01-31');

    expect(out.groupKPIs).toEqual({
      totalTasks: 4,
      totalMembers: 2,
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

  test('structures tasks hierarchically and formats dates', async () => {
    fetchProfileDetails.mockResolvedValue(mockProfiles);
    const out = await prepareTeamReportData(mockTeam, mockTasks, '2024-01-01', '2024-12-31');

    const u2 = out.members.find(m => m.id === 'u2');
    const parent = u2.tasks.find(t => t.id === 't1');
    expect(parent).toBeDefined();
    expect(Array.isArray(parent.subtasks)).toBe(true);
    expect(parent.deadline).toBe('2024-01-10'); // formatted
  });

  test('handles no tasks', async () => {
    fetchProfileDetails.mockResolvedValue(mockProfiles);
    const out = await prepareTeamReportData(mockTeam, [], '2024-01-01', '2024-01-31');
    expect(out.groupKPIs.totalTasks).toBe(0);
    expect(out.groupKPIs.completionRate).toBe(0);
    expect(out.totalTasks).toBe(0);
  });

  test('handles null deadline gracefully', async () => {
    fetchProfileDetails.mockResolvedValue(mockProfiles);
    const tasks = [{
      id: 'tnull', title: 'Null', status: 'Ongoing', deadline: null, priority: 1, parent_task_id: null,
      participants: [{ profile_id: 'u1', is_owner: true }]
    }];
    const out = await prepareTeamReportData(mockTeam, tasks, '2024-01-01', '2024-01-31');
    const u1 = out.members.find(m => m.id === 'u1');
    expect(u1.tasks[0].deadline).toBe('N/A');
  });
});
