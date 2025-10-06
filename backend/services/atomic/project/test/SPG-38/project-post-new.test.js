jest.mock('../../db/supabase', () => {
  const mockSingle = jest.fn().mockResolvedValue({
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Project',
      description: 'Test Description',
      owner_id: 'd1111111-1111-1111-1111-111111111111'
    },
    error: null
  });

  const mockSelect = jest.fn(() => ({ single: mockSingle }));
  const mockInsert = jest.fn(() => ({ select: mockSelect }));
  const mockFrom = jest.fn(() => ({ insert: mockInsert }));

  return {
    supabase: { from: mockFrom }
  };
});

const request = require('supertest');
const app = require('../../app');

describe('Project API - Create New Project', () => {
  test('POST /project/ should create a new project', async () => {
    const newProject = {
      title: 'Test Project',
      description: 'Test Description',
      ownerId: 'd1111111-1111-1111-1111-111111111111'
    };

    const response = await request(app)
      .post('/project/')
      .send(newProject);

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Project created successfully');
    expect(response.body.data).toBeDefined();
    expect(response.body.data.title).toBe('Test Project');
    expect(response.body.data.description).toBe('Test Description');
    expect(response.body.timestamp).toBeDefined();
  });

  test('POST /project/ should handle missing data gracefully', async () => {
    const incompleteProject = {
      title: 'Test Project'
    };

    const response = await request(app)
      .post('/project/')
      .send(incompleteProject);

    expect([400, 500]).toContain(response.status);
  });
});