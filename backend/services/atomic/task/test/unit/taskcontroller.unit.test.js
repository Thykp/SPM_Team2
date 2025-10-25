const TaskController = require('../../controller/TaskController');
const Task = require('../../model/task');
const Subtask = require('../../model/Subtask');
const TaskService = require('../../service/TaskService');
const { TaskNotFoundError, ValidationError, DatabaseError } = require('../../model/TaskError');

jest.mock('../../model/task');
jest.mock('../../model/Subtask');
jest.mock('../../service/TaskService');

describe('TaskController', () => {
    let req, res, consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Spy on console.error and suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock request and response objects
        req = {
            params: {},
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('taskServiceHealthCheck', () => {
        test('Should return 200 with success message', async () => {
            await TaskController.taskServiceHealthCheck(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith('Health Check: Success!');
        });

        test('Should return 500 on generic error', async () => {
            const error = new Error('Unexpected error');
            
            // Force an error by making res.status throw
            res.status.mockImplementationOnce(() => {
                throw error;
            });

            await TaskController.taskServiceHealthCheck(req, res);

            expect(res.json).toHaveBeenCalledWith({ error: error.message });
        });
    });

    describe('addTask', () => {
        test('Should create task successfully and return 200', async () => {
            const mockTask = {
                validate: jest.fn().mockResolvedValue(true),
                createTask: jest.fn().mockResolvedValue(undefined),
            };

            TaskService.checkTask.mockReturnValue(mockTask);

            req.body = {
                title: 'Test Task',
                description: 'Test description',
                deadline: '2025-12-31',
                status: 'ongoing',
            };

            await TaskController.addTask(req, res);

            expect(TaskService.checkTask).toHaveBeenCalledWith(req.body);
            expect(mockTask.validate).toHaveBeenCalled();
            expect(mockTask.createTask).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Successfully created task and task participants" 
            });
        });

        test('Should return 400 on ValidationError', async () => {
            const validationError = new ValidationError(['Title is required']);
            const mockTask = {
                validate: jest.fn().mockRejectedValue(validationError),
                createTask: jest.fn(),
            };

            TaskService.checkTask.mockReturnValue(mockTask);

            await TaskController.addTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: validationError.message
            });
        });

        test('Should return 500 on DatabaseError', async () => {
            const dbError = new DatabaseError('Database connection failed');
            const mockTask = {
                validate: jest.fn().mockResolvedValue(true),
                createTask: jest.fn().mockRejectedValue(dbError),
            };

            TaskService.checkTask.mockReturnValue(mockTask);

            await TaskController.addTask(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: dbError.message });
        });

        test('Should return 500 on generic error', async () => {
            const genericError = new Error('Some unexpected error');
            const mockTask = {
                validate: jest.fn().mockResolvedValue(true),
                createTask: jest.fn().mockRejectedValue(genericError),
            };

            TaskService.checkTask.mockReturnValue(mockTask);

            await TaskController.addTask(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: genericError.message });
        });
    });

    describe('getAllTasks', () => {
        test('Should retrieve all tasks successfully', async () => {
			const mockTasks = [
				{ id: 'task-1', title: 'Task 1', priority: 5 },
				{ id: 'task-2', title: 'Task 2', priority: 5 },
			];

            Task.getAllTasks.mockResolvedValue(mockTasks);

            await TaskController.getAllTasks(req, res);

            expect(Task.getAllTasks).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTasks);
        });

        test('Should return 500 on DatabaseError', async () => {
            const dbError = new DatabaseError('Failed to retrieve tasks');

            Task.getAllTasks.mockRejectedValue(dbError);

            await TaskController.getAllTasks(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: dbError.message });
        });

        test('Should return 500 on generic error', async () => {
            const genericError = new Error('Unexpected error');

            Task.getAllTasks.mockRejectedValue(genericError);

            await TaskController.getAllTasks(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: genericError.message });
        });
    });

    describe('getTaskDetail', () => {
        test('Should retrieve task details successfully', async () => {
            const mockTaskDetail = {
                id: 'task-123',
                title: 'Test Task',
                priority: 5,
                participants: [],
            };

            req.params.id = 'task-123';

            Task.mockImplementation(() => ({
                getTaskDetails: jest.fn().mockResolvedValue(mockTaskDetail),
            }));

            await TaskController.getTaskDetail(req, res);

            expect(Task).toHaveBeenCalledWith({ id: 'task-123' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTaskDetail);
        });

        test('Should return 404 on TaskNotFoundError', async () => {
            const notFoundError = new TaskNotFoundError('Task not found');

            req.params.id = 'non-existent';

            Task.mockImplementation(() => ({
                getTaskDetails: jest.fn().mockRejectedValue(notFoundError),
            }));

            await TaskController.getTaskDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: notFoundError.message });
        });

        test('Should return 500 on DatabaseError', async () => {
            const dbError = new DatabaseError('Database query failed');

            req.params.id = 'task-123';

            Task.mockImplementation(() => ({
                getTaskDetails: jest.fn().mockRejectedValue(dbError),
            }));

            await TaskController.getTaskDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: dbError.message });
        });

        test('Should return 500 on generic error', async () => {
            const genericError = new Error('Unexpected error');

            req.params.id = 'task-123';

            Task.mockImplementation(() => ({
                getTaskDetails: jest.fn().mockRejectedValue(genericError),
            }));

            await TaskController.getTaskDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: genericError.message });
        });
    });

    describe('getSubTasks', () => {
        test('Should retrieve subtasks successfully', async () => {
			const mockSubtasks = [
				{ id: 'subtask-1', parent_task_id: 'task-123', priority: 5 },
				{ id: 'subtask-2', parent_task_id: 'task-123', priority: 5 },
			];

            req.params.id = 'task-123';

            Subtask.getSubTasksOfParent.mockResolvedValue(mockSubtasks);

            await TaskController.getSubTasks(req, res);

            expect(Subtask.getSubTasksOfParent).toHaveBeenCalledWith('task-123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockSubtasks);
        });

        test('Should return 500 on DatabaseError', async () => {
            const dbError = new DatabaseError('Failed to retrieve subtasks');

            req.params.id = 'task-123';

            Subtask.getSubTasksOfParent.mockRejectedValue(dbError);

            await TaskController.getSubTasks(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: dbError.message });
        });

        test('Should return 500 on generic error', async () => {
            const genericError = new Error('Unexpected error');

            req.params.id = 'task-123';

            Subtask.getSubTasksOfParent.mockRejectedValue(genericError);

            await TaskController.getSubTasks(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: genericError.message });
        });
    });

    describe('getTaskPerUser', () => {

        test('Should retrieve tasks by userId from params (no dates)', async () => {
            const mockTasks = [
                { id: 'task-1', priority: 5, participants: [{ profile_id: 'user-1' }] },
            ];
            req.params.userId = 'user-1';
            req.query = {};
            Task.getTasksByUsers.mockResolvedValue(mockTasks);
            await TaskController.getTaskPerUser(req, res);
            expect(Task.getTasksByUsers).toHaveBeenCalledWith('user-1', undefined, undefined);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTasks);
        });

        test('Should retrieve tasks by userId from params with startDate and endDate', async () => {
            const mockTasks = [
                { id: 'task-1', priority: 5, participants: [{ profile_id: 'user-1' }] },
            ];
            req.params.userId = 'user-1';
            req.query = { startDate: '2025-01-01', endDate: '2025-12-31' };
            Task.getTasksByUsers.mockResolvedValue(mockTasks);
            await TaskController.getTaskPerUser(req, res);
            expect(Task.getTasksByUsers).toHaveBeenCalledWith('user-1', '2025-01-01', '2025-12-31');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTasks);
        });

        test('Should retrieve tasks by userId from body when not in params', async () => {
            const mockTasks = [
                { id: 'task-1', priority: 5, participants: [{ profile_id: 'user-2' }] },
            ];
            req.params = {}; // No userId in params
            req.body = 'user-2'; // userId in body
            req.query = {};
            Task.getTasksByUsers.mockResolvedValue(mockTasks);
            await TaskController.getTaskPerUser(req, res);
            expect(Task.getTasksByUsers).toHaveBeenCalledWith('user-2', undefined, undefined);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTasks);
        });

        test('Should return 500 on DatabaseError', async () => {
            const dbError = new DatabaseError('Failed to retrieve tasks by user');
            req.params.userId = 'user-1';
            req.query = {};
            Task.getTasksByUsers.mockRejectedValue(dbError);
            await TaskController.getTaskPerUser(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: dbError.message });
        });

        test('Should return 500 on generic error', async () => {
            const genericError = new Error('Unexpected error');
            req.params.userId = 'user-1';
            req.query = {};
            Task.getTasksByUsers.mockRejectedValue(genericError);
            await TaskController.getTaskPerUser(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: genericError.message });
        });
    });

    describe('getTasksByProject', () => {

        test('Should retrieve tasks by projectId from params (no dates)', async () => {
            const mockTasks = [
                { id: 'task-1', priority: 5, project_id: 'project-1' },
                { id: 'task-2', priority: 3, project_id: 'project-1' },
            ];
            req.params.projectId = 'project-1';
            req.query = {};
            Task.getTasksByProject.mockResolvedValue(mockTasks);
            await TaskController.getTasksByProject(req, res);
            expect(Task.getTasksByProject).toHaveBeenCalledWith('project-1', undefined, undefined);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTasks);
        });

        test('Should retrieve tasks by projectId from params with startDate and endDate', async () => {
            const mockTasks = [
                { id: 'task-1', priority: 5, project_id: 'project-1' },
            ];
            req.params.projectId = 'project-1';
            req.query = { startDate: '2025-01-01', endDate: '2025-12-31' };
            Task.getTasksByProject.mockResolvedValue(mockTasks);
            await TaskController.getTasksByProject(req, res);
            expect(Task.getTasksByProject).toHaveBeenCalledWith('project-1', '2025-01-01', '2025-12-31');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTasks);
        });

        test('Should return 500 on DatabaseError', async () => {
            const dbError = new DatabaseError('Failed to retrieve tasks by project');
            req.params.projectId = 'project-1';
            req.query = {};
            Task.getTasksByProject.mockRejectedValue(dbError);
            await TaskController.getTasksByProject(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: dbError.message });
        });

        test('Should return 500 on generic error', async () => {
            const genericError = new Error('Unexpected error');
            req.params.projectId = 'project-1';
            req.query = {};
            Task.getTasksByProject.mockRejectedValue(genericError);
            await TaskController.getTasksByProject(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: genericError.message });
        });
    });

    describe('updateTask', () => {
        test('Should update task successfully and return 200', async () => {
            req.params = {id: 'task-123'};
            req.body = {
                title: 'Updated Task',
                description: 'Updated description',
                priority: 5,
            };

            const mockTask = {
                validate: jest.fn().mockResolvedValue(undefined),
                updateTask: jest.fn().mockResolvedValue(undefined),
            };

            TaskService.checkTask.mockReturnValue(mockTask);

            await TaskController.updateTask(req, res);

            expect(TaskService.checkTask).toHaveBeenCalledWith({
                id: 'task-123',
                title: 'Updated Task',
                description: 'Updated description',
                priority: 5
            });
            expect(mockTask.validate).toHaveBeenCalled();
            expect(mockTask.updateTask).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Successfully updated task and task participants" 
            });
        });

        test('Should return 400 on ValidationError', async () => {
            const validationError = new ValidationError(['Title cannot be empty']);

            req.params = {id: 'task-123'};
            req.body = {title: '' };

            const mockTask = {
                validate: jest.fn().mockRejectedValue(validationError),
                updateTask: jest.fn(),
            };

            // Mock res.set to return res for chaining
            res.set = jest.fn().mockReturnThis();

            TaskService.checkTask.mockReturnValue(mockTask);

            await TaskController.updateTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/json');
            expect(res.json).toHaveBeenCalledWith({ error: validationError.message });
        });

        test('Should return 500 on DatabaseError', async () => {
            const dbError = new DatabaseError('Failed to update task');

            req.params = {id: 'task-123'};
            req.body = {title: 'Updated Task' };

            const mockTask = {
                validate: jest.fn().mockResolvedValue(undefined),
                updateTask: jest.fn().mockRejectedValue(dbError),
            };

            TaskService.checkTask.mockReturnValue(mockTask);

            await TaskController.updateTask(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: dbError.message });
        });

        test('Should return 500 on generic error', async () => {
            const genericError = new Error('Unexpected error');

            req.params = {id: 'task-123'};
            req.body = {title: 'Updated Task' };

            const mockTask = {
                validate: jest.fn().mockResolvedValue(undefined),
                updateTask: jest.fn().mockRejectedValue(genericError),
            };

            TaskService.checkTask.mockReturnValue(mockTask);

            await TaskController.updateTask(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: genericError.message });
        });
    });

    describe('deleteTask', () => {
        test('Should delete task successfully and return 200', async () => {
            req.params.taskId = 'task-123';

            Task.mockImplementation(() => ({
                deleteTask: jest.fn().mockResolvedValue(undefined),
            }));

            await TaskController.deleteTask(req, res);

            expect(Task).toHaveBeenCalledWith({ id: 'task-123' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Successfully deleted task" 
            });
        });

        test('Should return 500 on DatabaseError', async () => {
            const dbError = new DatabaseError('Failed to delete task');

            req.params.taskId = 'task-123';

            Task.mockImplementation(() => ({
                deleteTask: jest.fn().mockRejectedValue(dbError),
            }));

            await TaskController.deleteTask(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: dbError.message });
        });

        test('Should return 500 on generic error', async () => {
            const genericError = new Error('Unexpected error');

            req.params.taskId = 'task-123';

            Task.mockImplementation(() => ({
                deleteTask: jest.fn().mockRejectedValue(genericError),
            }));

            await TaskController.deleteTask(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: genericError.message });
        });
    });
});
