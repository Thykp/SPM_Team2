const request = require('supertest');
const app = require('../../app');
const { supabase } = require('../../db/supabase');



describe('Task API - Integration Tests', () => {
    let testTaskId;
    let testSubtaskId;
    let testProjectId;
    const testOwnerId = 'e9f9a36c-5d22-49c8-9493-30cbf2f3fc67';
    const testCollaboratorId = '237f73b2-6850-4c5d-849f-56f1164a063b';
    const thirdUserId = 'de3f4aa2-97e0-4e94-972a-1ba5e6035746';
    const TABLES = {
        PROJECT: 'revamped_project',
        TASK: 'revamped_task',
        TASK_PARTICIPANT: 'revamped_task_participant'
    };

    // Increase timeout for beforeAll hook (database operations can be slow)
    beforeAll(async () => {
        jest.clearAllMocks();

        
        // Create a test project first
        const { data: projectData, error: projectError } = await supabase
            .from(TABLES.PROJECT)
            .insert({
                title: 'Test Project for Tasks',
                description: 'Integration test project'
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
                title: 'Test Task',
                deadline: '2025-12-31',
                description: 'Test task description',
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

        // Add task participants
        const { error: participantError } = await supabase
            .from(TABLES.TASK_PARTICIPANT)
            .insert([
                { task_id: testTaskId, profile_id: testOwnerId, is_owner: true },
                { task_id: testTaskId, profile_id: testCollaboratorId, is_owner: false }
            ]);
        
        if (participantError) {
            console.error('Failed to add task participants:', participantError.message);
            throw participantError;
        }
        console.log('Added 2 participants to task');

        // Create a subtask
        const { data: subtaskData, error: subtaskError } = await supabase
            .from(TABLES.TASK)
            .insert({
                parent_task_id: testTaskId,
                project_id: testProjectId,
                title: 'Test Subtask',
                deadline: '2025-12-31',
                description: 'Test subtask description',
                status: 'Ongoing',
                priority: 5
            })
            .select()
            .single();

        if (subtaskError) {
            console.error('Failed to create subtask:', subtaskError.message);
            throw subtaskError;
        }
        testSubtaskId = subtaskData.id;
        console.log(`Created subtask with ID: ${testSubtaskId}`);

        // Add subtask participant
        const { error: subtaskParticipantError } = await supabase
            .from(TABLES.TASK_PARTICIPANT)
            .insert({ task_id: testSubtaskId, profile_id: testOwnerId, is_owner: true });
        
        if (subtaskParticipantError) {
            console.error('Failed to add subtask participant:', subtaskParticipantError.message);
            throw subtaskParticipantError;
        }
        console.log('Added 1 participant to subtask');
    }, 30000); // 30 second timeout for database setup

    afterAll(async () => {
        // Clean up: delete participants first (foreign key constraint)
        if (testTaskId) {
            const { error: taskParticipantError } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .delete()
                .eq('task_id', testTaskId);
            if (taskParticipantError) {
                console.error(`Failed to delete task participants: ${taskParticipantError.message}`);
            } else {
                console.log(`Deleted participants for task: ${testTaskId}`);
            }
        }

        if (testSubtaskId) {
            const { error: subtaskParticipantError } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .delete()
                .eq('task_id', testSubtaskId);
            if (subtaskParticipantError) {
                console.error(`Failed to delete subtask participants: ${subtaskParticipantError.message}`);
            } else {
                console.log(`Deleted participants for subtask: ${testSubtaskId}`);
            }
        }

        // Delete tasks
        if (testSubtaskId) {
            const { error: subtaskError } = await supabase
                .from(TABLES.TASK)
                .delete()
                .eq('id', testSubtaskId);
            if (subtaskError) {
                console.error(`Failed to delete subtask: ${subtaskError.message}`);
            } else {
                console.log(`Deleted subtask: ${testSubtaskId}`);
            }
        }

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
    }, 30000); // 30 second timeout for database cleanup


    describe('GET /task - Get all tasks', () => {
        test('should return all tasks with 200 status', async () => {
            const response = await request(app)
                .get('/task')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            
            // Check that our test task is in the results
            const foundTask = response.body.find(task => task.id === testTaskId);
            expect(foundTask).toBeDefined();
            expect(foundTask.title).toBe('Test Task');
            expect(foundTask.priority).toBe(5);
        });
    });

    describe('GET /task/:id - Get task by ID', () => {
        test('should return task details with 200 status', async () => {
            const response = await request(app)
                .get(`/task/${testTaskId}`)
                .expect(200);

            expect(response.body).toBeDefined();
            expect(response.body.id).toBe(testTaskId);
            expect(response.body.title).toBe('Test Task');
            expect(response.body.description).toBe('Test task description');
            expect(response.body.status).toBe('Ongoing');
            expect(response.body.project_id).toBe(testProjectId);
            expect(response.body.priority).toBe(5);
            
            // Check participants
            expect(response.body.participants).toBeDefined();
            expect(response.body.participants.length).toBe(2);
        });

        test('should return 404 for non-existent task ID', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/task/${nonExistentId}`)
                .expect(404);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /task/:id/subtasks - Get subtasks of a task', () => {
        test('should return subtasks with 200 status', async () => {
            const response = await request(app)
                .get(`/task/${testTaskId}/subtasks`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            
            const subtask = response.body[0];
            expect(subtask.id).toBe(testSubtaskId);
            expect(subtask.title).toBe('Test Subtask');
            expect(subtask.parent_task_id).toBe(testTaskId);
            expect(subtask.priority).toBe(5);
        });

        test('should return empty array for task with no subtasks', async () => {
            const response = await request(app)
                .get(`/task/${testSubtaskId}/subtasks`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
    });

    describe('GET /task/users/:userId - Get tasks by user ID', () => {
        test('should return tasks for owner user', async () => {
            const response = await request(app)
                .get(`/task/users/${testOwnerId}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            
            // Check that our test task is in the results
            const foundTask = response.body.find(task => task.id === testTaskId);
            expect(foundTask).toBeDefined();
            expect(foundTask.title).toBe('Test Task');
            expect(foundTask.priority).toBe(5);
        });

        test('should return tasks for collaborator user', async () => {
            const response = await request(app)
                .get(`/task/users/${testCollaboratorId}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            
            // Collaborator should see the task they're assigned to
            const foundTask = response.body.find(task => task.id === testTaskId);
            expect(foundTask).toBeDefined();
            expect(foundTask.priority).toBe(5);
        });

        test('should return empty array for user with no tasks', async () => {
            const nonExistentUserId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/task/users/${nonExistentUserId}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
    });


    describe('POST /task - Create new task', () => {
        let createdTaskId = null;

        afterEach(async () => {
            if (createdTaskId) {
                await supabase
                    .from(TABLES.TASK_PARTICIPANT)
                    .delete()
                    .eq('task_id', createdTaskId);

                await supabase
                    .from(TABLES.TASK)
                    .delete()
                    .eq('id', createdTaskId);

                console.log(`Cleaned up created task: ${createdTaskId}`);
                createdTaskId = null;
            }
        });

        test('should create a new task with owner and collaborator', async () => {
            const newTask = {
                project_id: testProjectId,
                title: 'New Integration Test Task',
                deadline: '2026-01-15',
                description: 'Task created by integration test',
                status: 'Ongoing',
                priority: 5,
                participants: [
                    { profile_id: testOwnerId, is_owner: true },
                    { profile_id: testCollaboratorId, is_owner: false }
                ]
            };

            const response = await request(app)
                .post('/task')
                .send(newTask)
                .expect(200);

            expect(response.body.message).toBe('Successfully created task and task participants');

            // Verify the task was created by fetching it
            const { data: tasks } = await supabase
                .from(TABLES.TASK)
                .select('*')
                .eq('title', 'New Integration Test Task')
                .eq('project_id', testProjectId);

            expect(tasks.length).toBe(1);
            createdTaskId = tasks[0].id;
            expect(tasks[0].description).toBe('Task created by integration test');
            expect(tasks[0].status).toBe('Ongoing');
            expect(tasks[0].priority).toBe(5);

            // Verify participants were created
            const { data: participants } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .select('*')
                .eq('task_id', createdTaskId);

            expect(participants.length).toBe(2);
            expect(participants.some(p => p.profile_id === testOwnerId && p.is_owner)).toBe(true);
            expect(participants.some(p => p.profile_id === testCollaboratorId && !p.is_owner)).toBe(true);
        });

        test('should return 400 for missing required fields', async () => {
            const invalidTask = {
                project_id: testProjectId,
                // Missing title, deadline, description, status, participants
            };

            const response = await request(app)
                .post('/task')
                .send(invalidTask)
                .expect(400);

            expect(response.body.error).toBeDefined();
            expect(response.body.error).toContain('required');
        });

        test('should return 400 for task without participants', async () => {
            const taskNoParticipants = {
                project_id: testProjectId,
                title: 'Task Without Participants',
                deadline: '2026-03-01',
                description: 'This should fail',
                status: 'Ongoing',
                participants: []
            };

            const response = await request(app)
                .post('/task')
                .send(taskNoParticipants)
                .expect(400);

            expect(response.body.error).toBeDefined();
        });

        test('should return 400 for task without owner', async () => {
            const taskNoOwner = {
                project_id: testProjectId,
                title: 'Task Without Owner',
                deadline: '2026-03-01',
                description: 'All participants are collaborators',
                status: 'Ongoing',
                participants: [
                    { profile_id: testCollaboratorId, is_owner: false }
                ]
            };

            const response = await request(app)
                .post('/task')
                .send(taskNoOwner)
                .expect(400);

            expect(response.body.error).toBeDefined();
        });
    });

    // ========================================
    // PUT ENDPOINT TESTS
    // ========================================

    describe('PUT /task/:id - Update task', () => {
        test('should update task basic fields', async () => {
            const updatedFields = {
                title: 'Updated Test Task Title',
                description: 'Updated description for integration test',
                status: 'Under Review',
                deadline: '2026-06-30',
                priority: 8,
                participants: [
                    { profile_id: testOwnerId, is_owner: true },
                    { profile_id: testCollaboratorId, is_owner: false }
                ]
            };

            const response = await request(app)
                .put(`/task/${testTaskId}`)
                .send(updatedFields)
                .expect(200);

            expect(response.body.message).toBe('Successfully updated task and task participants');

            // Verify the update by fetching the task
            const getResponse = await request(app)
                .get(`/task/${testTaskId}`)
                .expect(200);

            expect(getResponse.body.title).toBe('Updated Test Task Title');
            expect(getResponse.body.description).toBe('Updated description for integration test');
            expect(getResponse.body.status).toBe('Under Review');
            expect(getResponse.body.deadline).toBe('2026-06-30T00:00:00+00:00');
            expect(getResponse.body.priority).toBe(8);
        });

        test('should update task participants (add new collaborator)', async () => {
            const updatedTask = {
                title: 'Updated Test Task Title',
                description: 'Updated description for integration test',
                status: 'Under Review',
                deadline: '2026-06-30',
                priority: 7,
                participants: [
                    { profile_id: testOwnerId, is_owner: true },
                    { profile_id: testCollaboratorId, is_owner: false },
                    { profile_id: thirdUserId, is_owner: false }
                ]
            };

            const response = await request(app)
                .put(`/task/${testTaskId}`)
                .send(updatedTask)
                .expect(200);

            expect(response.body.message).toBe('Successfully updated task and task participants');

            // Verify participants were updated
            const { data: participants } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .select('*')
                .eq('task_id', testTaskId);

            expect(participants.length).toBe(3);
            expect(participants.some(p => p.profile_id === thirdUserId)).toBe(true);

            // Clean up the third participant
            await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .delete()
                .eq('task_id', testTaskId)
                .eq('profile_id', thirdUserId);
        });

        test('should update task status to Completed', async () => {
            const updatedFields = {
                title: 'Updated Test Task Title',
                description: 'Updated description for integration test',
                status: 'Completed',
                deadline: '2026-06-30',
                priority: 9,
                participants: [
                    { profile_id: testOwnerId, is_owner: true },
                    { profile_id: testCollaboratorId, is_owner: false }
                ]
            };

            const response = await request(app)
                .put(`/task/${testTaskId}`)
                .send(updatedFields)
                .expect(200);

            // Verify status change
            const getResponse = await request(app)
                .get(`/task/${testTaskId}`)
                .expect(200);

            expect(getResponse.body.status).toBe('Completed');
            expect(getResponse.body.priority).toBe(9);
        });

    });

    describe('PUT /task/:id/comment/:userId - Add comment', () => {
        test('Should add first comment and initialize comments array', async () => {
            const response = await request(app)
                .put(`/task/${testTaskId}/comment/${testOwnerId}`)
                .send({ comment: 'This is my first comment' })
                .expect(200);

            expect(response.body.message).toBe('Comment added successfully');
            expect(response.body.comments).toContain('This is my first comment');
            expect(response.body.comments.length).toBe(1);

            // Verify in database
            const { data: participant } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .select('comments')
                .eq('task_id', testTaskId)
                .eq('profile_id', testOwnerId)
                .single();

            expect(participant.comments).toContain('This is my first comment');
        });

        test('Should append comment to existing comments', async () => {
            // Add second comment
            const response = await request(app)
                .put(`/task/${testTaskId}/comment/${testOwnerId}`)
                .send({ comment: 'This is my second comment' })
                .expect(200);

            expect(response.body.message).toBe('Comment added successfully');
            expect(response.body.comments).toHaveLength(2);
            expect(response.body.comments).toContain('This is my first comment');
            expect(response.body.comments).toContain('This is my second comment');

            // Verify in database
            const { data: participant } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .select('comments')
                .eq('task_id', testTaskId)
                .eq('profile_id', testOwnerId)
                .single();

            expect(participant.comments).toHaveLength(2);
            expect(participant.comments).toContain('This is my first comment');
            expect(participant.comments).toContain('This is my second comment');
        });

        test('Should return 400 when comment is empty', async () => {
            const response = await request(app)
                .put(`/task/${testTaskId}/comment/${testOwnerId}`)
                .send({ comment: '' })
                .expect(400);

            expect(response.body.error).toBe('Comment cannot be empty');
        });

        test('Should return 400 when comment is only whitespace', async () => {
            const response = await request(app)
                .put(`/task/${testTaskId}/comment/${testOwnerId}`)
                .send({ comment: '   ' })
                .expect(400);

            expect(response.body.error).toBe('Comment cannot be empty');
        });

        test('Should handle comments from different users', async () => {
            // Add comment from collaborator
            const response = await request(app)
                .put(`/task/${testTaskId}/comment/${testCollaboratorId}`)
                .send({ comment: 'Comment from collaborator' })
                .expect(200);

            expect(response.body.message).toBe('Comment added successfully');
            expect(response.body.comments).toContain('Comment from collaborator');

            // Verify owner's comments are unchanged
            const { data: ownerParticipant } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .select('comments')
                .eq('task_id', testTaskId)
                .eq('profile_id', testOwnerId)
                .single();

            expect(ownerParticipant.comments).toHaveLength(2);
        });

        test('Should return 500 for non-existent task ID', async () => {
            const fakeTaskId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .put(`/task/${fakeTaskId}/comment/${testOwnerId}`)
                .send({ comment: 'Comment on non-existent task' })
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('PUT /task/:id/comment/:userId/remove - Remove comment', () => {
        test('Should remove specific comment successfully', async () => {
            // First, verify we have comments
            const { data: beforeDelete } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .select('comments')
                .eq('task_id', testTaskId)
                .eq('profile_id', testOwnerId)
                .single();

            expect(beforeDelete.comments).toHaveLength(2);

            // Remove one comment
            const response = await request(app)
                .put(`/task/${testTaskId}/comment/${testOwnerId}/remove`)
                .send({ comment: 'This is my first comment' })
                .expect(200);

            expect(response.body.message).toBe('Comment removed successfully');
            expect(response.body.comments).toHaveLength(1);
            expect(response.body.comments).toContain('This is my second comment');
            expect(response.body.comments).not.toContain('This is my first comment');

            // Verify in database
            const { data: afterDelete } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .select('comments')
                .eq('task_id', testTaskId)
                .eq('profile_id', testOwnerId)
                .single();

            expect(afterDelete.comments).toHaveLength(1);
            expect(afterDelete.comments[0]).toBe('This is my second comment');
        });

        test('Should return 400 when comment is empty', async () => {
            const response = await request(app)
                .put(`/task/${testTaskId}/comment/${testOwnerId}/remove`)
                .send({ comment: '' })
                .expect(400);

            expect(response.body.error).toBe('Comment cannot be empty');
        });

        test('Should handle removing non-existent comment gracefully', async () => {
            const { data: beforeRemove } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .select('comments')
                .eq('task_id', testTaskId)
                .eq('profile_id', testOwnerId)
                .single();

            const initialCommentCount = beforeRemove.comments.length;

            // Try to remove a comment that doesn't exist
            const response = await request(app)
                .put(`/task/${testTaskId}/comment/${testOwnerId}/remove`)
                .send({ comment: 'This comment does not exist' })
                .expect(200);

            expect(response.body.message).toBe('Comment removed successfully');
            // Comments array should remain unchanged (filter removes nothing)
            expect(response.body.comments.length).toBe(initialCommentCount);

            // Verify in database
            const { data: afterRemove } = await supabase
                .from(TABLES.TASK_PARTICIPANT)
                .select('comments')
                .eq('task_id', testTaskId)
                .eq('profile_id', testOwnerId)
                .single();

            expect(afterRemove.comments.length).toBe(initialCommentCount);
        });

        test('Should handle removing from empty comments array', async () => {
            // Use a different user that has no comments
            const response = await request(app)
                .put(`/task/${testTaskId}/comment/${thirdUserId}/remove`)
                .send({ comment: 'Any comment' })
                .expect(500);

            expect(response.body.error).toBeDefined();
        });
    });

})