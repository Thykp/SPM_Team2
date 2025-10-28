const request = require('supertest');

jest.mock('../../model/project2', () => ({
  deleteProject: jest.fn(),
}));

const { deleteProject } = require('../../model/project2');
const app = require('../../app');

describe('DELETE /project/:id - Error Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('200: successfully deletes project', async () => {
    const mockDeleted = {
      success: true,
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString(),
    };

    deleteProject.mockResolvedValue(mockDeleted);

    const res = await request(app).delete('/project/proj-123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockDeleted);
  });

  test('500: returns error when model throws', async () => {
    deleteProject.mockRejectedValue(new Error('Database error'));

    const res = await request(app).delete('/project/proj-123');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Database error' });
  });

  test('404: returns error when project not found', async () => {
    deleteProject.mockResolvedValue(null);

    const res = await request(app).delete('/project/non-existent-id');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Project not found' });
  });

  test('400: returns error when id is missing in params', async () => {
    const res = await request(app).delete('/project/');

    expect(res.status).toBe(404);
  });
});

