const request = require('supertest');

jest.mock('../../model/user', () => ({
  getUserDetailsWithId: jest.fn(),
  getAllUsers: jest.fn(),
  getAllUsersDropdown: jest.fn(),
  getStaffByScope: jest.fn(),
  getUsersByRoleScope: jest.fn(),
  getAllTeams: jest.fn(),
  getAllDepartments: jest.fn(),
}));

const {
  getUserDetailsWithId,
  getAllUsersDropdown,
  getStaffByScope,
  getUsersByRoleScope,
  getAllTeams,
  getAllDepartments,
} = require('../../model/user');
const app = require('../../app');

describe('API Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /user/:userId', () => {
    test('should return 500 when model throws', async () => {
      getUserDetailsWithId.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/user/user-123');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database error' });
    });
  });

  describe('GET /user/all', () => {
    test('should return 500 when model throws', async () => {
      const { getAllUsers } = require('../../model/user');
      getAllUsers.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app).get('/user/all');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Database connection failed' });
    });
  });

  describe('GET /user/dropdown', () => {
    test('should return 500 when model throws', async () => {
      getAllUsersDropdown.mockRejectedValue(new Error('Query timeout'));

      const res = await request(app).get('/user/dropdown');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Query timeout' });
    });
  });

  describe('GET /user/staff', () => {
    test('should return 500 when model throws', async () => {
      getStaffByScope.mockRejectedValue(new Error('Invalid filter parameters'));

      const res = await request(app).get('/user/staff?team_id=team-123');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Invalid filter parameters' });
    });
  });

  describe('GET /user/assignees', () => {
    test('should return 500 when model throws', async () => {
      getUsersByRoleScope.mockRejectedValue(new Error('Unauthorized access'));

      const res = await request(app).get('/user/assignees?role=Manager&team_id=team-123');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Unauthorized access' });
    });

    test('should handle empty query parameters', async () => {
      getUsersByRoleScope.mockResolvedValue([]);

      const res = await request(app).get('/user/assignees');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /user/teams', () => {
    test('should return 500 when model throws', async () => {
      getAllTeams.mockRejectedValue(new Error('Teams table not found'));

      const res = await request(app).get('/user/teams');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Teams table not found' });
    });
  });

  describe('GET /user/departments', () => {
    test('should return 500 when model throws', async () => {
      getAllDepartments.mockRejectedValue(new Error('Departments table not found'));

      const res = await request(app).get('/user/departments');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Departments table not found' });
    });
  });
});
