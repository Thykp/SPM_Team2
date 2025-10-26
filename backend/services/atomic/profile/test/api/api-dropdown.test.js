const request = require('supertest');

jest.mock('../../model/user', () => ({
  getAllUsersDropdown: jest.fn(),
}));

const { getAllUsersDropdown } = require('../../model/user');
const app = require('../../app');

describe('GET /user/dropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and the user dropdown list', async () => {
    const fakeUsers = [
      { id: '1', display_name: 'Alice', role: 'Staff', team_id: 't1', department_id: 'd1' },
      { id: '2', display_name: 'Bob', role: 'Manager', team_id: 't2', department_id: 'd2' },
    ];
    getAllUsersDropdown.mockResolvedValue(fakeUsers);

    const res = await request(app).get('/user/dropdown');

    expect(getAllUsersDropdown).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeUsers);
  });

  test('should return 500 when the model throws', async () => {
    getAllUsersDropdown.mockRejectedValue(new Error('Database error'));

    const res = await request(app).get('/user/dropdown');

    expect(getAllUsersDropdown).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Database error' });
  });

  test('should return empty array when no users exist', async () => {
    getAllUsersDropdown.mockResolvedValue([]);

    const res = await request(app).get('/user/dropdown');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

