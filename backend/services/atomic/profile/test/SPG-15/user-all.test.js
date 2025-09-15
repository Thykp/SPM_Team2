const request = require('supertest');

// Mock the model BEFORE requiring the app
jest.mock('../../model/user', () => ({
  getAllUsersLite: jest.fn(),
}));

const { getAllUsersLite } = require('../../model/user');
// Keep this import the same as your other passing tests
const app = require('../../app');

describe('GET /user/all', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and the lite user list', async () => {
    const fakeUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        display_name: 'Alice',
        role: 'staff',
        department: 'Engineering'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        display_name: 'Bob',
        role: 'manager',
        department: 'Engineering'
      },
    ];
    getAllUsersLite.mockResolvedValue(fakeUsers);

    const res = await request(app).get('/user/all');

    expect(getAllUsersLite).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeUsers);
  });

  it('returns 500 when the model throws', async () => {
    getAllUsersLite.mockRejectedValue(new Error('db unavailable'));

    const res = await request(app).get('/user/all');

    expect(getAllUsersLite).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'db unavailable' });
  });
});
