const request = require('supertest');

jest.mock('../../model/user', () => ({
  getAllTeams: jest.fn(),
  getAllDepartments: jest.fn(),
}));

const { getAllTeams, getAllDepartments } = require('../../model/user');
const app = require('../../app');

describe('GET /user/teams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 with teams list', async () => {
    const fakeTeams = [
      { id: 't1', name: 'Team Alpha', department_id: 'd1' },
      { id: 't2', name: 'Team Beta', department_id: 'd2' },
    ];
    getAllTeams.mockResolvedValue(fakeTeams);

    const res = await request(app).get('/user/teams');

    expect(getAllTeams).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeTeams);
  });

  test('should return 500 when the model throws', async () => {
    getAllTeams.mockRejectedValue(new Error('Database error'));

    const res = await request(app).get('/user/teams');

    expect(getAllTeams).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Database error' });
  });

  test('should return empty array when no teams exist', async () => {
    getAllTeams.mockResolvedValue([]);

    const res = await request(app).get('/user/teams');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /user/departments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 with departments list', async () => {
    const fakeDepartments = [
      { id: 'd1', name: 'Engineering' },
      { id: 'd2', name: 'Sales' },
    ];
    getAllDepartments.mockResolvedValue(fakeDepartments);

    const res = await request(app).get('/user/departments');

    expect(getAllDepartments).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeDepartments);
  });

  test('should return 500 when the model throws', async () => {
    getAllDepartments.mockRejectedValue(new Error('Database error'));

    const res = await request(app).get('/user/departments');

    expect(getAllDepartments).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Database error' });
  });

  test('should return empty array when no departments exist', async () => {
    getAllDepartments.mockResolvedValue([]);

    const res = await request(app).get('/user/departments');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

