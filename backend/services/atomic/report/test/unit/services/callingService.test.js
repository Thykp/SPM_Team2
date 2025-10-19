const { fetchTasksForUser, getProjectDetails } = require('../../../services/callingService');
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
                updated_at: '2024-01-12T10:00:00Z',
                participants: [
                    { profile_id: 'user-123', is_owner: false },
                    { profile_id: 'user-789', is_owner: true }
                ]
            }
        ];

        test('Should fetch and normalize tasks for user successfully', async () => {
            axios.get.mockResolvedValue({ data: mockTaskResponse });

            const result = await fetchTasksForUser('user-123', '2024-01-01', '2024-01-31');

            expect(axios.get).toHaveBeenCalledWith(
                'http://localhost:3031/task/users/user-123?startDate=2024-01-01&endDate=2024-01-31'
            );

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'task-123',
                title: 'Test Task 1',
                status: 'Ongoing',
                role: 'Owner', // user-123 is owner
                deadline: '2024-01-15T10:00:00Z',
                priority: 5,
                projectId: 'project-456',
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
                updatedAt: '2024-01-12T10:00:00Z'
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
    
});
