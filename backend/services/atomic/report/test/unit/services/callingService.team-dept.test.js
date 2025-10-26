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
    test('gets members via /user/staff and name via /user/teams', async () => {
      axios.get
        .mockResolvedValueOnce({ data: [{ id: 'u1' }, { id: 'u2' }] }) // staff
        .mockResolvedValueOnce({ data: [{ id: 'team-1', name: 'Alpha', department_id: 'dept-9' }] }); // teams

      const out = await fetchTeamWithMembers('team-1');
      expect(axios.get).toHaveBeenNthCalledWith(1, `${profileBase}/user/staff`, { params: { team_id: 'team-1', role: 'Staff' } });
      expect(axios.get).toHaveBeenNthCalledWith(2, `${profileBase}/user/teams`);
      expect(out).toEqual({ id: 'team-1', name: 'Alpha', members: ['u1', 'u2'], department_id: 'dept-9' });
    });

    test('throws NotFoundError when no members', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });
      await expect(fetchTeamWithMembers('t-x')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('fetchDepartmentWithMembers', () => {
    test('gets members via /user/all and name via /user/departments', async () => {
      axios.get
        .mockResolvedValueOnce({ 
          data: [
            { id: 'u9', department_id: 'd1' },
            { id: 'u10', department_id: 'd1' },
            { id: 'u11', department_id: 'd2' }
          ] 
        }) // all users
        .mockResolvedValueOnce({ data: [{ id: 'd1', name: 'Engineering' }] }); // departments

      const out = await fetchDepartmentWithMembers('d1');
      expect(axios.get).toHaveBeenNthCalledWith(1, `${profileBase}/user/all`);
      expect(axios.get).toHaveBeenNthCalledWith(2, `${profileBase}/user/departments`);
      expect(out).toEqual({ id: 'd1', name: 'Engineering', members: ['u9', 'u10'] });
    });

    test('throws NotFoundError when no members', async () => {
      axios.get
        .mockResolvedValueOnce({ 
          data: [
            { id: 'u1', department_id: 'other-dept' }
          ] 
        })
        .mockResolvedValueOnce({ data: [{ id: 'd-x', name: 'Department' }] });
      
      await expect(fetchDepartmentWithMembers('d-x')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('fetchTasksForTeam', () => {
    beforeEach(() => jest.clearAllMocks());
    
    test('fans out over members and merges by id with participant union', async () => {
      // Mock sequence: staff, teams, task for m1, task for m2
      axios.get
        .mockResolvedValueOnce({ data: [{ id: 'm1' }, { id: 'm2' }] }) // staff response
        .mockResolvedValueOnce({ data: [{ id: 'team-1', name: 'Alpha' }] }) // teams response
        .mockResolvedValueOnce({ data: [ // tasks for m1
          { id: 't1', title: 'X', participants: [{ profile_id: 'm1', is_owner: true }] },
          { id: 't2', title: 'Y', participants: [{ profile_id: 'm1', is_owner: false }] }
        ]})
        .mockResolvedValueOnce({ data: [ // tasks for m2
          { id: 't1', title: 'X', participants: [{ profile_id: 'm2', is_owner: false }] }
        ]});

      const out = await fetchTasksForTeam('team-1', '2024-01-01', '2024-01-31');
      expect(out).toBeDefined();
      expect(Array.isArray(out)).toBe(true);
      expect(out.length).toBeGreaterThan(0);
      expect(out.every(t => 'id' in t && 'participants' in t)).toBe(true);
    });

    test('throws NotFoundError when nothing merged', async () => {
      axios.get.mockReset();
      axios.get
        .mockResolvedValueOnce({ data: [{ id: 'm1' }] }) // staff
        .mockResolvedValueOnce({ data: [{ id: 'team-1', name: 'Alpha' }] }) // teams
        .mockResolvedValueOnce({ data: [] }); // tasks for m1 (empty)

      await expect(fetchTasksForTeam('team-1', '2024-01-01', '2024-01-31')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('fetchTasksForDepartment', () => {
    test('fans out over members and merges', async () => {
      axios.get.mockReset();
      
      // Mock sequence: all users (for fetchDepartmentWithMembers), departments, task for m1, task for m3
      axios.get
        .mockResolvedValueOnce({ 
          data: [
            { id: 'm1', department_id: 'dept-1' }, 
            { id: 'm3', department_id: 'dept-1' }
          ] 
        }) // /user/all
        .mockResolvedValueOnce({ data: [{ id: 'dept-1', name: 'Eng' }] }) // /user/departments
        .mockResolvedValueOnce({ data: [ // tasks for m1
          { id: 't1', title: 'A', participants: [{ profile_id: 'm1', is_owner: true }] }
        ]})
        .mockResolvedValueOnce({ data: [ // tasks for m3
          { id: 't1', title: 'A', participants: [{ profile_id: 'm3', is_owner: false }] },
          { id: 't3', title: 'C', participants: [{ profile_id: 'm3', is_owner: true }] }
        ]});

      const out = await fetchTasksForDepartment('dept-1', '2024-02-01', '2024-02-29');
      expect(out).toBeDefined();
      expect(Array.isArray(out)).toBe(true);
      expect(out.length).toBeGreaterThan(0);
      expect(out.every(t => 'id' in t && 'participants' in t)).toBe(true);
    });

    test('throws NotFoundError when nothing merged', async () => {
      axios.get.mockReset();
      
      axios.get
        .mockResolvedValueOnce({ 
          data: [
            { id: 'm1', department_id: 'dept-1' }
          ] 
        }) // /user/all
        .mockResolvedValueOnce({ data: [{ id: 'dept-1', name: 'Eng' }] }) // /user/departments
        .mockResolvedValueOnce({ data: [] }); // empty tasks

      await expect(fetchTasksForDepartment('dept-1', '2024-02-01', '2024-02-29')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
