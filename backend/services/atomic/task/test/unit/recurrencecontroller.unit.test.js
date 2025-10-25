const RecurrenceController = require('../../controller/RecurrenceController');
const Recurrence = require('../../model/Recurrence');

jest.mock('../../model/Recurrence');

describe('RecurrenceController', () => {
    let req, res, consoleErrorSpy, consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Spy on console methods and suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

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
        consoleLogSpy.mockRestore();
    });

    describe('getRecurrenceById', () => {
        test('Should retrieve recurrence by id successfully', async () => {
            const mockRecurrence = {
                id: 'recurrence-1',
                task_id: 'task-123',
                frequency: 'weekly',
                interval: 1,
            };

            req.params.id = 'recurrence-1';

            Recurrence.getById.mockResolvedValue(mockRecurrence);

            await RecurrenceController.getRecurrenceById(req, res);

            expect(Recurrence.getById).toHaveBeenCalledWith('recurrence-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRecurrence);
        });

        test('Should return 500 on error', async () => {
            const error = new Error('Failed to retrieve recurrence');

            req.params.id = 'recurrence-1';

            Recurrence.getById.mockRejectedValue(error);

            await RecurrenceController.getRecurrenceById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: error.message });
        });
    });

    describe('getRecurrenceByTaskId', () => {
        test('Should retrieve recurrences by task id successfully', async () => {
            const mockRecurrences = [
                { id: 'recurrence-1', task_id: 'task-123', frequency: 'weekly' },
                { id: 'recurrence-2', task_id: 'task-123', frequency: 'daily' },
            ];

            req.params.taskId = 'task-123';

            Recurrence.getByTaskId.mockResolvedValue(mockRecurrences);

            await RecurrenceController.getRecurrenceByTaskId(req, res);

            expect(Recurrence.getByTaskId).toHaveBeenCalledWith('task-123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRecurrences);
        });

        test('Should return 500 on error', async () => {
            const error = new Error('Failed to retrieve recurrences by task');

            req.params.taskId = 'task-123';

            Recurrence.getByTaskId.mockRejectedValue(error);

            await RecurrenceController.getRecurrenceByTaskId(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: error.message });
        });
    });

    describe('createRecurrence', () => {
        test('Should create recurrence successfully and return 201', async () => {
            const mockRecurrence = {
                task_id: 'task-123',
                frequency: 'weekly',
                interval: 1,
                create: jest.fn().mockResolvedValue(undefined),
            };

            req.body = {
                task_id: 'task-123',
                frequency: 'weekly',
                interval: 1,
            };

            Recurrence.mockImplementation(() => mockRecurrence);

            await RecurrenceController.createRecurrence(req, res);

            expect(Recurrence).toHaveBeenCalledWith(req.body);
            expect(mockRecurrence.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockRecurrence);
        });

        test('Should return 500 on error', async () => {
            const error = new Error('Failed to create recurrence');

            const mockRecurrence = {
                create: jest.fn().mockRejectedValue(error),
            };

            req.body = {
                task_id: 'task-123',
                frequency: 'weekly',
            };

            Recurrence.mockImplementation(() => mockRecurrence);

            await RecurrenceController.createRecurrence(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: error.message });
        });
    });

    describe('updateRecurrence', () => {
        test('Should update recurrence successfully and return 200', async () => {
            const mockRecurrence = {
                id: 'recurrence-1',
                frequency: 'daily',
                interval: 2,
                update: jest.fn().mockResolvedValue(undefined),
            };

            req.params.id = 'recurrence-1';
            req.body = {
                frequency: 'daily',
                interval: 2,
            };

            Recurrence.mockImplementation(() => mockRecurrence);

            await RecurrenceController.updateRecurrence(req, res);

            expect(Recurrence).toHaveBeenCalledWith({ id: 'recurrence-1', ...req.body });
            expect(mockRecurrence.update).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRecurrence);
        });

        test('Should return 500 on error', async () => {
            const error = new Error('Failed to update recurrence');

            const mockRecurrence = {
                update: jest.fn().mockRejectedValue(error),
            };

            req.params.id = 'recurrence-1';
            req.body = {
                frequency: 'daily',
            };

            Recurrence.mockImplementation(() => mockRecurrence);

            await RecurrenceController.updateRecurrence(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: error.message });
        });
    });

    describe('deleteRecurrence', () => {
        test('Should delete recurrence successfully and return 200', async () => {
            const mockRecurrence = {
                delete: jest.fn().mockResolvedValue(undefined),
            };

            req.params.id = 'recurrence-1';

            Recurrence.mockImplementation(() => mockRecurrence);

            await RecurrenceController.deleteRecurrence(req, res);

            expect(Recurrence).toHaveBeenCalledWith({ id: 'recurrence-1' });
            expect(mockRecurrence.delete).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Recurrence deleted successfully" 
            });
        });

        test('Should return 500 on error', async () => {
            const error = new Error('Failed to delete recurrence');

            const mockRecurrence = {
                delete: jest.fn().mockRejectedValue(error),
            };

            req.params.id = 'recurrence-1';

            Recurrence.mockImplementation(() => mockRecurrence);

            await RecurrenceController.deleteRecurrence(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: error.message });
        });
    });
});

