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

  it('returns 200 and the full user list', async () => {
    const fakeUsers = [
      { id: 1, email: 'a@example.com' },
      { id: 2, email: 'b@example.com' },
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
