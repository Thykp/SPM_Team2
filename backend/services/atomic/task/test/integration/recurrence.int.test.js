const request = require('supertest');
const app = require('../../app');
const { supabase } = require('../../db/supabase');

describe('Recurrence API - Integration Tests', () => {
    let testTaskId;
    let testRecurrenceId;
    let testProjectId;
    const testOwnerId = '2787f4d7-db48-41d4-a055-eb9376bfd443';

    const TABLES = {
        PROJECT: 'revamped_project',
        TASK: 'revamped_task',
        TASK_PARTICIPANT: 'revamped_task_participant',
        RECURRENCE: 'revamped_recurrence'
    };

    // Setup test data before all tests
    beforeAll(async () => {
        jest.clearAllMocks();

        // Create a test project
        const { data: projectData, error: projectError } = await supabase
            .from(TABLES.PROJECT)
            .insert({
                title: 'Test Project for Recurrence',
                description: 'Integration test project for recurrence'
            })
            .select()
            .single();

        if (projectError) {
            console.error('Failed to create test project:', projectError.message);
            throw projectError;
        }
        testProjectId = projectData.id;
        console.log(`Created project with ID: ${testProjectId}`);

        // Create a test task
        const { data: taskData, error: taskError } = await supabase
            .from(TABLES.TASK)
            .insert({
                project_id: testProjectId,
                title: 'Test Recurring Task',
                deadline: '2025-12-31',
                description: 'Test task with recurrence',
                status: 'Ongoing',
                priority: 5
            })
            .select()
            .single();

        if (taskError) {
            console.error('Failed to create test task:', taskError.message);
            throw taskError;
        }
        testTaskId = taskData.id;
        console.log(`Created task with ID: ${testTaskId}`);

        // Add task participant
        const { error: participantError } = await supabase
            .from(TABLES.TASK_PARTICIPANT)
            .insert({ task_id: testTaskId, profile_id: testOwnerId, is_owner: true });

        if (participantError) {
            console.error('Failed to add task participant:', participantError.message);
            throw participantError;
        }
        console.log('Added participant to task');

        // Create a test recurrence
        const { data: recurrenceData, error: recurrenceError } = await supabase
            .from(TABLES.RECURRENCE)
            .insert({
                task_id: testTaskId,
                frequency: 'Week',
                interval: 1,
                end_date: '2025-12-31'
            })
            .select()
            .single();

        if (recurrenceError) {
            console.error('Failed to create test recurrence:', recurrenceError.message);
            throw recurrenceError;
        }
        testRecurrenceId = recurrenceData.id;
        console.log(`Created recurrence with ID: ${testRecurrenceId}`);
    }, 30000); // 30 second timeout

    afterAll(async () => {
        // Clean up in reverse order of creation

        // Delete recurrence
        if (testRecurrenceId) {
            const { error: recurrenceError } = await supabase
                .from(TABLES.RECURRENCE)
                .delete()
                .eq('id', testRecurrenceId);
            if (recurrenceError) {
                console.error(`Failed to delete recurrence: ${recurrenceError.message}`);
            } else {
                console.log(`Deleted recurrence: ${testRecurrenceId}`);
            }
        }

        // Delete task participants
        if (testTaskId) {
            const { error: participantError } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .delete()
                .eq('task_id', testTaskId);
            if (participantError) {
                console.error(`Failed to delete task participants: ${participantError.message}`);
            } else {
                console.log(`Deleted participants for task: ${testTaskId}`);
            }
        }

        // Delete task
        if (testTaskId) {
            const { error: taskError } = await supabase
                .from(TABLES.TASK)
                .delete()
                .eq('id', testTaskId);
            if (taskError) {
                console.error(`Failed to delete task: ${taskError.message}`);
            } else {
                console.log(`Deleted task: ${testTaskId}`);
            }
        }

        // Delete project
        if (testProjectId) {
            const { error: projectError } = await supabase
                .from(TABLES.PROJECT)
                .delete()
                .eq('id', testProjectId);
            if (projectError) {
                console.error(`Failed to delete project: ${projectError.message}`);
            } else {
                console.log(`Deleted project: ${testProjectId}`);
            }
        }
    }, 30000); // 30 second timeout

    describe('GET /recurrence/:id - Get recurrence by ID', () => {
        test('should return recurrence details with 200 status', async () => {
            const response = await request(app)
                .get(`/recurrence/${testRecurrenceId}`)
                .expect(200);

            expect(response.body).toBeDefined();
            expect(response.body.id).toBe(testRecurrenceId);
            expect(response.body.task_id).toBe(testTaskId);
            expect(response.body.frequency).toBe('Week');
            expect(response.body.interval).toBe(1);
            expect(response.body.end_date).toBeDefined();
        });

        test('should return 500 for non-existent recurrence ID', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/recurrence/${nonExistentId}`)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /recurrence/task/:taskId - Get recurrences by task ID', () => {
        test('should return recurrences for a task with 200 status', async () => {
            const response = await request(app)
                .get(`/recurrence/task/${testTaskId}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            const recurrence = response.body[0];
            expect(recurrence.task_id).toBe(testTaskId);
            expect(recurrence.frequency).toBe('Week');
            expect(recurrence.interval).toBe(1);
        });

        test('should return empty array for task with no recurrences', async () => {
            // Create a task without recurrence
            const { data: taskData } = await supabase
                .from(TABLES.TASK)
                .insert({
                    project_id: testProjectId,
                    title: 'Task Without Recurrence',
                    deadline: '2025-12-31',
                    description: 'No recurrence',
                    status: 'Ongoing',
                    priority: 5
                })
                .select()
                .single();

            const response = await request(app)
                .get(`/recurrence/task/${taskData.id}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);

            // Clean up
            await supabase.from(TABLES.TASK).delete().eq('id', taskData.id);
        });
    });

    describe('POST /recurrence - Create new recurrence', () => {
        let createdRecurrenceId = null;

        afterEach(async () => {
            if (createdRecurrenceId) {
                await supabase
                    .from(TABLES.RECURRENCE)
                    .delete()
                    .eq('id', createdRecurrenceId);

                console.log(`Cleaned up created recurrence: ${createdRecurrenceId}`);
                createdRecurrenceId = null;
            }
        });

        test('should create a new recurrence with valid data', async () => {
            const newRecurrence = {
                task_id: testTaskId,
                frequency: 'Day',
                interval: 2,
                end_date: '2026-01-31'
            };

            const response = await request(app)
                .post('/recurrence')
                .send(newRecurrence)
                .expect(201);

            expect(response.body).toBeDefined();
            expect(response.body.task_id).toBe(testTaskId);
            expect(response.body.frequency).toBe('Day');
            expect(response.body.interval).toBe(2);
            expect(response.body.id).toBeDefined();

            createdRecurrenceId = response.body.id;

            // Verify the recurrence was created
            const { data: recurrence } = await supabase
                .from(TABLES.RECURRENCE)
                .select('*')
                .eq('id', createdRecurrenceId)
                .single();

            expect(recurrence).toBeDefined();
            expect(recurrence.frequency).toBe('Day');
            expect(recurrence.interval).toBe(2);
        });

        test('should create recurrence with Month frequency', async () => {
            const newRecurrence = {
                task_id: testTaskId,
                frequency: 'Month',
                interval: 1,
                end_date: '2026-12-31'
            };

            const response = await request(app)
                .post('/recurrence')
                .send(newRecurrence)
                .expect(201);

            expect(response.body.frequency).toBe('Month');
            createdRecurrenceId = response.body.id;
        });

        test('should return 500 for missing required fields', async () => {
            const invalidRecurrence = {
                task_id: testTaskId,
                // Missing frequency and interval
            };

            const response = await request(app)
                .post('/recurrence')
                .send(invalidRecurrence)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });

        test('should return 500 for invalid frequency', async () => {
            const invalidRecurrence = {
                task_id: testTaskId,
                frequency: 'Year', // Invalid frequency
                interval: 1
            };

            const response = await request(app)
                .post('/recurrence')
                .send(invalidRecurrence)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });

        test('should return 500 for invalid interval (zero)', async () => {
            const invalidRecurrence = {
                task_id: testTaskId,
                frequency: 'Week',
                interval: 0 // Invalid: must be positive
            };

            const response = await request(app)
                .post('/recurrence')
                .send(invalidRecurrence)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });

        test('should return 500 for negative interval', async () => {
            const invalidRecurrence = {
                task_id: testTaskId,
                frequency: 'Day',
                interval: -1 // Invalid: must be positive
            };

            const response = await request(app)
                .post('/recurrence')
                .send(invalidRecurrence)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('PUT /recurrence/:id - Update recurrence', () => {
        test('should update recurrence frequency and interval', async () => {
            const updatedData = {
                frequency: 'Month',
                interval: 3,
                end_date: '2026-06-30'
            };

            const response = await request(app)
                .put(`/recurrence/${testRecurrenceId}`)
                .send(updatedData)
                .expect(200);

            expect(response.body).toBeDefined();
            expect(response.body.frequency).toBe('Month');
            expect(response.body.interval).toBe(3);

            // Verify the update by fetching the recurrence
            const getResponse = await request(app)
                .get(`/recurrence/${testRecurrenceId}`)
                .expect(200);

            expect(getResponse.body.frequency).toBe('Month');
            expect(getResponse.body.interval).toBe(3);
        });

        test('should update only frequency', async () => {
            const updatedData = {
                frequency: 'Day',
                interval: 3 // Keep previous interval
            };

            const response = await request(app)
                .put(`/recurrence/${testRecurrenceId}`)
                .send(updatedData)
                .expect(200);

            expect(response.body.frequency).toBe('Day');
        });

        test('should update end_date', async () => {
            const updatedData = {
                frequency: 'Week',
                interval: 2,
                end_date: '2027-01-01'
            };

            const response = await request(app)
                .put(`/recurrence/${testRecurrenceId}`)
                .send(updatedData)
                .expect(200);

            expect(response.body.end_date).toBeDefined();
        });

        test('should return 500 for invalid frequency on update', async () => {
            const invalidData = {
                frequency: 'InvalidFrequency',
                interval: 1
            };

            const response = await request(app)
                .put(`/recurrence/${testRecurrenceId}`)
                .send(invalidData)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });

        test('should return 500 for invalid interval on update', async () => {
            const invalidData = {
                frequency: 'Week',
                interval: 0
            };

            const response = await request(app)
                .put(`/recurrence/${testRecurrenceId}`)
                .send(invalidData)
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('DELETE /recurrence/:id - Delete recurrence', () => {
        test('should delete recurrence successfully', async () => {
            // Create a recurrence to delete
            const { data: recurrenceData } = await supabase
                .from(TABLES.RECURRENCE)
                .insert({
                    task_id: testTaskId,
                    frequency: 'Day',
                    interval: 1,
                    end_date: '2025-12-31'
                })
                .select()
                .single();

            const recurrenceToDeleteId = recurrenceData.id;

            const response = await request(app)
                .delete(`/recurrence/${recurrenceToDeleteId}`)
                .expect(200);

            expect(response.body.message).toBe('Recurrence deleted successfully');

            // Verify deletion
            const { data: deletedRecurrence } = await supabase
                .from(TABLES.RECURRENCE)
                .select('*')
                .eq('id', recurrenceToDeleteId)
                .single();

            expect(deletedRecurrence).toBeNull();
        });

        test('should return 200 when deleting non-existent recurrence (idempotent)', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';
            
            // Supabase doesn't error when deleting non-existent records
            const response = await request(app)
                .delete(`/recurrence/${nonExistentId}`)
                .expect(200);

            expect(response.body.message).toBe('Recurrence deleted successfully');
        });
    });
});

