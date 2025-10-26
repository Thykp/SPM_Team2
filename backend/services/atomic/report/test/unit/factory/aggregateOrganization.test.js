const { prepareOrganizationReportData } = require('../../../factory/aggregateOrganization');
const { fetchAllDepartments, fetchProfileDetails, fetchTasksForDepartment } = require('../../../services/callingService');
const { generateBar } = require('../../../factory/makeCharts');
const axios = require('axios');

// Mock dependencies
jest.mock('../../../services/callingService');
jest.mock('../../../factory/makeCharts');

describe('aggregateOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('prepareOrganizationReportData', () => {
    test('Should successfully generate organization report with multiple departments', async () => {
      // Mock data
      const mockDepartments = [
        { id: 'dept-1', name: 'Engineering' },
        { id: 'dept-2', name: 'Marketing' }
      ];

      const mockUsers = [
        { id: 'user-1', department_id: 'dept-1' },
        { id: 'user-2', department_id: 'dept-1' },
        { id: 'user-3', department_id: 'dept-2' }
      ];

      const mockTasksDept1 = [
        {
          id: 'task-1',
          title: 'Build API',
          status: 'Completed',
          priority: 7,
          deadline: '2024-01-15',
          participants: [{ profile_id: 'user-1', is_owner: true }]
        },
        {
          id: 'task-2',
          title: 'Fix Bug',
          status: 'Ongoing',
          priority: 5,
          deadline: '2024-01-20',
          participants: [{ profile_id: 'user-2', is_owner: false }]
        }
      ];

      const mockTasksDept2 = [
        {
          id: 'task-3',
          title: 'Design Campaign',
          status: 'Overdue',
          priority: 8,
          deadline: '2024-01-10',
          participants: [{ profile_id: 'user-3', is_owner: true }]
        }
      ];

      const mockProfileDetails = {
        'user-1': { name: 'John Doe', email: 'john@example.com', dept: 'Engineering' },
        'user-2': { name: 'Jane Smith', email: 'jane@example.com', dept: 'Engineering' },
        'user-3': { name: 'Bob Wilson', email: 'bob@example.com', dept: 'Marketing' }
      };

      const mockChart = 'data:image/png;base64,mockchart';

      // Setup mocks
      fetchAllDepartments.mockResolvedValue(mockDepartments);
      axios.get = jest.fn()
        .mockResolvedValueOnce({ data: mockUsers }) // /user/all
        .mockResolvedValueOnce({ data: [{ id: 'team-1', name: 'Alpha', department_id: 'dept-1' }] }) // /user/teams for dept-1
        .mockResolvedValueOnce({ data: mockUsers })
        .mockResolvedValueOnce({ data: [{ id: 'team-2', name: 'Beta', department_id: 'dept-2' }] }); // /user/teams for dept-2

      fetchTasksForDepartment
        .mockResolvedValueOnce(mockTasksDept1)
        .mockResolvedValueOnce(mockTasksDept2);

      fetchProfileDetails
        .mockResolvedValueOnce(mockProfileDetails) // For dept-1 contributors
        .mockResolvedValueOnce(mockProfileDetails) // For dept-2 contributors
        .mockResolvedValueOnce(mockProfileDetails); // For high priority tasks

      generateBar.mockResolvedValue(mockChart);

      // Execute
      const result = await prepareOrganizationReportData('2024-01-01', '2024-01-31');

      // Assertions
      expect(result).toBeDefined();
      expect(result.orgKPIs.totalTasks).toBe(3);
      expect(result.orgKPIs.completedTasks).toBe(1);
      expect(result.orgKPIs.ongoingTasks).toBe(1);
      expect(result.orgKPIs.overdueTasks).toBe(1);
      expect(result.orgKPIs.activeEmployees).toBe(3);
      expect(result.orgKPIs.totalDepartments).toBe(2);
      expect(result.departments).toHaveLength(2);
      expect(result.charts.statusBar).toBe(mockChart);
      expect(result.charts.departmentBar).toBe(mockChart);
    });

    test('Should handle departments with no members', async () => {
      const mockDepartments = [
        { id: 'dept-1', name: 'Engineering' }
      ];

      const mockUsers = [];
      const mockChart = 'data:image/png;base64,mockchart';

      fetchAllDepartments.mockResolvedValue(mockDepartments);
      axios.get = jest.fn()
        .mockResolvedValueOnce({ data: mockUsers });

      generateBar.mockResolvedValue(mockChart);

      const result = await prepareOrganizationReportData('2024-01-01', '2024-01-31');

      expect(result.departments).toHaveLength(1);
      expect(result.departments[0].employeeCount).toBe(0);
      expect(result.departments[0].totalTasks).toBe(0);
    });

    test('Should handle departments with no tasks in date range', async () => {
      const mockDepartments = [
        { id: 'dept-1', name: 'Engineering' }
      ];

      const mockUsers = [
        { id: 'user-1', department_id: 'dept-1' }
      ];

      const mockChart = 'data:image/png;base64,mockchart';

      fetchAllDepartments.mockResolvedValue(mockDepartments);
      axios.get = jest.fn()
        .mockResolvedValueOnce({ data: mockUsers })
        .mockResolvedValueOnce({ data: [] });

      fetchTasksForDepartment.mockRejectedValue(new Error('No tasks found'));
      generateBar.mockResolvedValue(mockChart);

      const result = await prepareOrganizationReportData('2024-01-01', '2024-01-31');

      expect(result.departments).toHaveLength(1);
      expect(result.departments[0].totalTasks).toBe(0);
      expect(result.orgKPIs.totalTasks).toBe(0);
    });

    test('Should deduplicate tasks across departments', async () => {
      const mockDepartments = [
        { id: 'dept-1', name: 'Engineering' },
        { id: 'dept-2', name: 'Operations' }
      ];

      const mockUsers = [
        { id: 'user-1', department_id: 'dept-1' },
        { id: 'user-2', department_id: 'dept-2' }
      ];

      const sharedTask = {
        id: 'task-shared',
        title: 'Shared Task',
        status: 'Ongoing',
        priority: 5,
        deadline: '2024-01-15',
        participants: [
          { profile_id: 'user-1', is_owner: true },
          { profile_id: 'user-2', is_owner: false }
        ]
      };

      const mockChart = 'data:image/png;base64,mockchart';
      const mockProfileDetails = {
        'user-1': { name: 'John Doe' },
        'user-2': { name: 'Jane Smith' }
      };

      fetchAllDepartments.mockResolvedValue(mockDepartments);
      axios.get = jest.fn()
        .mockResolvedValueOnce({ data: mockUsers })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: mockUsers })
        .mockResolvedValueOnce({ data: [] });

      fetchTasksForDepartment
        .mockResolvedValueOnce([sharedTask])
        .mockResolvedValueOnce([sharedTask]);

      fetchProfileDetails.mockResolvedValue(mockProfileDetails);
      generateBar.mockResolvedValue(mockChart);

      const result = await prepareOrganizationReportData('2024-01-01', '2024-01-31');

      expect(result.orgKPIs.totalTasks).toBe(1);
      expect(result.departments[0].totalTasks).toBe(1);
      expect(result.departments[1].totalTasks).toBe(1);
    });

    test('Should calculate correct completion rates', async () => {
      const mockDepartments = [{ id: 'dept-1', name: 'Engineering' }];
      const mockUsers = [{ id: 'user-1', department_id: 'dept-1' }];
      const mockTasks = [
        { id: 'task-1', status: 'Completed', priority: 3, deadline: '2024-01-15', participants: [] },
        { id: 'task-2', status: 'Completed', priority: 5, deadline: '2024-01-20', participants: [] },
        { id: 'task-3', status: 'Ongoing', priority: 7, deadline: '2024-01-25', participants: [] }
      ];
      const mockChart = 'data:image/png;base64,mockchart';

      fetchAllDepartments.mockResolvedValue(mockDepartments);
      axios.get = jest.fn()
        .mockResolvedValueOnce({ data: mockUsers })
        .mockResolvedValueOnce({ data: [] });

      fetchTasksForDepartment.mockResolvedValue(mockTasks);
      fetchProfileDetails.mockResolvedValue({});
      generateBar.mockResolvedValue(mockChart);

      const result = await prepareOrganizationReportData('2024-01-01', '2024-01-31');

      expect(result.departments[0].completed).toBe(2);
      expect(result.departments[0].completionRate).toBe(67); // 2/3 = 67%
      expect(result.orgKPIs.completionRate).toBe(67);
    });

    test('Should identify top performers and insights', async () => {
      const mockDepartments = [
        { id: 'dept-1', name: 'Engineering' },
        { id: 'dept-2', name: 'Marketing' }
      ];

      const mockUsers = [
        { id: 'user-1', department_id: 'dept-1' },
        { id: 'user-2', department_id: 'dept-2' }
      ];

      const dept1Tasks = [
        { id: 'task-1', status: 'Completed', priority: 3, deadline: '2024-01-15', participants: [] }
      ];
      const dept2Tasks = [
        { id: 'task-2', status: 'Ongoing', priority: 3, deadline: '2024-01-20', participants: [] }
      ];

      const mockChart = 'data:image/png;base64,mockchart';

      fetchAllDepartments.mockResolvedValue(mockDepartments);
      axios.get = jest.fn()
        .mockResolvedValueOnce({ data: mockUsers })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: mockUsers })
        .mockResolvedValueOnce({ data: [] });

      fetchTasksForDepartment
        .mockResolvedValueOnce(dept1Tasks)
        .mockResolvedValueOnce(dept2Tasks);

      fetchProfileDetails.mockResolvedValue({});
      generateBar.mockResolvedValue(mockChart);

      const result = await prepareOrganizationReportData('2024-01-01', '2024-01-31');

      expect(result.insights.overallPerformance).toContain('Engineering');
      expect(result.insights.topPerformer).toContain('Engineering');
    });

    test('Should handle high priority tasks and map assignee names', async () => {
      const mockDepartments = [{ id: 'dept-1', name: 'Engineering' }];
      const mockUsers = [{ id: 'user-1', department_id: 'dept-1' }];
      const mockTasks = [
        {
          id: 'task-high',
          title: 'Critical Bug',
          status: 'Overdue',
          priority: 9,
          deadline: '2024-01-10',
          participants: [{ profile_id: 'user-1', is_owner: true }]
        }
      ];
      const mockChart = 'data:image/png;base64,mockchart';
      const mockProfileDetails = {
        'user-1': { name: 'John Doe' }
      };

      fetchAllDepartments.mockResolvedValue(mockDepartments);
      axios.get = jest.fn()
        .mockResolvedValueOnce({ data: mockUsers })
        .mockResolvedValueOnce({ data: [] });

      fetchTasksForDepartment.mockResolvedValue(mockTasks);
      fetchProfileDetails.mockResolvedValue(mockProfileDetails);
      generateBar.mockResolvedValue(mockChart);

      const result = await prepareOrganizationReportData('2024-01-01', '2024-01-31');

      expect(result.highPriorityTasks).toHaveLength(1);
      expect(result.highPriorityTasks[0].priority).toBe(9);
      expect(result.highPriorityTasks[0].assignees).toBe('John Doe');
    });

    test('Should format dates correctly', async () => {
      const mockDepartments = [{ id: 'dept-1', name: 'Engineering' }];
      const mockUsers = [{ id: 'user-1', department_id: 'dept-1' }];
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task',
          status: 'Completed',
          priority: 5,
          deadline: '2024-01-15T10:00:00Z',
          participants: []
        }
      ];
      const mockChart = 'data:image/png;base64,mockchart';

      fetchAllDepartments.mockResolvedValue(mockDepartments);
      axios.get = jest.fn()
        .mockResolvedValueOnce({ data: mockUsers })
        .mockResolvedValueOnce({ data: [] });

      fetchTasksForDepartment.mockResolvedValue(mockTasks);
      fetchProfileDetails.mockResolvedValue({});
      generateBar.mockResolvedValue(mockChart);

      const result = await prepareOrganizationReportData('2024-01-01', '2024-01-31');

      expect(result.reportPeriod).toBe('2024-01-01 - 2024-01-31');
    });
  });
});

