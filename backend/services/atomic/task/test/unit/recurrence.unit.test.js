const Recurrence = require('../../model/Recurrence');
const { ValidationError, DatabaseError } = require('../../model/TaskError');
const { supabase } = require('../../db/supabase');

jest.mock('../../db/supabase');

describe('Recurrence', () => {
    let consoleErrorSpy, consoleLogSpy;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    describe('Constructor', () => {
        test('Should create recurrence with all properties', () => {
            const recurrenceData = {
                id: 'rec-1',
                task_id: 'task-123',
                frequency: 'Week',
                interval: 2,
                next_occurrence: '2025-11-01',
                end_date: '2025-12-31',
                created_at: '2025-10-25',
                updated_at: '2025-10-25'
            };

            const recurrence = new Recurrence(recurrenceData);

            expect(recurrence.id).toBe('rec-1');
            expect(recurrence.task_id).toBe('task-123');
            expect(recurrence.frequency).toBe('Week');
            expect(recurrence.interval).toBe(2);
            expect(recurrence.next_occurrence).toBe('2025-11-01');
            expect(recurrence.end_date).toBe('2025-12-31');
        });

        test('Should create recurrence with default null values', () => {
            const recurrence = new Recurrence({});

            expect(recurrence.id).toBeNull();
            expect(recurrence.task_id).toBeNull();
            expect(recurrence.frequency).toBeNull();
            expect(recurrence.interval).toBeNull();
            expect(recurrence.next_occurrence).toBeNull();
            expect(recurrence.end_date).toBeNull();
        });
    });

    describe('validate()', () => {
        test('Should validate successfully with valid data', async () => {
            const recurrence = new Recurrence({
                task_id: 'task-123',
                frequency: 'Week',
                interval: 1
            });

            const result = await recurrence.validate();

            expect(result).toBe(true);
        });

        test('Should throw ValidationError when task_id is missing (not update)', async () => {
            const recurrence = new Recurrence({
                frequency: 'Day',
                interval: 1
            });

            try {
                await recurrence.validate(false);
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain('Task ID is required.');
            }
        });

        test('Should not require task_id when isUpdate is true', async () => {
            const recurrence = new Recurrence({
                frequency: 'Week',
                interval: 2
            });

            const result = await recurrence.validate(true);

            expect(result).toBe(true);
        });

        test('Should throw ValidationError when frequency is missing', async () => {
            const recurrence = new Recurrence({
                task_id: 'task-123',
                interval: 1
            });

            try {
                await recurrence.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain('Frequency must be one of: Day, Week, Month.');
            }
        });

        test('Should throw ValidationError when frequency is invalid', async () => {
            const recurrence = new Recurrence({
                task_id: 'task-123',
                frequency: 'Year',
                interval: 1
            });

            try {
                await recurrence.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain('Frequency must be one of: Day, Week, Month.');
            }
        });

        test('Should accept valid frequency values: Day, Week, Month', async () => {
            const frequencies = ['Day', 'Week', 'Month'];

            for (const freq of frequencies) {
                const recurrence = new Recurrence({
                    task_id: 'task-123',
                    frequency: freq,
                    interval: 1
                });

                const result = await recurrence.validate();
                expect(result).toBe(true);
            }
        });

        test('Should throw ValidationError when interval is not a number', async () => {
            const recurrence = new Recurrence({
                task_id: 'task-123',
                frequency: 'Week',
                interval: 'not-a-number'
            });

            try {
                await recurrence.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain('Interval must be a positive integer.');
            }
        });

        test('Should throw ValidationError when interval is zero', async () => {
            const recurrence = new Recurrence({
                task_id: 'task-123',
                frequency: 'Day',
                interval: 0
            });

            try {
                await recurrence.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain('Interval must be a positive integer.');
            }
        });

        test('Should throw ValidationError when interval is negative', async () => {
            const recurrence = new Recurrence({
                task_id: 'task-123',
                frequency: 'Month',
                interval: -1
            });

            try {
                await recurrence.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors).toContain('Interval must be a positive integer.');
            }
        });

        test('Should throw ValidationError with multiple errors', async () => {
            const recurrence = new Recurrence({
                frequency: 'InvalidFreq',
                interval: -5
            });

            try {
                await recurrence.validate();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.errors.length).toBeGreaterThan(1);
                expect(error.errors).toContain('Task ID is required.');
                expect(error.errors).toContain('Frequency must be one of: Day, Week, Month.');
                expect(error.errors).toContain('Interval must be a positive integer.');
            }
        });
    });

    describe('getById()', () => {
        test('Should retrieve recurrence by ID successfully', async () => {
            const mockRecurrence = {
                id: 'rec-1',
                task_id: 'task-123',
                frequency: 'Week',
                interval: 1,
                next_occurrence: '2025-11-01',
                end_date: '2025-12-31'
            };

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockRecurrence,
                            error: null
                        })
                    })
                })
            });

            const result = await Recurrence.getById('rec-1');

            expect(result).toBeInstanceOf(Recurrence);
            expect(result.id).toBe('rec-1');
            expect(result.task_id).toBe('task-123');
            expect(result.frequency).toBe('Week');
            expect(supabase.from).toHaveBeenCalledWith('revamped_recurrence');
        });

        test('Should throw DatabaseError when query fails', async () => {
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

            try {
                await Recurrence.getById('rec-1');
                fail('Should have thrown DatabaseError');
            } catch (error) {
                expect(error).toBeInstanceOf(DatabaseError);
                expect(error.message).toContain('Failed to retrieve recurrence by ID');
            }
        });
    });

    describe('getByTaskId()', () => {
        test('Should retrieve recurrences by task ID successfully', async () => {
            const mockRecurrences = [
                {
                    id: 'rec-1',
                    task_id: 'task-123',
                    frequency: 'Week',
                    interval: 1
                },
                {
                    id: 'rec-2',
                    task_id: 'task-123',
                    frequency: 'Day',
                    interval: 2
                }
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: mockRecurrences,
                        error: null
                    })
                })
            });

            const result = await Recurrence.getByTaskId('task-123');

            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(Recurrence);
            expect(result[1]).toBeInstanceOf(Recurrence);
            expect(result[0].task_id).toBe('task-123');
            expect(result[1].task_id).toBe('task-123');
            expect(supabase.from).toHaveBeenCalledWith('revamped_recurrence');
        });

        test('Should return empty array when no recurrences found', async () => {
            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: [],
                        error: null
                    })
                })
            });

            const result = await Recurrence.getByTaskId('task-123');

            expect(result).toEqual([]);
        });

        test('Should throw DatabaseError when query fails', async () => {
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
                await Recurrence.getByTaskId('task-123');
                fail('Should have thrown DatabaseError');
            } catch (error) {
                expect(error).toBeInstanceOf(DatabaseError);
                expect(error.message).toContain('Failed to retrieve recurrence by task ID');
            }
        });
    });

    describe('create()', () => {
        test('Should create recurrence successfully', async () => {
            const mockCreatedData = {
                id: 'rec-new',
                task_id: 'task-123',
                frequency: 'Week',
                interval: 2,
                end_date: '2025-12-31',
                created_at: '2025-10-25T10:00:00Z',
                updated_at: '2025-10-25T10:00:00Z'
            };

            supabase.from = jest.fn().mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockCreatedData,
                            error: null
                        })
                    })
                })
            });

            const recurrence = new Recurrence({
                task_id: 'task-123',
                frequency: 'Week',
                interval: 2,
                end_date: '2025-12-31'
            });

            const result = await recurrence.create();

            expect(result).toBeInstanceOf(Recurrence);
            expect(result.id).toBe('rec-new');
            expect(result.created_at).toBe('2025-10-25T10:00:00Z');
            expect(result.updated_at).toBe('2025-10-25T10:00:00Z');
            expect(supabase.from).toHaveBeenCalledWith('revamped_recurrence');
        });

        test('Should throw ValidationError when validation fails', async () => {
            const recurrence = new Recurrence({
                task_id: 'task-123',
                frequency: 'InvalidFreq',
                interval: -1
            });

            try {
                await recurrence.create();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
            }
        });

        test('Should throw DatabaseError when insert fails', async () => {
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

            const recurrence = new Recurrence({
                task_id: 'task-123',
                frequency: 'Day',
                interval: 1
            });

            try {
                await recurrence.create();
                fail('Should have thrown DatabaseError');
            } catch (error) {
                expect(error).toBeInstanceOf(DatabaseError);
                expect(error.message).toContain('Failed to create recurrence');
            }
        });
    });

    describe('update()', () => {
        test('Should update recurrence successfully', async () => {
            supabase.from = jest.fn().mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                    })
                })
            });

            const recurrence = new Recurrence({
                id: 'rec-1',
                task_id: 'task-123',
                frequency: 'Month',
                interval: 3,
                end_date: '2026-01-01'
            });

            const result = await recurrence.update();

            expect(result).toBeInstanceOf(Recurrence);
            expect(result.id).toBe('rec-1');
            expect(supabase.from).toHaveBeenCalledWith('revamped_recurrence');
            expect(consoleLogSpy).toHaveBeenCalledWith('Freq: Month');
            expect(consoleLogSpy).toHaveBeenCalledWith('Interval: 3');
        });

        test('Should throw ValidationError when validation fails', async () => {
            const recurrence = new Recurrence({
                id: 'rec-1',
                frequency: 'BadFreq',
                interval: 0
            });

            try {
                await recurrence.update();
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
            }
        });

        test('Should throw DatabaseError when update fails', async () => {
            const mockError = { message: 'Update failed' };

            supabase.from = jest.fn().mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: null,
                        error: mockError
                    })
                })
            });

            const recurrence = new Recurrence({
                id: 'rec-1',
                frequency: 'Week',
                interval: 1
            });

            try {
                await recurrence.update();
                fail('Should have thrown DatabaseError');
            } catch (error) {
                expect(error).toBeInstanceOf(DatabaseError);
                expect(error.message).toContain('Failed to update recurrence');
            }
        });

        test('Should call validate with isUpdate=true', async () => {
            supabase.from = jest.fn().mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                    })
                })
            });

            const recurrence = new Recurrence({
                id: 'rec-1',
                frequency: 'Day',
                interval: 1
                // No task_id - should be OK for update
            });

            const result = await recurrence.update();

            expect(result).toBeInstanceOf(Recurrence);
        });
    });

    describe('delete()', () => {
        test('Should delete recurrence successfully', async () => {
            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        error: null
                    })
                })
            });

            const recurrence = new Recurrence({
                id: 'rec-1'
            });

            await recurrence.delete();

            expect(supabase.from).toHaveBeenCalledWith('revamped_recurrence');
        });

        test('Should throw DatabaseError when delete fails', async () => {
            const mockError = { message: 'Delete failed' };

            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        error: mockError
                    })
                })
            });

            const recurrence = new Recurrence({
                id: 'rec-1'
            });

            try {
                await recurrence.delete();
                fail('Should have thrown DatabaseError');
            } catch (error) {
                expect(error).toBeInstanceOf(DatabaseError);
                expect(error.message).toContain('Failed to delete recurrence');
            }
        });
    });
});

