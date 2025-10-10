const Subtask = require('../../model/Subtask');
const Task = require('../../model/Task');
const { ValidationError, DatabaseError } = require('../../model/TaskError');
const { supabase } = require('../../db/supabase');

jest.mock('../../db/supabase');

describe('Subtask', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('Constructor', () => {
        test('Should create subtask with parent_task_id', () => {
            const subtaskData = {
                title: 'Test Subtask',
                project_id: 'project-123',
                parent_task_id: 'parent-task-123',
                deadline: '2025-12-31',
                description: 'Test description',
                status: 'ongoing',
                participants: [{ profile_id: 'user-1', is_owner: true }],
                priority: 5
            };

            const subtask = new Subtask(subtaskData);

            expect(subtask.title).toBe('Test Subtask');
            expect(subtask.parent_task_id).toBe('parent-task-123');
            expect(subtask.status).toBe('Ongoing');
        });

        test('Should inherit Task properties', () => {
            const subtask = new Subtask({
                title: 'Subtask',
                project_id: 'project-123',
                parent_task_id: 'parent-123',
                deadline: '2025-12-31',
                description: 'Test',
                status: 'completed',
                participants: [],
                priority: 5
            });

            expect(subtask).toBeInstanceOf(Task);
            expect(subtask.status).toBe('Completed');
        });
    });

    describe('validateSubtaskParticipants()', () => {
        test('Should validate when subtask participants are subset of parent', async () => {
            const mockParentParticipants = [
                { profile_id: 'user-1' },
                { profile_id: 'user-2' },
                { profile_id: 'user-3' }
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: mockParentParticipants,
                        error: null
                    })
                })
            });

            const subtaskParticipants = [
                { profile_id: 'user-1', is_owner: false },
                { profile_id: 'user-2', is_owner: false }
            ];

            const result = await Subtask.validateSubtaskParticipants(
                subtaskParticipants,
                'parent-task-123'
            );

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        test('Should invalidate when subtask has participants not in parent', async () => {
            const mockParentParticipants = [
                { profile_id: 'user-1' },
                { profile_id: 'user-2' }
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: mockParentParticipants,
                        error: null
                    })
                })
            });

            const subtaskParticipants = [
                { profile_id: 'user-1', is_owner: false },
                { profile_id: 'user-3', is_owner: false },
                { profile_id: 'user-4', is_owner: false }
            ];

            const result = await Subtask.validateSubtaskParticipants(
                subtaskParticipants,
                'parent-task-123'
            );

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('user-3');
            expect(result.errors[0]).toContain('user-4');
        });

        test('Should validate when subtask has empty participants', async () => {
            const mockParentParticipants = [
                { profile_id: 'user-1' }
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: mockParentParticipants,
                        error: null
                    })
                })
            });

            const result = await Subtask.validateSubtaskParticipants(
                [],
                'parent-task-123'
            );

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        test('Should throw DatabaseError when query fails', async () => {
            const mockError = { message: 'Query failed' };

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: null,
                        error: mockError
                    })
                })
            });

            try {
                await Subtask.validateSubtaskParticipants(
                    [{ profile_id: 'user-1', is_owner: false }],
                    'parent-task-123'
                );
                fail('Should have thrown DatabaseError');
            } catch (error) {
                expect(error).toBeInstanceOf(DatabaseError);
                expect(error.message).toContain('Failed to retrieve parent task participants');
            }
        });

        test('Should handle all participants being invalid', async () => {
            const mockParentParticipants = [
                { profile_id: 'user-1' }
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: mockParentParticipants,
                        error: null
                    })
                })
            });

            const subtaskParticipants = [
                { profile_id: 'user-2', is_owner: false },
                { profile_id: 'user-3', is_owner: false }
            ];

            const result = await Subtask.validateSubtaskParticipants(
                subtaskParticipants,
                'parent-task-123'
            );

            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('user-2, user-3');
        });
    });

    describe('getSubTasksOfParent()', () => {
        test('Should retrieve subtasks successfully', async () => {
            const mockSubtasks = [
                {
                    id: 'subtask-1',
                    title: 'Subtask 1',
                    parent_task_id: 'parent-123',
                    status: 'Ongoing',
                    priority: 5
                },
                {
                    id: 'subtask-2',
                    title: 'Subtask 2',
                    parent_task_id: 'parent-123',
                    status: 'Completed',
                    priority: 5
                }
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: mockSubtasks,
                        error: null
                    })
                })
            });

            const result = await Subtask.getSubTasksOfParent('parent-123');

            expect(result).toEqual(mockSubtasks);
            expect(result).toHaveLength(2);
            expect(supabase.from).toHaveBeenCalledWith('revamped_task');
        });

        test('Should return empty array when no subtasks found', async () => {
            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: [],
                        error: null
                    })
                })
            });

            const result = await Subtask.getSubTasksOfParent('parent-123');

            expect(result).toEqual([]);
        });

        test('Should return empty array when data is null', async () => {
            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                    })
                })
            });

            const result = await Subtask.getSubTasksOfParent('parent-123');

            expect(result).toEqual([]);
        });

        test('Should throw DatabaseError on query failure', async () => {
            const mockError = { message: 'Database error' };

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: null,
                        error: mockError
                    })
                })
            });

            try {
                await Subtask.getSubTasksOfParent('parent-123');
                fail('Should have thrown DatabaseError');
            } catch (error) {
                expect(error).toBeInstanceOf(DatabaseError);
                expect(error.message).toContain('Failed to retrieve subtasks');
            }
        });
    });

    describe('validate()', () => {
        test('Should throw ValidationError when subtask participants are not subset of parent', async () => {
            const mockParentParticipants = [
                { profile_id: 'user-1' },
                { profile_id: 'user-2' }
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: mockParentParticipants,
                        error: null
                    })
                })
            });

            const subtask = new Subtask({
                title: 'Test Subtask',
                project_id: 'project-123',
                parent_task_id: 'parent-123',
                deadline: '2025-12-31',
                description: 'Test description',
                status: 'ongoing',
                participants: [
                    { profile_id: 'user-1', is_owner: true },
                    { profile_id: 'user-999', is_owner: false }
                ],
                priority: 5
            });

            try {
                await subtask.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors[0]).toContain('user-999');
                expect(error.errors[0]).toContain('must be subset of parent');
            }
        });
    });
});
