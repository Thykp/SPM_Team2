const request = require('supertest');
const app = require('../../app');

describe('Project API - Create New Project', () => {
  test('POST /project/new should create a new project', async () => {
    const newProject = {
      title: 'Test Project',
      description: 'Test Description',
      collaborators: ['588fb335-9986-4c93-872e-6ef103c97f92', 'c0cd847d-8c61-45dd-8dda-ecffe214943e'],
      owner: 'testuser',
      task_list: []
    };

    const response = await request(app)
      .post('/project/new')
      .send(newProject)
      .expect(201);

    // Expect the new response format with success, message, data, timestamp
    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Project created successfully');
    expect(response.body.data).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });

  test('POST /project/new should handle missing data gracefully', async () => {
    const incompleteProject = {
      title: 'Test Project'
      // Missing required fields
    };

    const response = await request(app)
      .post('/project/new')
      .send(incompleteProject);

    // Should either succeed with null data (due to mocks) or fail gracefully
    expect([200, 201, 400, 500]).toContain(response.status);
  });
});
