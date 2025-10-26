const request = require('supertest');

jest.mock('../../model/user', () => ({
  getUsersByRoleScope: jest.fn(),
}));

const { getUsersByRoleScope } = require('../../model/user');
const app = require('../../app');

describe('GET /user/assignees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 with filtered users for Manager role', async () => {
    const fakeUsers = [
      { id: '1', display_name: 'Alice', role: 'Staff', team_id: 'team-123', department_id: 'd1' },
    ];
    getUsersByRoleScope.mockResolvedValue(fakeUsers);

    const res = await request(app).get('/user/assignees?role=Manager&team_id=team-123');

    expect(getUsersByRoleScope).toHaveBeenCalledWith({
      role: 'Manager',
      team_id: 'team-123',
      department_id: null,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeUsers);
  });

  test('should return 200 with filtered users for Director role', async () => {
    const fakeUsers = [
      { id: '1', display_name: 'Alice', role: 'Manager', team_id: 't1', department_id: 'dept-123' },
      { id: '2', display_name: 'Bob', role: 'Staff', team_id: 't2', department_id: 'dept-123' },
    ];
    getUsersByRoleScope.mockResolvedValue(fakeUsers);

    const res = await request(app).get('/user/assignees?role=Director&department_id=dept-123');

    expect(getUsersByRoleScope).toHaveBeenCalledWith({
      role: 'Director',
      team_id: null,
      department_id: 'dept-123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeUsers);
  });

  test('should return 200 with all users for Senior Management role', async () => {
    const fakeUsers = [
      { id: '1', display_name: 'Alice', role: 'Staff' },
      { id: '2', display_name: 'Bob', role: 'Manager' },
    ];
    getUsersByRoleScope.mockResolvedValue(fakeUsers);

    const res = await request(app).get('/user/assignees?role=Senior Management');

    expect(getUsersByRoleScope).toHaveBeenCalledWith({
      role: 'Senior Management',
      team_id: null,
      department_id: null,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeUsers);
  });

  test('should return empty array for unsupported role', async () => {
    getUsersByRoleScope.mockResolvedValue([]);

    const res = await request(app).get('/user/assignees?role=Intern');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('should handle missing query parameters', async () => {
    getUsersByRoleScope.mockResolvedValue([]);

    const res = await request(app).get('/user/assignees');

    expect(getUsersByRoleScope).toHaveBeenCalledWith({
      role: null,
      team_id: null,
      department_id: null,
    });
    expect(res.status).toBe(200);
  });

  test('should return 500 when the model throws', async () => {
    getUsersByRoleScope.mockRejectedValue(new Error('Database error'));

    const res = await request(app).get('/user/assignees?role=Manager&team_id=team-123');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Database error' });
  });
});

