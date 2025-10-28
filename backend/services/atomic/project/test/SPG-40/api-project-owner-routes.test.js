const request = require('supertest');

jest.mock('../../model/project2', () => ({
  getProjectOwner: jest.fn(),
  changeProjectOwner: jest.fn(),
}));

const { getProjectOwner, changeProjectOwner } = require('../../model/project2');
const app = require('../../app');

describe('GET /project/:id/owner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('200: returns owner successfully', async () => {
    const mockOwner = {
      profile_id: 'owner-123',
      is_owner: true,
      created_at: new Date().toISOString(),
    };

    getProjectOwner.mockResolvedValue(mockOwner);

    const res = await request(app)
      .get('/project/proj-123/owner');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockOwner);
  });

  test('500: returns error when model throws', async () => {
    getProjectOwner.mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .get('/project/proj-123/owner');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Database error' });
  });

  test('404: returns error when no owner found', async () => {
    getProjectOwner.mockResolvedValue(null);

    const res = await request(app)
      .get('/project/proj-123/owner');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Owner ID is required' });
  });
});

describe('PUT /project/:id/owner', () => {
  const projectId = 'proj-123';
  const newOwnerId = 'new-owner-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('200: successfully changes owner', async () => {
    const mockResult = {
      success: true,
      message: 'Project owner changed successfully',
      data: {
        previous_owner: 'old-owner-789',
        new_owner: newOwnerId,
      },
      timestamp: new Date().toISOString(),
    };

    changeProjectOwner.mockResolvedValue(mockResult);

    const res = await request(app)
      .put(`/project/${projectId}/owner`)
      .send({ new_owner_id: newOwnerId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResult);
    expect(changeProjectOwner).toHaveBeenCalledWith(projectId, newOwnerId);
  });

  test('400: returns error when new_owner_id is missing', async () => {
    const res = await request(app)
      .put(`/project/${projectId}/owner`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('New owner ID is required');
  });

  test('400: returns error when id is missing', async () => {
    const res = await request(app)
      .put('/project//owner')
      .send({ new_owner_id: newOwnerId });

    expect(res.status).toBe(404);
  });

  test('500: returns error when model throws', async () => {
    changeProjectOwner.mockRejectedValue(new Error('User not found in project'));

    const res = await request(app)
      .put(`/project/${projectId}/owner`)
      .send({ new_owner_id: newOwnerId });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'User not found in project' });
  });
});

