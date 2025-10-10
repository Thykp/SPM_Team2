const { supabase } = require("../../db/supabase");
const Task = require("../../model/Task");
const { TaskNotFoundError, ValidationError, DatabaseError } = require("../../model/TaskError");

jest.mock("../../db/supabase");

describe('Task Class Test', () => {
    beforeEach(()=>{
        jest.clearAllMocks();

        // spy on console.error and initialize a mockImplementation to do nothing
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('constructor',()=>{
        test('Should create task given valid data', ()=>{
            const sampleTaskData = {
                id: 'task-123',
                parent_task_id: null,
                project_id: 'project-456',
                title: 'Test Task',
                deadline: '2025-12-31',
                description: 'Test description',
                status: 'pending',
                participants: [{ profile_id: 'user-1', is_owner: true }],
                priority: 5
            };

            const testTask = new Task(sampleTaskData);

            expect(testTask.id).toBe('task-123');
            expect(testTask.parent_task_id).toBe(null);
            expect(testTask.project_id).toBe('project-456');
            expect(testTask.title).toBe('Test Task');
            expect(testTask.deadline).toBe('2025-12-31');
            expect(testTask.description).toBe('Test description');
            expect(testTask.status).toBe('Ongoing');
            expect(testTask.participants).toHaveLength(1);
            expect(testTask.priority).toBe(5);
        });

        test('Should normalize task status',()=>{
            const task1 = new Task({status:"ONGOING", priority: 5});
            const task2 = new Task({status:"UNDER review", priority: 5});
            const task3 = new Task({status:"completed", priority: 5});
            const task4 = new Task({status:"oVerDUe", priority: 5});

            expect(task1.status).toBe("Ongoing");
            expect(task2.status).toBe("Under Review");
            expect(task3.status).toBe("Completed");
            expect(task4.status).toBe("Overdue");
        });
    });

    describe('validate()',()=>{
        test('Should throw validation error if priority is missing or invalid', async ()=>{
            // Missing priority
            const missingPriority = {
                id: 'task-123',
                parent_task_id: null,
                project_id: 'project-456',
                title: 'Test Task',
                deadline: '2025-12-31',
                description: 'Test description',
                status: 'pending',
                participants: [{ profile_id: 'user-1', is_owner: true }]
            };
            try {
                const testTask = new Task(missingPriority);
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("Priority is required and must be a number from 1 to 10");
            }

            // Invalid priority (not a number)
            const invalidPriorityType = {
                ...missingPriority,
                priority: 'high'
            };
            try {
                const testTask = new Task(invalidPriorityType);
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("Priority is required and must be a number from 1 to 10");
            }

            // Invalid priority (out of range)
            const invalidPriorityLow = {
                ...missingPriority,
                priority: 0
            };
            try {
                const testTask = new Task(invalidPriorityLow);
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("Priority is required and must be a number from 1 to 10");
            }

            const invalidPriorityHigh = {
                ...missingPriority,
                priority: 11
            };
            try {
                const testTask = new Task(invalidPriorityHigh);
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("Priority is required and must be a number from 1 to 10");
            }
        });
        test('Should throw validation error if title is missing', async ()=>{
            const sampleTaskData = {
                id: 'task-123',
                parent_task_id: null,
                project_id: 'project-456',
                title: null,
                deadline: '2025-12-31',
                description: 'Test description',
                status: 'pending',
                participants: [{ profile_id: 'user-1', is_owner: true }],
                priority: 5
            };

            const testTask = new Task(sampleTaskData);

            try {
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("Title is required");
            }
        });

        test('Should throw validation error if Deadline is missing', async ()=>{
            const sampleTaskData = {
                id: 'task-123',
                parent_task_id: null,
                project_id: 'project-456',
                title: 'Test Task',
                deadline: null,
                description: 'Test description',
                status: 'pending',
                participants: [{ profile_id: 'user-1', is_owner: true }],
                priority: 5
            };

            const testTask = new Task(sampleTaskData);

            try {
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("Deadline is required");
            }
        });

        test('Should throw validation error if Description is missing', async ()=>{
            const sampleTaskData = {
                id: 'task-123',
                parent_task_id: null,
                project_id: 'project-456',
                title: 'Test Task',
                deadline: '2025-12-31',
                description: null,
                status: 'pending',
                participants: [{ profile_id: 'user-1', is_owner: true }],
                priority: 5
            };

            const testTask = new Task(sampleTaskData);

            try {
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("Description is required");
            }
        });

        test('Should throw validation error if Status is missing', async ()=>{
            const sampleTaskData = {
                id: 'task-123',
                parent_task_id: null,
                project_id: 'project-456',
                title: 'Test Task',
                deadline: '2025-12-31',
                description: 'Test description',
                status: null, // Changed to null to test missing status
                participants: [{ profile_id: 'user-1', is_owner: true }],
                priority: 5
            };

            const testTask = new Task(sampleTaskData);

            try {
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("Status is required");
            }
        });

        test('Should throw validation error if Status is invalid', async ()=>{
            const sampleTaskData = {
                id: 'task-123',
                parent_task_id: null,
                project_id: 'project-456',
                title: 'Test Task',
                deadline: '2025-12-31',
                description: 'Test description',
                status: 'INVALID_STATUS', // Invalid status value
                participants: [{ profile_id: 'user-1', is_owner: true }],
                priority: 5
            };

            const testTask = new Task(sampleTaskData);

            try {
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("Status must be one of: Ongoing, Under Review, Completed, Overdue, Unassigned");
            }
        });

        test('Should throw validation error if participant is missing', async ()=>{
            const sampleTaskData = {
                id: 'task-123',
                parent_task_id: null,
                project_id: 'project-456',
                title: 'Test Task',
                deadline: '2025-12-31',
                description: 'Test description',
                status: null,
                participants: null,
                priority: 5
            };

            const testTask = new Task(sampleTaskData);

            try {
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("At least one participant is required");
            }
        });

        test('Should throw validation error if have no owner', async ()=>{
            const sampleTaskData = {
                id: 'task-123',
                parent_task_id: null,
                project_id: 'project-456',
                title: 'Test Task',
                deadline: '2025-12-31',
                description: 'Test description',
                status: 'pending',
                participants: [{ profile_id: 'user-1', is_owner: false }],
                priority: 5
            };

            const testTask = new Task(sampleTaskData);

            try {
                await testTask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain("At least one participant must be an owner");
            }
        });
    })

    describe('getAllTasks()',()=>{
        test('Should retrieve all tasks successfully', async () =>{
            const mockTasks = [
                {
                    id: 'task-123',
                    parent_task_id: null,
                    project_id: 'project-456',
                    title: 'Test Task 1',
                    deadline: '2025-12-31',
                    description: 'Test description',
                    status: 'pending',
                    participants: [{ profile_id: 'user-1', is_owner: true }],
                    priority: 5
                },
                {
                    id: 'task-456',
                    parent_task_id: null,
                    project_id: 'project-789',
                    title: 'Test Task 2',
                    deadline: '2025-12-31',
                    description: 'Test description',
                    status: 'pending',
                    participants: [{ profile_id: 'user-2', is_owner: true }],
                    priority: 5
                }
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    data: mockTasks,
                    error: null
                })
            })

            const res = await Task.getAllTasks();
            expect(res).toEqual(mockTasks);
            expect(res).toHaveLength(2);
        });

        test('Should throw DatabaseError on query', async () =>{
            const mockTasks = {message:"Database failed"};

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    data: null,
                    error: mockTasks
                })
            });

            try {
                await Task.getAllTasks();
            } catch (error) {
                expect(error).toBeInstanceOf(DatabaseError);
                expect(error.message).toContain("Failed to retrieve tasks");
            }
        });
    });

    describe('getTasksByUsers()', () => {
        test('Should retrieve tasks for a single user', async () => {
            const mockTasks = [
                { 
                    id: 'task-1', 
                    title: 'Task 1', 
                    participants: [
                        { profile_id: 'user-1' }
                    ],
                    priority: 5
                },
                { 
                    id: 'task-2', 
                    title: 'Task 2', 
                    participants: [
                        { profile_id: 'user-1' },
                        { profile_id: 'user-2' }
                    ],
                    priority: 5
                },
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    data: mockTasks,
                    error: null
                })
            });

            const result = await Task.getTasksByUsers('user-1');

            expect(result).toEqual(mockTasks);
            expect(supabase.from).toHaveBeenCalledWith('revamped_task');
        });

        test('Should handle array of user IDs', async () => {
            const mockTasks = [
                { 
                    id: 'task-1', 
                    title: 'Task 1', 
                    participants: [
                        { profile_id: 'user-1' }
                    ],
                    priority: 5
                },
                { 
                    id: 'task-2', 
                    title: 'Task 2', 
                    participants: [
                        { profile_id: 'user-1' },
                        { profile_id: 'user-2' }                        
                    ],
                    priority: 5
                },
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    data: mockTasks,
                    error: null
                })
            });

            const result = await Task.getTasksByUsers(['user-1', 'user-2']);

            expect(result).toHaveLength(2);
        });

        test('Should throw DatabaseError on query failure', async () => {
            const mockError = { message: 'Query failed' };

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    data: null,
                    error: mockError
                })
            });

            await expect(Task.getTasksByUsers('user-1'))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('getTaskDetails()', () => {
        test('Should retrieve task details successfully', async () => {
            const mockTask = {
                id: 'task-123',
                title: 'Test Task',
                participants: [{ profile_id: 'user-1', is_owner: true }],
                priority: 5
            };

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockTask,
                            error: null
                        })
                    })
                })
            });

            const task = new Task({ id: 'task-123' });
            const result = await task.getTaskDetails();
            expect(result).toEqual(mockTask);
        });

        test('Should throw TaskNotFoundError when task not found', async () => {
            const mockError = { code: 'PGRST116', message: 'Not found' };

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: mockError
                        })
                    })
                })
            });

            const task = new Task({ id: 'non-existent' });

            await expect(task.getTaskDetails())
                .rejects
                .toThrow(TaskNotFoundError);
        });

        test('Should throw DatabaseError on query failure', async () => {
            const mockError = { message: 'Database error' };

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: mockError
                        })
                    })
                })
            });

            const task = new Task({ id: 'task-123' });

            await expect(task.getTaskDetails())
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('createTask()', () => {
        test('Should create task successfully', async () => {
            const mockCreatedTask = {
                id: 'new-task-123',
                title: 'New Task',
                project_id: 'project-456',
                priority: 5
            };

            // Mock task insert
            supabase.from = jest.fn()
                .mockReturnValueOnce({
                    insert: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockCreatedTask,
                                error: null
                            })
                        })
                    })
                })
                // Mock participants insert
                .mockReturnValueOnce({
                    insert: jest.fn().mockResolvedValue({
                        data: [],
                        error: null
                    })
                });

            const task = new Task({
                title: 'New Task',
                project_id: 'project-456',
                deadline: '2025-12-31',
                description: 'Test',
                status: 'ongoing',
                participants: [{ profile_id: 'user-1', is_owner: true }],
                priority: 5
            });

            await task.createTask();

            expect(task.id).toBe('new-task-123');
        });

        test('Should throw DatabaseError on insert failure', async () => {
            const mockError = { message: 'Insert failed' };

            supabase.from = jest.fn().mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: mockError
                        })
                    })
                })
            });

            const task = new Task({
                title: 'New Task',
                project_id: 'project-456',
                deadline: '2025-12-31',
                description: 'Test',
                status: 'ongoing',
                participants: []
            });

            await expect(task.createTask())
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('updateTask()', () => {
        test('Should update task successfully', async () => {
            // Mock update, delete participants, add participants
            supabase.from = jest.fn()
                .mockReturnValueOnce({
                    update: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: null, error: null })
                    })
                })
                .mockReturnValueOnce({
                    delete: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({ data: [], error: null })
                        })
                    })
                })
                .mockReturnValueOnce({
                    insert: jest.fn().mockResolvedValue({ data: [], error: null })
                });

            const task = new Task({
                id: 'task-123',
                title: 'Updated Task',
                project_id: 'project-456',
                deadline: '2025-12-31',
                description: 'Updated',
                status: 'ongoing',
                participants: [{ profile_id: 'user-1', is_owner: true }],
                priority: 5
            });

            await expect(task.updateTask()).resolves.not.toThrow();
        });

        test('Should throw DatabaseError on update failure', async () => {
            const mockError = { message: 'Update failed' };

            supabase.from = jest.fn().mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: null,
                        error: mockError
                    })
                })
            });

            const task = new Task({
                id: 'task-123',
                title: 'Updated Task',
                project_id: 'project-456',
                deadline: '2025-12-31',
                description: 'Updated',
                status: 'ongoing',
                participants: []
            });

            await expect(task.updateTask())
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('deleteTask()', () => {
        test('Should delete task successfully', async () => {
            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: [{ id: 'task-123' }],
                            error: null
                        })
                    })
                })
            });

            const task = new Task({ id: 'task-123' });

            await expect(task.deleteTask()).resolves.not.toThrow();
        });

        test('Should throw DatabaseError on delete failure', async () => {
            const mockError = { message: 'Delete failed' };

            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: null,
                            error: mockError
                        })
                    })
                })
            });

            const task = new Task({ id: 'task-123' });

            await expect(task.deleteTask())
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('addTaskParticipants()', () => {
        test('Should add participants successfully', async () => {
            supabase.from = jest.fn().mockReturnValue({
                insert: jest.fn().mockResolvedValue({
                    data: [{ task_id: 'task-123', profile_id: 'user-1' }],
                    error: null
                })
            });

            const task = new Task({
                id: 'task-123',
                participants: [
                    { profile_id: 'user-1', is_owner: true },
                    { profile_id: 'user-2', is_owner: false }
                ]
            });

            await expect(task.addTaskParticipants()).resolves.not.toThrow();
        });

        test('Should throw DatabaseError on insert failure', async () => {
            const mockError = { message: 'Insert failed' };

            supabase.from = jest.fn().mockReturnValue({
                insert: jest.fn().mockResolvedValue({
                    data: null,
                    error: mockError
                })
            });

            const task = new Task({
                id: 'task-123',
                participants: [{ profile_id: 'user-1', is_owner: true }]
            });

            await expect(task.addTaskParticipants())
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('deleteTaskParticipants()', () => {
        test('Should delete participants successfully', async () => {
            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: [{ task_id: 'task-123', profile_id: 'user-1' }],
                            error: null
                        })
                    })
                })
            });

            const task = new Task({ id: 'task-123' });

            await expect(task.deleteTaskParticipants()).resolves.not.toThrow();
        });

        test('Should throw DatabaseError on delete failure', async () => {
            const mockError = { message: 'Delete failed' };

            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: null,
                            error: mockError
                        })
                    })
                })
            });

            const task = new Task({ id: 'task-123' });

            await expect(task.deleteTaskParticipants())
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('getTaskParticipants()', () => {
        test('Should retrieve participants successfully', async () => {
            const mockParticipants = [
                { task_id: 'task-123', profile_id: 'user-1', is_owner: true },
                { task_id: 'task-123', profile_id: 'user-2', is_owner: false }
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: mockParticipants,
                        error: null
                    })
                })
            });

            const task = new Task({ id: 'task-123' });
            const result = await task.getTaskParticipants();

            expect(result).toEqual(mockParticipants);
            expect(result).toHaveLength(2);
        });

        test('Should return empty array when no participants found', async () => {
            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: [],
                        error: null
                    })
                })
            });

            const task = new Task({ id: 'task-123' });
            const result = await task.getTaskParticipants();

            expect(result).toEqual([]);
        });

        test('Should throw DatabaseError on query failure', async () => {
            const mockError = { message: 'Query failed' };

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: null,
                        error: mockError
                    })
                })
            });

            const task = new Task({ id: 'task-123' });

            await expect(task.getTaskParticipants())
                .rejects
                .toThrow(DatabaseError);
        });
    });
});
