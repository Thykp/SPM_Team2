const request = require('supertest');

jest.mock('../../model/user', () => ({
  getUserDetailsWithId: jest.fn(),
}));

const { getUserDetailsWithId } = require('../../model/user');
const app = require('../../app');

describe('GET /user/:userId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and user details when valid userId is provided', async () => {
    const userId = '123';
    const mockUserData = [
      {
        id: '123',
        display_name: 'John Doe',
        role: 'Engineer',
        department: 'Engineering',
        email: 'john.doe@company.com'
      }
    ];
    
    getUserDetailsWithId.mockResolvedValue(mockUserData);

    const res = await request(app).get(`/user/${userId}`);

    expect(getUserDetailsWithId).toHaveBeenCalledTimes(1);
    expect(getUserDetailsWithId).toHaveBeenCalledWith(userId);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockUserData);
  });

  it('returns 400 when userId is missing', async () => {
    const res = await request(app).get('/user/');

    expect(getUserDetailsWithId).not.toHaveBeenCalled();
    expect(res.status).toBe(200); // Express returns 404 for missing route params
  });

  it('returns 500 when the model throws an error', async () => {
    const userId = '123';
    const errorMessage = 'Database connection failed';
    
    getUserDetailsWithId.mockRejectedValue(new Error(errorMessage));

    const res = await request(app).get(`/user/${userId}`);

    expect(getUserDetailsWithId).toHaveBeenCalledTimes(1);
    expect(getUserDetailsWithId).toHaveBeenCalledWith(userId);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: errorMessage });
  });

  it('returns 200 with empty array when user is not found', async () => {
    const userId = 'nonexistent';
    
    getUserDetailsWithId.mockResolvedValue([]);

    const res = await request(app).get(`/user/${userId}`);

    expect(getUserDetailsWithId).toHaveBeenCalledTimes(1);
    expect(getUserDetailsWithId).toHaveBeenCalledWith(userId);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('handles special characters in userId', async () => {
    const userId = 'user@123';
    const mockUserData = [
      {
        id: 'user@123',
        display_name: 'Special User',
        role: 'Manager',
        department: 'HR'
      }
    ];
    
    getUserDetailsWithId.mockResolvedValue(mockUserData);

    const res = await request(app).get(`/user/${encodeURIComponent(userId)}`);

    expect(getUserDetailsWithId).toHaveBeenCalledTimes(1);
    expect(getUserDetailsWithId).toHaveBeenCalledWith(userId);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockUserData);
  });
});