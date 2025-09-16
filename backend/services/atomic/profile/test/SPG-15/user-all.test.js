const request = require('supertest');

jest.mock('../../model/user', () => ({
  getAllUsers: jest.fn(),
}));

const { getAllUsers } = require('../../model/user');
const app = require('../../app');

describe('GET /user/all', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and the user list', async () => {
    const fakeUsers = [
      { id: '1', display_name: 'Alice', role: 'Engineer', department: 'R&D' },
      { id: '2', display_name: 'Bob', role: 'Manager', department: 'Ops' },
    ];
    getAllUsers.mockResolvedValue(fakeUsers);

    const res = await request(app).get('/user/all');

    expect(getAllUsers).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeUsers);
  });

  it('returns 500 when the model throws', async () => {
    getAllUsers.mockRejectedValue(new Error('db unavailable'));

    const res = await request(app).get('/user/all');

    expect(getAllUsers).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'db unavailable' });
  });
});
