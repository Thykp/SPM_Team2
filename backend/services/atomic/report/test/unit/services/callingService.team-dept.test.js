const axios = require('axios');
const {
  fetchTeamWithMembers,
  fetchDepartmentWithMembers,
  fetchTasksForTeam,
  fetchTasksForDepartment
} = require('../../../services/callingService');
const { NotFoundError } = require('../../../model/AppError');

jest.mock('axios');

describe('callingService team/department helpers', () => {
  const profileBase = process.env.PROFILE_PATH || 'http://localhost:3030';
  const taskBase = process.env.TASK_PATH || 'http://localhost:3031';

  beforeEach(() => jest.clearAllMocks());

  describe('fetchTeamWithMembers', () => {
    test('gets members via /user/staff and name via /teams', async () => {
      axios.get
        .mockResolvedValueOnce({ data: [{ id: 'u1' }, { id: 'u2' }] }) // staff
        .mockResolvedValueOnce({ data: [{ id: 'team-1', name: 'Alpha', department_id: 'dept-9' }] }); // teams

      const out = await fetchTeamWithMembers('team-1');
      expect(axios.get).toHaveBeenNthCalledWith(1, `${profileBase}/user/staff`, { params: { team_id: 'team-1', role: 'Staff' } });
      expect(axios.get).toHaveBeenNthCalledWith(2, `${profileBase}/teams`);
      expect(out).toEqual({ id: 'team-1', name: 'Alpha', members: ['u1', 'u2'], department_id: 'dept-9' });
    });

    test('throws NotFoundError when no members', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });
      await expect(fetchTeamWithMembers('t-x')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('fetchDepartmentWithMembers', () => {
    test('gets members via /user/staff and name via /departments', async () => {
      axios.get
        .mockResolvedValueOnce({ data: [{ id: 'u9' }] }) // staff
        .mockResolvedValueOnce({ data: [{ id: 'd1', name: 'Engineering' }] }); // departments

      const out = await fetchDepartmentWithMembers('d1');
      expect(axios.get).toHaveBeenNthCalledWith(1, `${profileBase}/user/staff`, { params: { department_id: 'd1', role: 'Staff' } });
      expect(axios.get).toHaveBeenNthCalledWith(2, `${profileBase}/departments`);
      expect(out).toEqual({ id: 'd1', name: 'Engineering', members: ['u9'] });
    });

    test('throws NotFoundError when no members', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });
      await expect(fetchDepartmentWithMembers('d-x')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('fetchTasksForTeam', () => {
    test('fans out over members and merges by id with participant union', async () => {
      // team members + teams list
      axios.get
        .mockResolvedValueOnce({ data: [{ id: 'm1' }, { id: 'm2' }] })
        .mockResolvedValueOnce({ data: [{ id: 'team-1', name: 'Alpha' }] });

      // tasks per member
      axios.get
        .mockResolvedValueOnce({ data: [
          { id: 't1', title: 'X', participants: [{ profile_id: 'm1', is_owner: true }] },
          { id: 't2', title: 'Y', participants: [{ profile_id: 'm1', is_owner: false }] }
        ]})
        .mockResolvedValueOnce({ data: [
          { id: 't1', title: 'X', participants: [{ profile_id: 'm2', is_owner: false }] }
        ]});

      const out = await fetchTasksForTeam('team-1', '2024-01-01', '2024-01-31');
      const t1 = out.find(t => t.id === 't1');
      expect(t1.participants).toEqual(expect.arrayContaining([
        { profile_id: 'm1', is_owner: true },
        { profile_id: 'm2', is_owner: false }
      ]));
      expect(out.find(t => t.id === 't2')).toBeDefined();
    });

    test('throws NotFoundError when nothing merged', async () => {
      axios.get
        .mockResolvedValueOnce({ data: [{ id: 'm1' }] })
        .mockResolvedValueOnce({ data: [{ id: 'team-1', name: 'Alpha' }] })
        .mockResolvedValueOnce({ data: [] });

      await expect(fetchTasksForTeam('team-1', '2024-01-01', '2024-01-31')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('fetchTasksForDepartment', () => {
    test('fans out over members and merges', async () => {
      axios.get
        .mockResolvedValueOnce({ data: [{ id: 'm1' }, { id: 'm3' }] })
        .mockResolvedValueOnce({ data: [{ id: 'dept-1', name: 'Eng' }] });

      axios.get
        .mockResolvedValueOnce({ data: [
          { id: 't1', title: 'A', participants: [{ profile_id: 'm1', is_owner: true }] }
        ]})
        .mockResolvedValueOnce({ data: [
          { id: 't1', title: 'A', participants: [{ profile_id: 'm3', is_owner: false }] },
          { id: 't3', title: 'C', participants: [{ profile_id: 'm3', is_owner: true }] }
        ]});

      const out = await fetchTasksForDepartment('dept-1', '2024-02-01', '2024-02-29');
      expect(out.find(t => t.id === 't1').participants.length).toBe(2);
      expect(out.find(t => t.id === 't3')).toBeDefined();
    });

    test('throws NotFoundError when nothing merged', async () => {
      axios.get
        .mockResolvedValueOnce({ data: [{ id: 'm1' }] })
        .mockResolvedValueOnce({ data: [{ id: 'dept-1', name: 'Eng' }] })
        .mockResolvedValueOnce({ data: [] });

      await expect(fetchTasksForDepartment('dept-1', '2024-02-01', '2024-02-29')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
