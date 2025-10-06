const TaskController = require('../../controller/TaskController');
const Task = require('../../model/Task');
const Subtask = require('../../model/Subtask');
const TaskService = require('../../service/TaskService');
const { TaskNotFoundError, ValidationError, DatabaseError } = require('../../model/TaskError');

jest.mock('../../model/Task');
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
                error: validationError.message,
                details: validationError.errors,
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
    });

    describe('getAllTasks', () => {
        test('Should retrieve all tasks successfully', async () => {
            const mockTasks = [
                { id: 'task-1', title: 'Task 1' },
                { id: 'task-2', title: 'Task 2' },
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
    });

    describe('getTaskDetail', () => {
        test('Should retrieve task details successfully', async () => {
            const mockTaskDetail = {
                id: 'task-123',
                title: 'Test Task',
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
    });

    describe('getSubTasks', () => {
        test('Should retrieve subtasks successfully', async () => {
            const mockSubtasks = [
                { id: 'subtask-1', parent_task_id: 'task-123' },
                { id: 'subtask-2', parent_task_id: 'task-123' },
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
    });

    describe('getTaskPerUser', () => {
        test('Should retrieve tasks by userId from params', async () => {
            const mockTasks = [
                { id: 'task-1', participants: [{ profile_id: 'user-1' }] },
            ];

            req.params.userId = 'user-1';

            Task.getTasksByUsers.mockResolvedValue(mockTasks);

            await TaskController.getTaskPerUser(req, res);

            expect(Task.getTasksByUsers).toHaveBeenCalledWith('user-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTasks);
        });

        test('Should retrieve tasks using req.body when params.userId is missing', async () => {
            const mockTasks = [
                { id: 'task-1', participants: [{ profile_id: 'user-2' }] },
            ];

            req.body = { userId: 'user-2' };
            // params.userId is undefined

            Task.getTasksByUsers.mockResolvedValue(mockTasks);

            await TaskController.getTaskPerUser(req, res);

            expect(Task.getTasksByUsers).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTasks);
        });

        test('Should return 500 on DatabaseError', async () => {
            const dbError = new DatabaseError('Failed to retrieve tasks by user');

            req.params.userId = 'user-1';

            Task.getTasksByUsers.mockRejectedValue(dbError);

            await TaskController.getTaskPerUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: dbError.message });
        });
    });

    // describe('updateTask', () => {
    //     test('Should update task successfully and return 201', async () => {
    //         req.body = {
    //             id: 'task-123',
    //             title: 'Updated Task',
    //             description: 'Updated description',
    //         };

    //         Task.mockImplementation(() => ({
    //             updateTask: jest.fn().mockResolvedValue(undefined),
    //         }));

    //         await TaskController.updateTask(req, res);

    //         expect(Task).toHaveBeenCalledWith(req.body);
    //         expect(res.status).toHaveBeenCalledWith(201);
    //         expect(res.json).toHaveBeenCalledWith({ 
    //             message: "Successfully created task and task participants" 
    //         });
    //     });

    //     test('Should return 500 on DatabaseError', async () => {
    //         const dbError = new DatabaseError('Failed to update task');

    //         req.body = { id: 'task-123', title: 'Updated Task' };

    //         Task.mockImplementation(() => ({
    //             updateTask: jest.fn().mockRejectedValue(dbError),
    //         }));

    //         await TaskController.updateTask(req, res);

    //         expect(res.status).toHaveBeenCalledWith(500);
    //         expect(res.json).toHaveBeenCalledWith({ error: dbError.message });
    //     });
    // });

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
    });
});
