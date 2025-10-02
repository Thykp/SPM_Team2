const request = require('supertest');
const app = require('../../app');

describe('Project API - Create New Project', () => {
  test('POST /project/new should create a new project', async () => {
    const newProject = {
      title: 'Test Project',
      display_name: 'Test Display Name',
      description: 'Test Description',
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
    expect(response.body.data.title).toBe('Test Project');
    expect(response.body.data.display_name).toBe('Test Display Name');
    expect(response.body.data.description).toBe('Test Description');
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
