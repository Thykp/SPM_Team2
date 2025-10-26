const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: mockFrom })),
}));

let getUsersByRoleScope;

beforeEach(() => {
  jest.resetModules();
  mockFrom.mockClear();
  ({ getUsersByRoleScope } = require('../../model/user'));
});

describe('getUsersByRoleScope', () => {
  test('should return staff by team_id for Manager role', async () => {
    const mockStaff = [{ id: '1', display_name: 'Alice', role: 'Staff', team_id: 'team-123', department_id: 'd1' }];
    const mockData = { data: mockStaff, error: null };
    
    const mockEq2 = jest.fn().mockReturnValue(mockData);
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockOrder = jest.fn().mockReturnValue({ eq: mockEq1 });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ order: mockOrder }),
    });

    const result = await getUsersByRoleScope({ role: 'Manager', team_id: 'team-123', department_id: null });

    expect(result).toEqual(mockStaff);
  });

  test('should return empty array for Manager without team_id', async () => {
    const result = await getUsersByRoleScope({ role: 'Manager', team_id: null, department_id: null });
    expect(result).toEqual([]);
  });

  test('should return manager and staff by department_id for Director role', async () => {
    const mockUsers = [{ id: '1', display_name: 'Alice', role: 'Manager', team_id: 't1', department_id: 'dept-123' }];
    const mockData = { data: mockUsers, error: null };
    
    const mockIn = jest.fn().mockReturnValue(mockData);
    const mockEq = jest.fn().mockReturnValue({ in: mockIn });
    const mockOrder = jest.fn().mockReturnValue({ eq: mockEq });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ order: mockOrder }),
    });

    const result = await getUsersByRoleScope({ role: 'Director', team_id: null, department_id: 'dept-123' });

    expect(result).toEqual(mockUsers);
  });

  test('should return empty array for Director without department_id', async () => {
    const result = await getUsersByRoleScope({ role: 'Director', team_id: null, department_id: null });
    expect(result).toEqual([]);
  });

  test('should return all users for Senior Management role', async () => {
    const mockUsers = [{ id: '1', display_name: 'Alice', role: 'Staff' }];
    const mockData = { data: mockUsers, error: null };
    
    const mockOrder = jest.fn().mockReturnValue(mockData);
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ order: mockOrder }),
    });

    const result = await getUsersByRoleScope({ role: 'Senior Management', team_id: null, department_id: null });

    expect(result).toEqual(mockUsers);
  });

  test('should return empty array for unsupported role', async () => {
    const result = await getUsersByRoleScope({ role: 'Intern', team_id: 'team-123', department_id: 'dept-123' });
    expect(result).toEqual([]);
  });

  test('should throw error when database query fails', async () => {
    const mockError = { message: 'Database error' };
    
    const mockEq2 = jest.fn().mockReturnValue({ data: null, error: mockError });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockOrder = jest.fn().mockReturnValue({ eq: mockEq1 });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ order: mockOrder }),
    });

    await expect(getUsersByRoleScope({ role: 'Manager', team_id: 'team-123', department_id: null }))
      .rejects.toThrow('Database error');
  });

  test('should return empty array when data is null', async () => {
    const mockData = { data: null, error: null };
    
    const mockEq2 = jest.fn().mockReturnValue(mockData);
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockOrder = jest.fn().mockReturnValue({ eq: mockEq1 });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ order: mockOrder }),
    });

    const result = await getUsersByRoleScope({ role: 'Manager', team_id: 'team-123', department_id: null });

    expect(result).toEqual([]);
  });
});
