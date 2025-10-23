const { prepareProjectReportData } = require('../../../factory/aggregateProjectTasks');
const { fetchProfileDetails } = require('../../../services/callingService');
const { generateBar } = require('../../../factory/makeCharts');

// Mock dependencies
jest.mock('../../../services/callingService');
jest.mock('../../../factory/makeCharts');

describe('aggregateProjectTasks', () => {
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Spy on console.log and suppress output
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        // Mock chart generation
        generateBar.mockResolvedValue('data:image/png;base64,mockChartData');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('prepareProjectReportData', () => {
        const mockProjectData = {
            id: 'project-123',
            title: 'Test Project',
            description: 'A test project',
            owner: 'user-owner',
            collaborators: ['user-123', 'user-456'],
            created_at: '2024-01-01T00:00:00Z'
        };

        const mockProfiles = {
            'user-owner': {
                name: 'Project Owner',
                email: 'owner@example.com',
                dept: 'Management'
            },
            'user-123': {
                name: 'John Doe',
                email: 'john@example.com',
                dept: 'Engineering'
            },
            'user-456': {
                name: 'Jane Smith',
                email: 'jane@example.com',
                dept: 'Design'
            }
        };

        const mockTasks = [
            {
                id: 'task-1',
                title: 'Task 1',
                status: 'Completed',
                deadline: '2024-01-15T00:00:00Z',
                priority: 5,
                parent_task_id: null,
                participants: [
                    { profile_id: 'user-123', is_owner: true },
                    { profile_id: 'user-456', is_owner: false }
                ]
            },
            {
                id: 'task-2',
                title: 'Task 2',
                status: 'Ongoing',
                deadline: '2024-01-20T00:00:00Z',
                priority: 3,
                parent_task_id: null,
                participants: [
                    { profile_id: 'user-123', is_owner: true }
                ]
            },
            {
                id: 'subtask-1',
                title: 'Subtask 1',
                status: 'Under Review',
                deadline: '2024-01-12T00:00:00Z',
                priority: 8,
                parent_task_id: 'task-1',
                participants: [
                    { profile_id: 'user-456', is_owner: true }
                ]
            },
            {
                id: 'task-3',
                title: 'Overdue Task',
                status: 'Overdue',
                deadline: '2024-01-10T00:00:00Z',
                priority: 9,
                parent_task_id: null,
                participants: [
                    { profile_id: 'user-123', is_owner: false },
                    { profile_id: 'user-456', is_owner: true }
                ]
            }
        ];

        test('Should prepare project report data successfully', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                mockTasks,
                '2024-01-01',
                '2024-01-31'
            );

            expect(result).toHaveProperty('projectTitle', 'Test Project');
            expect(result).toHaveProperty('projectDescription', 'A test project');
            expect(result).toHaveProperty('owner');
            expect(result.owner).toEqual({
                name: 'Project Owner',
                email: 'owner@example.com',
                dept: 'Management'
            });
            expect(result).toHaveProperty('reportPeriod', '2024-01-01 - 2024-01-31');
            expect(result).toHaveProperty('projectKPIs');
            expect(result).toHaveProperty('collaborators');
            expect(result).toHaveProperty('charts');
            expect(result).toHaveProperty('totalTasks', 4);
        });

        test('Should calculate project KPIs correctly', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                mockTasks,
                '2024-01-01',
                '2024-01-31'
            );

            expect(result.projectKPIs).toEqual({
                totalTasks: 4,
                totalCollaborators: 2,
                completedTasks: 1,
                ongoingTasks: 1,
                overdueTasks: 1,
                underReviewTasks: 1,
                completionRate: 25 // 1 out of 4 tasks completed = 25%
            });
        });

        test('Should organize tasks by collaborator', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                mockTasks,
                '2024-01-01',
                '2024-01-31'
            );

            expect(result.collaborators).toHaveLength(2);
            
            const user123 = result.collaborators.find(c => c.id === 'user-123');
            expect(user123).toBeDefined();
            expect(user123.profile.name).toBe('John Doe');
            expect(user123.tasks).toBeDefined();
            
            const user456 = result.collaborators.find(c => c.id === 'user-456');
            expect(user456).toBeDefined();
            expect(user456.profile.name).toBe('Jane Smith');
        });

        test('Should calculate individual collaborator KPIs', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                mockTasks,
                '2024-01-01',
                '2024-01-31'
            );

            const user123 = result.collaborators.find(c => c.id === 'user-123');
            expect(user123.kpis).toEqual({
                total: 3, // task-1, task-2, task-3
                completed: 1, // task-1
                ongoing: 1, // task-2
                underReview: 0,
                overdue: 1, // task-3
                highPriority: 1 // task-3 (priority 9)
            });
        });

        test('Should organize tasks hierarchically with subtasks', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                mockTasks,
                '2024-01-01',
                '2024-01-31'
            );

            const user123 = result.collaborators.find(c => c.id === 'user-123');
            const parentTask = user123.tasks.find(t => t.id === 'task-1');
            
            expect(parentTask).toBeDefined();
            expect(parentTask.subtasks).toBeDefined();
            expect(parentTask.subtasks).toBeInstanceOf(Array);
        });

        test('Should handle tasks with no participants', async () => {
            const tasksWithUnassigned = [
                ...mockTasks,
                {
                    id: 'task-unassigned',
                    title: 'Unassigned Task',
                    status: 'Unassigned',
                    deadline: '2024-01-25T00:00:00Z',
                    priority: 5,
                    parent_task_id: null,
                    participants: []
                }
            ];

            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                tasksWithUnassigned,
                '2024-01-01',
                '2024-01-31'
            );

            expect(result.unassignedTasks).toHaveLength(1);
            expect(result.unassignedTasks[0].title).toBe('Unassigned Task');
        });

        test('Should generate status bar chart', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            await prepareProjectReportData(
                mockProjectData,
                mockTasks,
                '2024-01-01',
                '2024-01-31'
            );

            expect(generateBar).toHaveBeenCalledWith(
                ['Completed', 'Ongoing', 'Under Review', 'Overdue'],
                [1, 1, 1, 1]
            );
        });

        test('Should generate collaborator performance chart', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                mockTasks,
                '2024-01-01',
                '2024-01-31'
            );

            expect(result.charts.collaboratorPerformance).toBeDefined();
            expect(generateBar).toHaveBeenCalledTimes(2); // Status + Collaborator charts
        });

        test('Should handle project with no collaborators', async () => {
            const projectWithNoCollabs = {
                ...mockProjectData,
                collaborators: []
            };

            fetchProfileDetails.mockResolvedValue({
                'user-owner': mockProfiles['user-owner']
            });

            const result = await prepareProjectReportData(
                projectWithNoCollabs,
                [],
                '2024-01-01',
                '2024-01-31'
            );

            expect(result.collaborators).toHaveLength(0);
            expect(result.projectKPIs.totalCollaborators).toBe(0);
        });

        test('Should handle project with no tasks', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                [],
                '2024-01-01',
                '2024-01-31'
            );

            expect(result.projectKPIs.totalTasks).toBe(0);
            expect(result.projectKPIs.completionRate).toBe(0);
            expect(result.totalTasks).toBe(0);
        });

        test('Should format dates correctly', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                mockTasks,
                '2024-01-01',
                '2024-12-31'
            );

            expect(result.reportPeriod).toBe('2024-01-01 - 2024-12-31');
            
            const user123 = result.collaborators.find(c => c.id === 'user-123');
            const task = user123.tasks.find(t => t.id === 'task-1');
            expect(task.deadline).toBe('2024-01-15');
        });

        test('Should handle null deadline gracefully', async () => {
            const tasksWithNullDeadline = [{
                id: 'task-null',
                title: 'Task with null deadline',
                status: 'Ongoing',
                deadline: null,
                priority: 5,
                parent_task_id: null,
                participants: [
                    { profile_id: 'user-123', is_owner: true }
                ]
            }];

            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                tasksWithNullDeadline,
                '2024-01-01',
                '2024-01-31'
            );

            const user123 = result.collaborators.find(c => c.id === 'user-123');
            expect(user123.tasks[0].deadline).toBe('N/A');
        });

        test('Should handle unknown owner gracefully', async () => {
            const projectWithUnknownOwner = {
                ...mockProjectData,
                owner: 'user-unknown'
            };

            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                projectWithUnknownOwner,
                mockTasks,
                '2024-01-01',
                '2024-01-31'
            );

            expect(result.owner).toEqual({
                name: 'Unknown Owner',
                email: null,
                dept: null
            });
        });

        test('Should assign correct roles to collaborators', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                mockTasks,
                '2024-01-01',
                '2024-01-31'
            );

            const user123 = result.collaborators.find(c => c.id === 'user-123');
            const ownerTask = user123.tasks.find(t => t.id === 'task-1');
            const collabTask = user123.tasks.find(t => t.id === 'task-3');
            
            expect(ownerTask.role).toBe('Owner');
            expect(collabTask.role).toBe('Collaborator');
        });

        test('Should count high priority tasks correctly (priority <= 3)', async () => {
            fetchProfileDetails.mockResolvedValue(mockProfiles);

            const result = await prepareProjectReportData(
                mockProjectData,
                mockTasks,
                '2024-01-01',
                '2024-01-31'
            );

            const user456 = result.collaborators.find(c => c.id === 'user-456');
            // user-456 has: task-1 (priority 5), subtask-1 (priority 2), task-3 (priority 1)
            // High priority (<=3): subtask-1 and task-3 = 2
            expect(user456.kpis.highPriority).toBe(2);
        });

        test('Should not create collaborator performance chart when no collaborators', async () => {
            const projectWithNoCollabs = {
                ...mockProjectData,
                collaborators: []
            };

            fetchProfileDetails.mockResolvedValue({
                'user-owner': mockProfiles['user-owner']
            });

            const result = await prepareProjectReportData(
                projectWithNoCollabs,
                [],
                '2024-01-01',
                '2024-01-31'
            );

            expect(result.charts.collaboratorPerformance).toBeNull();
        });
    });
});
