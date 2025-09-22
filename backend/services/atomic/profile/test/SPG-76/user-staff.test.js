const request = require('supertest');

jest.mock('../../model/user', () => ({
  getStaffByDepartment: jest.fn(),
}));

const { getStaffByDepartment } = require('../../model/user');
const app = require('../../app');

describe('GET /user/staff', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200: returns staff by dept+role', async () => {
    const fake = [
      { id: 'u1', display_name: 'Alice', role: 'staff', department: 'Engineering' },
      { id: 'u2', display_name: 'Bob',   role: 'staff', department: 'Engineering' },
    ];
    getStaffByDepartment.mockResolvedValue(fake);

    const res = await request(app).get('/user/staff?department=Engineering&role=staff');

    expect(getStaffByDepartment).toHaveBeenCalledWith('Engineering', 'staff');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fake);
  });

  it('200: defaults role=staff', async () => {
    getStaffByDepartment.mockResolvedValue([]);
    const res = await request(app).get('/user/staff?department=HR');
    expect(getStaffByDepartment).toHaveBeenCalledWith('HR', 'staff');
    expect(res.status).toBe(200);
  });

  it('500: bubbles model error', async () => {
    getStaffByDepartment.mockRejectedValue(new Error('db down'));
    const res = await request(app).get('/user/staff?department=Engineering');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'db down' });
  });
});
