const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: mockFrom })),
}));

let getStaffByScope;

beforeEach(() => {
  jest.resetModules();
  mockFrom.mockClear();
  ({ getStaffByScope } = require('../../model/user'));
});

describe('getStaffByScope advanced scenarios', () => {
  test('should prioritize team_id over department_id when both are provided', async () => {
    const mockStaff = [
      { id: '1', display_name: 'Alice', role: 'Staff', team_id: 'team-123', department_id: 'd1' },
    ];
    const mockData = { data: mockStaff, error: null };
    
    const mockOrder = jest.fn().mockReturnValue(mockData);
    const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ eq: mockEq1 }),
    });

    const result = await getStaffByScope({
      team_id: 'team-123',
      department_id: 'dept-456',
      role: 'Staff',
    });

    expect(result).toEqual(mockStaff);
  });

  test('should filter by department_id when team_id is null', async () => {
    const mockStaff = [
      { id: '2', display_name: 'Bob', role: 'Staff', team_id: 't1', department_id: 'dept-456' },
    ];
    const mockData = { data: mockStaff, error: null };
    
    const mockOrder = jest.fn().mockReturnValue(mockData);
    const mockEq2 = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ order: mockOrder }) });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ eq: mockEq2 }),
    });

    const result = await getStaffByScope({
      team_id: null,
      department_id: 'dept-456',
      role: 'Staff',
    });

    expect(result).toEqual(mockStaff);
  });

  test('should handle undefined team_id and department_id', async () => {
    const mockStaff = [
      { id: '3', display_name: 'Charlie', role: 'Staff', team_id: null, department_id: null },
    ];
    const mockData = { data: mockStaff, error: null };
    
    const mockOrder = jest.fn().mockReturnValue(mockData);
    const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ eq: mockEq1 }),
    });

    const result = await getStaffByScope({
      team_id: undefined,
      department_id: undefined,
      role: 'Staff',
    });

    expect(result).toEqual(mockStaff);
  });

  test('should filter by different role when specified', async () => {
    const mockManagers = [
      { id: '4', display_name: 'David', role: 'Manager', team_id: 'team-123', department_id: 'd1' },
    ];
    const mockData = { data: mockManagers, error: null };
    
    const mockOrder = jest.fn().mockReturnValue(mockData);
    const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ eq: mockEq1 }),
    });

    const result = await getStaffByScope({
      team_id: 'team-123',
      department_id: null,
      role: 'Manager',
    });

    expect(result).toEqual(mockManagers);
  });

  test('should return empty array when no matching staff found', async () => {
    const mockData = { data: [], error: null };
    
    const mockOrder = jest.fn().mockReturnValue(mockData);
    const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ eq: mockEq1 }),
    });

    const result = await getStaffByScope({
      team_id: 'team-nonexistent',
      department_id: null,
      role: 'Staff',
    });

    expect(result).toEqual([]);
  });

  test('should throw error when database query fails', async () => {
    const mockError = { message: 'Database error' };
    
    const mockOrder = jest.fn().mockReturnValue({ data: null, error: mockError });
    const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ eq: mockEq1 }),
    });

    await expect(getStaffByScope({
      team_id: 'team-123',
      department_id: null,
      role: 'Staff',
    })).rejects.toThrow('Database error');
  });
});
