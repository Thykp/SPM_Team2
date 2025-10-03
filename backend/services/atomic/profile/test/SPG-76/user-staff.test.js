const request = require('supertest');

jest.mock('../../model/user', () => ({
  getStaffByScope: jest.fn(),
}));

const { getStaffByScope } = require('../../model/user');
const app = require('../../app');

describe('GET /user/staff (revamped)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('200: returns staff by department_id + role', async () => {
    const fake = [{ id: 'u1', display_name: 'A', role: 'staff', department_id: 'dep-123' }];
    getStaffByScope.mockResolvedValue(fake);

    const res = await request(app).get('/user/staff?department_id=dep-123&role=staff');

    expect(getStaffByScope).toHaveBeenCalledWith({
      team_id: null,
      department_id: 'dep-123',
      role: 'staff',
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fake);
  });

  it('200: defaults role=staff when omitted', async () => {
    getStaffByScope.mockResolvedValue([]);

    const res = await request(app).get('/user/staff?team_id=team-999');

    expect(getStaffByScope).toHaveBeenCalledWith({
      team_id: 'team-999',
      department_id: null,
      role: 'staff',
    });
    expect(res.status).toBe(200);
  });

  it('500: bubbles model error', async () => {
    getStaffByScope.mockRejectedValue(new Error('db down'));

    const res = await request(app).get('/user/staff?department_id=dep-123');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'db down' });
  });
});
