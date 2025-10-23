const { prepareReportData } = require('../../../factory/aggregatePersonalTask');
const { getProjectDetails } = require('../../../services/callingService');
const { generateBar, generatePie } = require('../../../factory/makeCharts');
const { InternalError } = require('../../../model/AppError');

// Mock dependencies
jest.mock('../../../services/callingService');
jest.mock('../../../factory/makeCharts');

describe('AggregatePersonalTask', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Spy on console.error and suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('prepareReportData', () => {
        const mockTaskList = [
            {
                id: 'task1',
                title: 'Task 1',
                status: 'Completed',
                deadline: '2024-01-15T10:00:00Z',
                priority: 2,
                projectId: 'project1',
                role: 'Owner',
                parent_task_id: null
            },
            {
                id: 'task2',
                title: 'Task 2',
                status: 'Ongoing',
                deadline: '2024-01-20T10:00:00Z',
                priority: 5,
                projectId: 'project1',
                role: 'Collaborator',
                parent_task_id: null
            },
            {
                id: 'subtask1',
                title: 'Subtask 1',
                status: 'Completed',
                deadline: '2024-01-18T10:00:00Z',
                priority: 3,
                projectId: 'project1',
                role: 'Owner',
                parent_task_id: 'task1'
            },
            {
                id: 'task3',
                title: 'Task 3',
                status: 'Under Review',
                deadline: '2024-01-25T10:00:00Z',
                priority: 8,
                projectId: 'project2',
                role: 'Owner',
                parent_task_id: null
            },
            {
                id: 'task4',
                title: 'Task 4',
                status: 'Overdue',
                deadline: '2024-01-10T10:00:00Z',
                priority: 1,
                projectId: null,
                role: 'Owner',
                parent_task_id: null
            }
        ];

        const mockProjectInfo = {
            'project1': 'Project Alpha',
            'project2': 'Project Beta'
        };

        const mockCharts = {
            statusBar: 'data:image/png;base64,mockStatusChart',
            priorityPie: 'data:image/png;base64,mockPriorityChart'
        };

        beforeEach(() => {
            getProjectDetails.mockResolvedValue(mockProjectInfo);
            generateBar.mockResolvedValue(mockCharts.statusBar);
            generatePie.mockResolvedValue(mockCharts.priorityPie);
        });

        test('Should prepare report data correctly with valid input', async () => {
            const startDate = '2024-01-01';
            const endDate = '2024-01-31';

            const result = await prepareReportData(mockTaskList, startDate, endDate);

            // Verify project details were fetched
            expect(getProjectDetails).toHaveBeenCalledWith(['project1', 'project2']);

            // Verify charts were generated
            expect(generateBar).toHaveBeenCalledWith(
                ['Completed', 'Ongoing', 'Under Review', 'Overdue'],
                [2, 1, 1, 1] // Two completed tasks (including subtask), one in each other status
            );
            expect(generatePie).toHaveBeenCalledWith(
                ['Low (1-3)', 'Medium (4-7)', 'High (8-10)'],
                [3, 1, 1] // 3 low priority (1,2,3), 1 medium (5), 1 high (8)
            );

            // Verify result structure
            expect(result).toHaveProperty('tasks');
            expect(result).toHaveProperty('kpis');
            expect(result).toHaveProperty('reportPeriod');
            expect(result).toHaveProperty('charts');

            // Verify tasks transformation
            expect(result.tasks).toHaveLength(5);
            expect(result.tasks[0]).toMatchObject({
                id: 'task4', // Should be sorted by deadline first
                title: 'Task 4',
                status: 'Overdue',
                deadline: '2024-01-10',
                priority: 1,
                projectName: null, // No project ID
                role: 'Owner'
            });

            // Verify KPIs (including subtasks)
            expect(result.kpis).toEqual({
                totalTasks: 5,
                completedTasks: 2,
                underReviewTasks: 1,
                ongoingTasks: 1,
                overdueTasks: 1,
                lowPriorityTasks: 3, // priorities 1, 2, 3
                mediumPriorityTasks: 1, // priority 5
                highPriorityTasks: 1 // priority 8
            });

            // Verify report period
            expect(result.reportPeriod).toBe('2024-01-01 - 2024-01-31');

            // Verify charts
            expect(result.charts).toEqual({
                statusBar: mockCharts.statusBar,
                priorityPie: mockCharts.priorityPie
            });
        });

        test('Should correctly identify and mark subtasks', async () => {
            const startDate = '2024-01-01';
            const endDate = '2024-01-31';

            const result = await prepareReportData(mockTaskList, startDate, endDate);

            // Find the subtask
            const subtask = result.tasks.find(task => task.id === 'subtask1');
            expect(subtask).toBeDefined();
            expect(subtask.isSubtask).toBe(true);
            expect(subtask.parentTaskId).toBe('task1');

            // Find a parent task
            const parentTask = result.tasks.find(task => task.id === 'task1');
            expect(parentTask).toBeDefined();
            expect(parentTask.isSubtask).toBe(false);
            expect(parentTask.parentTaskId).toBeNull();
        });

        test('Should handle tasks with null project IDs', async () => {
      const tasksWithNullProject = [
        {
          id: 'task1',
          title: 'Task 1',
          status: 'Completed',
          deadline: '2024-01-15T10:00:00Z',
          priority: 2,
          projectId: null,
          role: 'Owner'
        }
      ];

      const result = await prepareReportData(tasksWithNullProject, '2024-01-01', '2024-01-31');

      expect(getProjectDetails).toHaveBeenCalledWith([]);
      expect(result.tasks[0].projectName).toBeNull();
    });

    test('should sort tasks by deadline then priority', async () => {
      const unsortedTasks = [
        {
          id: 'task1',
          title: 'Task 1',
          status: 'Completed',
          deadline: '2024-01-20T10:00:00Z',
          priority: 5,
          projectId: 'project1',
          role: 'Owner'
        },
        {
          id: 'task2',
          title: 'Task 2',
          status: 'Ongoing',
          deadline: '2024-01-20T10:00:00Z',
          priority: 2,
          projectId: 'project1',
          role: 'Collaborator'
        },
        {
          id: 'task3',
          title: 'Task 3',
          status: 'Under Review',
          deadline: '2024-01-15T10:00:00Z',
          priority: 8,
          projectId: 'project2',
          role: 'Owner'
        }
      ];

      const result = await prepareReportData(unsortedTasks, '2024-01-01', '2024-01-31');

      // Should be sorted by deadline first, then priority (descending - higher priority first)
      expect(result.tasks[0].id).toBe('task3'); // Earliest deadline
      expect(result.tasks[1].id).toBe('task1'); // Same deadline, higher priority (5 > 2)
      expect(result.tasks[2].id).toBe('task2'); // Same deadline, lower priority
    });

    test('should handle tasks with null deadlines', async () => {
      const tasksWithNullDeadline = [
        {
          id: 'task1',
          title: 'Task 1',
          status: 'Completed',
          deadline: null,
          priority: 2,
          projectId: 'project1',
          role: 'Owner'
        }
      ];

      const result = await prepareReportData(tasksWithNullDeadline, '2024-01-01', '2024-01-31');

      expect(result.tasks[0].deadline).toBe('N/A');
      expect(result.tasks[0].rawDeadline).toBeNull();
    });

    test('should calculate KPIs correctly for different status distributions', async () => {
      const mixedStatusTasks = [
        { id: 'task1', title: 'Task 1', status: 'Completed', deadline: '2024-01-15T10:00:00Z', priority: 2, projectId: 'project1', role: 'Owner' },
        { id: 'task2', title: 'Task 2', status: 'Completed', deadline: '2024-01-20T10:00:00Z', priority: 3, projectId: 'project1', role: 'Collaborator' },
        { id: 'task3', title: 'Task 3', status: 'Ongoing', deadline: '2024-01-25T10:00:00Z', priority: 5, projectId: 'project2', role: 'Owner' },
        { id: 'task4', title: 'Task 4', status: 'Ongoing', deadline: '2024-01-30T10:00:00Z', priority: 6, projectId: 'project2', role: 'Owner' },
        { id: 'task5', title: 'Task 5', status: 'Under Review', deadline: '2024-02-01T10:00:00Z', priority: 8, projectId: 'project3', role: 'Collaborator' }
      ];

      const result = await prepareReportData(mixedStatusTasks, '2024-01-01', '2024-01-31');

      expect(result.kpis).toEqual({
        totalTasks: 5,
        completedTasks: 2,
        underReviewTasks: 1,
        ongoingTasks: 2,
        overdueTasks: 0,
        lowPriorityTasks: 2, // priorities 2, 3
        mediumPriorityTasks: 2, // priorities 5, 6
        highPriorityTasks: 1 // priority 8
      });
    });

    test('should calculate priority KPIs correctly', async () => {
      const priorityTestTasks = [
        { id: 'task1', title: 'Task 1', status: 'Completed', deadline: '2024-01-15T10:00:00Z', priority: 1, projectId: 'project1', role: 'Owner' },
        { id: 'task2', title: 'Task 2', status: 'Ongoing', deadline: '2024-01-20T10:00:00Z', priority: 3, projectId: 'project1', role: 'Collaborator' },
        { id: 'task3', title: 'Task 3', status: 'Under Review', deadline: '2024-01-25T10:00:00Z', priority: 4, projectId: 'project2', role: 'Owner' },
        { id: 'task4', title: 'Task 4', status: 'Overdue', deadline: '2024-01-30T10:00:00Z', priority: 7, projectId: 'project2', role: 'Owner' },
        { id: 'task5', title: 'Task 5', status: 'Completed', deadline: '2024-02-01T10:00:00Z', priority: 8, projectId: 'project3', role: 'Collaborator' },
        { id: 'task6', title: 'Task 6', status: 'Ongoing', deadline: '2024-02-05T10:00:00Z', priority: 10, projectId: 'project3', role: 'Owner' }
      ];

      const result = await prepareReportData(priorityTestTasks, '2024-01-01', '2024-01-31');

      expect(result.kpis).toEqual({
        totalTasks: 6,
        completedTasks: 2,
        underReviewTasks: 1,
        ongoingTasks: 2,
        overdueTasks: 1,
        lowPriorityTasks: 2, // priorities 1, 3
        mediumPriorityTasks: 2, // priorities 4, 7
        highPriorityTasks: 2 // priorities 8, 10
      });
    });

    test('should handle empty task list', async () => {
      const result = await prepareReportData([], '2024-01-01', '2024-01-31');

      expect(getProjectDetails).toHaveBeenCalledWith([]);
      expect(result.tasks).toHaveLength(0);
      expect(result.kpis).toEqual({
        totalTasks: 0,
        completedTasks: 0,
        underReviewTasks: 0,
        ongoingTasks: 0,
        overdueTasks: 0,
        lowPriorityTasks: 0,
        mediumPriorityTasks: 0,
        highPriorityTasks: 0
      });
      expect(result.charts.statusBar).toBe(mockCharts.statusBar);
      expect(result.charts.priorityPie).toBe(mockCharts.priorityPie);
    });

    test('should throw InternalError when getProjectDetails fails', async () => {
      getProjectDetails.mockRejectedValue(new Error('Project service unavailable'));

      await expect(prepareReportData(mockTaskList, '2024-01-01', '2024-01-31'))
        .rejects
        .toThrow(InternalError);
    });

    test('should throw InternalError when chart generation fails', async () => {
      generateBar.mockRejectedValue(new Error('Chart generation failed'));

      await expect(prepareReportData(mockTaskList, '2024-01-01', '2024-01-31'))
        .rejects
        .toThrow(InternalError);
    });

    test('should handle duplicate project IDs correctly', async () => {
      const tasksWithDuplicateProjects = [
        { id: 'task1', title: 'Task 1', status: 'Completed', deadline: '2024-01-15T10:00:00Z', priority: 2, projectId: 'project1', role: 'Owner' },
        { id: 'task2', title: 'Task 2', status: 'Ongoing', deadline: '2024-01-20T10:00:00Z', priority: 5, projectId: 'project1', role: 'Collaborator' },
        { id: 'task3', title: 'Task 3', status: 'Under Review', deadline: '2024-01-25T10:00:00Z', priority: 8, projectId: 'project1', role: 'Owner' }
      ];

      const result = await prepareReportData(tasksWithDuplicateProjects, '2024-01-01', '2024-01-31');

      expect(getProjectDetails).toHaveBeenCalledWith(['project1']); // Should deduplicate
      expect(result.tasks).toHaveLength(3);
      result.tasks.forEach(task => {
        expect(task.projectName).toBe('Project Alpha');
      });
    });
  });
});
