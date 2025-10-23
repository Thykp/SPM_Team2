const { fetchTasksForUser, getProjectDetails, fetchProjectWithCollaborators, fetchTasksForProject, fetchProfileDetails } = require('../../../services/callingService');
const axios = require('axios');
const { ServiceUnavailableError, NotFoundError } = require('../../../model/AppError');

// Mock axios
jest.mock('axios');

describe('CallingService', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Spy on console.error and suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('fetchTasksForUser', () => {
        const mockTaskResponse = [
            {
                id: 'task-123',
                title: 'Test Task 1',
                status: 'Ongoing',
                deadline: '2024-01-15T10:00:00Z',
                priority: 5,
                project_id: 'project-456',
                parent_task_id: null,
                updated_at: '2024-01-10T10:00:00Z',
                participants: [
                    { profile_id: 'user-123', is_owner: true },
                    { profile_id: 'user-456', is_owner: false }
                ]
            },
            {
                id: 'task-456',
                title: 'Test Task 2',
                status: 'Completed',
                deadline: '2024-01-20T10:00:00Z',
                priority: 3,
                project_id: 'project-789',
                parent_task_id: null,
                updated_at: '2024-01-12T10:00:00Z',
                participants: [
                    { profile_id: 'user-123', is_owner: false },
                    { profile_id: 'user-789', is_owner: true }
                ]
            },
            {
                id: 'subtask-789',
                title: 'Subtask 1',
                status: 'Completed',
                deadline: '2024-01-18T10:00:00Z',
                priority: 2,
                project_id: 'project-456',
                parent_task_id: 'task-123',
                updated_at: '2024-01-15T10:00:00Z',
                participants: [
                    { profile_id: 'user-123', is_owner: true }
                ]
            }
        ];

        test('Should fetch and normalize tasks for user successfully', async () => {
            axios.get.mockResolvedValue({ data: mockTaskResponse });

            const result = await fetchTasksForUser('user-123', '2024-01-01', '2024-01-31');

            expect(axios.get).toHaveBeenCalledWith(
                'http://localhost:3031/task/users/user-123?startDate=2024-01-01&endDate=2024-01-31'
            );

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
                id: 'task-123',
                title: 'Test Task 1',
                status: 'Ongoing',
                role: 'Owner', // user-123 is owner
                deadline: '2024-01-15T10:00:00Z',
                priority: 5,
                projectId: 'project-456',
                parent_task_id: null,
                updatedAt: '2024-01-10T10:00:00Z'
            });
            expect(result[1]).toEqual({
                id: 'task-456',
                title: 'Test Task 2',
                status: 'Completed',
                role: 'Collaborator', // user-123 is collaborator
                deadline: '2024-01-20T10:00:00Z',
                priority: 3,
                projectId: 'project-789',
                parent_task_id: null,
                updatedAt: '2024-01-12T10:00:00Z'
            });
            
            // Verify subtask has parent_task_id
            expect(result[2]).toEqual({
                id: 'subtask-789',
                title: 'Subtask 1',
                status: 'Completed',
                role: 'Owner', // user-123 is owner
                deadline: '2024-01-18T10:00:00Z',
                priority: 2,
                projectId: 'project-456',
                parent_task_id: 'task-123',
                updatedAt: '2024-01-15T10:00:00Z'
            });
        });

        test('Should handle user as collaborator role', async () => {
            const collaboratorTask = [{
                id: 'task-789',
                title: 'Collaborator Task',
                status: 'Under Review',
                deadline: '2024-01-25T10:00:00Z',
                priority: 7,
                project_id: 'project-123',
                updated_at: '2024-01-15T10:00:00Z',
                participants: [
                    { profile_id: 'user-999', is_owner: true },
                    { profile_id: 'user-123', is_owner: false }
                ]
            }];

            axios.get.mockResolvedValue({ data: collaboratorTask });

            const result = await fetchTasksForUser('user-123', '2024-01-01', '2024-01-31');

            expect(result[0].role).toBe('Collaborator');
        });

        test('Should handle user with no role in task', async () => {
            const noRoleTask = [{
                id: 'task-999',
                title: 'No Role Task',
                status: 'Ongoing',
                deadline: '2024-01-30T10:00:00Z',
                priority: 4,
                project_id: 'project-999',
                updated_at: '2024-01-20T10:00:00Z',
                participants: [
                    { profile_id: 'user-999', is_owner: true },
                    { profile_id: 'user-888', is_owner: false }
                ]
            }];

            axios.get.mockResolvedValue({ data: noRoleTask });

            const result = await fetchTasksForUser('user-123', '2024-01-01', '2024-01-31');

            expect(result[0].role).toBeUndefined();
        });

        test('Should throw NotFoundError when no tasks found', async () => {
            axios.get.mockResolvedValue({ data: [] });

            await expect(fetchTasksForUser('user-123', '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow(NotFoundError);

            await expect(fetchTasksForUser('user-123', '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow('No tasks found for the specified user and date range');
        });

        test('Should throw NotFoundError when tasks is null', async () => {
            axios.get.mockResolvedValue({ data: null });

            await expect(fetchTasksForUser('user-123', '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow(NotFoundError);
        });

        test('Should throw ServiceUnavailableError when axios request fails', async () => {
            const axiosError = new Error('Network error');
            axios.get.mockRejectedValue(axiosError);

            await expect(fetchTasksForUser('user-123', '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow(ServiceUnavailableError);

            await expect(fetchTasksForUser('user-123', '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow('Task Service is currently unavailable');
        });

        test('Should handle tasks with missing fields gracefully', async () => {
            const incompleteTask = [{
                id: 'task-incomplete',
                title: 'Incomplete Task',
                // Missing status, deadline, priority, project_id, updated_at
                participants: [
                    { profile_id: 'user-123', is_owner: true }
                ]
            }];

            axios.get.mockResolvedValue({ data: incompleteTask });

            const result = await fetchTasksForUser('user-123', '2024-01-01', '2024-01-31');

            expect(result[0]).toEqual({
                id: 'task-incomplete',
                title: 'Incomplete Task',
                status: undefined,
                role: 'Owner',
                deadline: undefined,
                priority: undefined,
                projectId: undefined,
                updatedAt: undefined
            });
        });

        test('Should handle tasks with empty participants array', async () => {
            const noParticipantsTask = [{
                id: 'task-no-participants',
                title: 'No Participants Task',
                status: 'Ongoing',
                deadline: '2024-01-15T10:00:00Z',
                priority: 5,
                project_id: 'project-123',
                updated_at: '2024-01-10T10:00:00Z',
                participants: []
            }];

            axios.get.mockResolvedValue({ data: noParticipantsTask });

            const result = await fetchTasksForUser('user-123', '2024-01-01', '2024-01-31');

            expect(result[0].role).toBeUndefined();
        });
    });

    describe('getProjectDetails', () => {
        test('Should fetch project details for multiple project IDs', async () => {
            axios.get
                .mockResolvedValueOnce({ data: { title: 'Project Alpha' } })
                .mockResolvedValueOnce({ data: { title: 'Project Beta' } })
                .mockResolvedValueOnce({ data: { title: 'Project Gamma' } });

            const result = await getProjectDetails(['project-1', 'project-2', 'project-3']);

            expect(axios.get).toHaveBeenCalledTimes(3);
            expect(axios.get).toHaveBeenCalledWith('http://localhost:3040/project/project-1');
            expect(axios.get).toHaveBeenCalledWith('http://localhost:3040/project/project-2');
            expect(axios.get).toHaveBeenCalledWith('http://localhost:3040/project/project-3');

            expect(result).toEqual({
                'project-1': 'Project Alpha',
                'project-2': 'Project Beta',
                'project-3': 'Project Gamma'
            });
        });

        test('Should handle empty project IDs array', async () => {
            const result = await getProjectDetails([]);

            expect(axios.get).not.toHaveBeenCalled();
            expect(result).toEqual({});
        });

        test('Should handle project service errors gracefully', async () => {
            axios.get
                .mockResolvedValueOnce({ data: { title: 'Project Alpha' } })
                .mockRejectedValueOnce(new Error('Project not found'))
                .mockResolvedValueOnce({ data: { title: 'Project Gamma' } });

            const result = await getProjectDetails(['project-1', 'project-2', 'project-3']);

            expect(result).toEqual({
                'project-1': 'Project Alpha',
                'project-2': 'Unknown Project',
                'project-3': 'Project Gamma'
            });
        });

        test('Should handle duplicate project IDs', async () => {
            axios.get
                .mockResolvedValueOnce({ data: { title: 'Project Alpha' } })
                .mockResolvedValueOnce({ data: { title: 'Project Alpha' } })
                .mockResolvedValueOnce({ data: { title: 'Project Beta' } });

            const result = await getProjectDetails(['project-1', 'project-1', 'project-2']);

            expect(axios.get).toHaveBeenCalledTimes(3); // Function processes all IDs, doesn't deduplicate
            expect(result).toEqual({
                'project-1': 'Project Alpha',
                'project-2': 'Project Beta'
            });
        });

        test('Should handle project response with missing title', async () => {
            axios.get.mockResolvedValue({ data: {} });

            const result = await getProjectDetails(['project-1']);

            expect(result).toEqual({
                'project-1': undefined
            });
        });

        test('Should handle all project requests failing', async () => {
            axios.get
                .mockRejectedValue(new Error('Service unavailable'))
                .mockRejectedValue(new Error('Service unavailable'))
                .mockRejectedValue(new Error('Service unavailable'));

            const result = await getProjectDetails(['project-1', 'project-2', 'project-3']);

            expect(result).toEqual({
                'project-1': 'Unknown Project',
                'project-2': 'Unknown Project',
                'project-3': 'Unknown Project'
            });
        });
    });
    
    describe('fetchProjectWithCollaborators', () => {
        const mockProjectData = {
            id: 'project-123',
            title: 'Test Project',
            description: 'A test project description',
            owner: 'user-123',
            collaborators: ['user-123', 'user-456', 'user-789'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-10T00:00:00Z'
        };

        test('Should fetch project with collaborators successfully', async () => {
            axios.get.mockResolvedValue({ data: mockProjectData });

            const result = await fetchProjectWithCollaborators('project-123');

            expect(axios.get).toHaveBeenCalledWith('http://localhost:3040/project/project-123');
            expect(result).toEqual(mockProjectData);
        });

        test('Should throw ServiceUnavailableError when project service is down', async () => {
            const axiosError = new Error('Connection refused');
            axios.get.mockRejectedValue(axiosError);

            await expect(fetchProjectWithCollaborators('project-123'))
                .rejects
                .toThrow(ServiceUnavailableError);

            await expect(fetchProjectWithCollaborators('project-123'))
                .rejects
                .toThrow('Project Service is currently unavailable');
        });

        test('Should handle project with no collaborators', async () => {
            const projectWithNoCollabs = {
                id: 'project-456',
                title: 'Solo Project',
                description: 'A project with no collaborators',
                owner: 'user-123',
                collaborators: [],
                created_at: '2024-01-01T00:00:00Z'
            };

            axios.get.mockResolvedValue({ data: projectWithNoCollabs });

            const result = await fetchProjectWithCollaborators('project-456');

            expect(result.collaborators).toEqual([]);
        });

        test('Should handle project with missing fields', async () => {
            const incompleteProject = {
                id: 'project-789',
                title: 'Incomplete Project'
                // Missing description, collaborators, etc.
            };

            axios.get.mockResolvedValue({ data: incompleteProject });

            const result = await fetchProjectWithCollaborators('project-789');

            expect(result.id).toBe('project-789');
            expect(result.title).toBe('Incomplete Project');
        });
    });

    describe('fetchTasksForProject', () => {
        const mockProjectTasks = [
            {
                id: 'task-1',
                title: 'Task 1',
                description: 'First task',
                project_id: 'project-123',
                parent_task_id: null,
                status: 'Ongoing',
                priority: 5,
                deadline: '2024-01-15T00:00:00Z',
                created_at: '2024-01-01T00:00:00Z',
                participants: [
                    { profile_id: 'user-123', is_owner: true },
                    { profile_id: 'user-456', is_owner: false }
                ]
            },
            {
                id: 'task-2',
                title: 'Task 2',
                description: 'Second task',
                project_id: 'project-123',
                parent_task_id: null,
                status: 'Completed',
                priority: 3,
                deadline: '2024-01-20T00:00:00Z',
                created_at: '2024-01-05T00:00:00Z',
                participants: [
                    { profile_id: 'user-456', is_owner: true }
                ]
            },
            {
                id: 'subtask-1',
                title: 'Subtask 1',
                description: 'A subtask',
                project_id: 'project-123',
                parent_task_id: 'task-1',
                status: 'Under Review',
                priority: 2,
                deadline: '2024-01-12T00:00:00Z',
                created_at: '2024-01-03T00:00:00Z',
                participants: [
                    { profile_id: 'user-123', is_owner: true }
                ]
            }
        ];

        test('Should fetch all tasks for a project without date filter', async () => {
            axios.get.mockResolvedValue({ data: mockProjectTasks });

            const result = await fetchTasksForProject('project-123');

            expect(axios.get).toHaveBeenCalledWith(
                'http://localhost:3031/task/project/project-123?startDate=undefined&endDate=undefined'
            );
            expect(result).toEqual(mockProjectTasks);
            expect(result).toHaveLength(3);
        });

        test('Should fetch tasks for a project with date filter', async () => {
            axios.get.mockResolvedValue({ data: mockProjectTasks });

            const result = await fetchTasksForProject('project-123', '2024-01-01', '2024-01-31');

            expect(axios.get).toHaveBeenCalledWith(
                'http://localhost:3031/task/project/project-123?startDate=2024-01-01&endDate=2024-01-31'
            );
            expect(result).toEqual(mockProjectTasks);
        });

        test('Should include tasks with participants array', async () => {
            axios.get.mockResolvedValue({ data: mockProjectTasks });

            const result = await fetchTasksForProject('project-123', '2024-01-01', '2024-01-31');

            expect(result[0].participants).toHaveLength(2);
            expect(result[0].participants[0].is_owner).toBe(true);
            expect(result[1].participants).toHaveLength(1);
        });

        test('Should include subtasks with parent_task_id', async () => {
            axios.get.mockResolvedValue({ data: mockProjectTasks });

            const result = await fetchTasksForProject('project-123', '2024-01-01', '2024-01-31');

            const subtask = result.find(t => t.id === 'subtask-1');
            expect(subtask.parent_task_id).toBe('task-1');
        });

        test('Should throw NotFoundError when no tasks found', async () => {
            axios.get.mockResolvedValue({ data: [] });

            await expect(fetchTasksForProject('project-123', '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow(NotFoundError);

            await expect(fetchTasksForProject('project-123', '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow('No tasks found for the specified project and date range');
        });

        test('Should throw NotFoundError when tasks is null', async () => {
            axios.get.mockResolvedValue({ data: null });

            await expect(fetchTasksForProject('project-123', '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow(NotFoundError);
        });

        test('Should throw ServiceUnavailableError when task service is down', async () => {
            const axiosError = new Error('Service unavailable');
            axios.get.mockRejectedValue(axiosError);

            await expect(fetchTasksForProject('project-123', '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow(ServiceUnavailableError);

            await expect(fetchTasksForProject('project-123', '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow('Task Service is currently unavailable');
        });

        test('Should handle tasks with no participants', async () => {
            const tasksWithNoParticipants = [{
                id: 'task-unassigned',
                title: 'Unassigned Task',
                project_id: 'project-123',
                status: 'Unassigned',
                participants: [],
                created_at: '2024-01-10T00:00:00Z'
            }];

            axios.get.mockResolvedValue({ data: tasksWithNoParticipants });

            const result = await fetchTasksForProject('project-123', '2024-01-01', '2024-01-31');

            expect(result[0].participants).toEqual([]);
        });
    });

    describe('fetchProfileDetails', () => {
        const mockProfiles = {
            'user-123': {
                id: 'user-123',
                display_name: 'John Doe',
                email: 'john@example.com',
                department_name: 'Engineering'
            },
            'user-456': {
                id: 'user-456',
                display_name: 'Jane Smith',
                email: 'jane@example.com',
                department_name: 'Design'
            }
        };

        test('Should fetch profile details for multiple users', async () => {
            axios.get
                .mockResolvedValueOnce({ data: mockProfiles['user-123'] })
                .mockResolvedValueOnce({ data: mockProfiles['user-456'] });

            const result = await fetchProfileDetails(['user-123', 'user-456']);

            expect(axios.get).toHaveBeenCalledTimes(2);
            expect(axios.get).toHaveBeenCalledWith('http://localhost:3030/user/user-123');
            expect(axios.get).toHaveBeenCalledWith('http://localhost:3030/user/user-456');

            expect(result).toEqual({
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
            });
        });

        test('Should handle empty profile IDs array', async () => {
            const result = await fetchProfileDetails([]);

            expect(axios.get).not.toHaveBeenCalled();
            expect(result).toEqual({});
        });

        test('Should use fallback field names (name instead of display_name)', async () => {
            const profileWithOldFields = {
                id: 'user-789',
                name: 'Bob Johnson',
                email: 'bob@example.com',
                dept: 'Marketing'
            };

            axios.get.mockResolvedValue({ data: profileWithOldFields });

            const result = await fetchProfileDetails(['user-789']);

            expect(result).toEqual({
                'user-789': {
                    name: 'Bob Johnson',
                    email: 'bob@example.com',
                    dept: 'Marketing'
                }
            });
        });

        test('Should handle profiles with missing fields', async () => {
            const incompleteProfile = {
                id: 'user-999',
                display_name: 'Alice Brown'
                // Missing email and department_name
            };

            axios.get.mockResolvedValue({ data: incompleteProfile });

            const result = await fetchProfileDetails(['user-999']);

            expect(result).toEqual({
                'user-999': {
                    name: 'Alice Brown',
                    email: null,
                    dept: null
                }
            });
        });

        test('Should handle profile service errors gracefully', async () => {
            axios.get
                .mockResolvedValueOnce({ data: mockProfiles['user-123'] })
                .mockRejectedValueOnce(new Error('Profile not found'))
                .mockResolvedValueOnce({ data: mockProfiles['user-456'] });

            const result = await fetchProfileDetails(['user-123', 'user-404', 'user-456']);

            expect(result).toEqual({
                'user-123': {
                    name: 'John Doe',
                    email: 'john@example.com',
                    dept: 'Engineering'
                },
                'user-404': {
                    name: 'Unknown User',
                    email: null,
                    dept: null
                },
                'user-456': {
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    dept: 'Design'
                }
            });
        });

        test('Should handle all profile requests failing', async () => {
            axios.get.mockRejectedValue(new Error('Service unavailable'));

            const result = await fetchProfileDetails(['user-123', 'user-456']);

            expect(result).toEqual({
                'user-123': {
                    name: 'Unknown User',
                    email: null,
                    dept: null
                },
                'user-456': {
                    name: 'Unknown User',
                    email: null,
                    dept: null
                }
            });
        });

        test('Should handle profile with no display_name or name', async () => {
            const noNameProfile = {
                id: 'user-888',
                email: 'noname@example.com',
                department_name: 'Operations'
            };

            axios.get.mockResolvedValue({ data: noNameProfile });

            const result = await fetchProfileDetails(['user-888']);

            expect(result).toEqual({
                'user-888': {
                    name: 'Unknown User',
                    email: 'noname@example.com',
                    dept: 'Operations'
                }
            });
        });

        test('Should log errors when profile fetch fails', async () => {
            const error = new Error('Network error');
            axios.get.mockRejectedValue(error);

            await fetchProfileDetails(['user-123']);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to fetch profile for user-123:',
                'Network error'
            );
        });
    });
    
});
