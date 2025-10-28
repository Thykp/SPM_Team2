const mockSingle = jest.fn();
const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

let getUserDetailsWithId;

beforeEach(() => {
  jest.resetModules();
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockEq.mockClear();
  mockSingle.mockClear();
  ({ getUserDetailsWithId } = require('../../model/user'));
});

describe('getUserDetailsWithId error scenarios', () => {
  test('should throw error when database query fails', async () => {
    const mockError = { message: 'Database error', code: 'XX000' };
    mockSingle.mockResolvedValue({ data: null, error: mockError });

    await expect(getUserDetailsWithId('user-123')).rejects.toThrow('Database error');
    expect(mockFrom).toHaveBeenCalledWith('revamped_profiles');
  });

  test('should handle user not found gracefully', async () => {
    mockSingle.mockResolvedValue({ 
      data: null, 
      error: { message: 'No rows returned', code: 'PGRST116' } 
    });

    await expect(getUserDetailsWithId('nonexistent-user')).rejects.toThrow('No rows returned');
  });

  test('should transform nested objects to flat structure', async () => {
    const mockUser = {
      id: 'user-123',
      display_name: 'Alice',
      role: 'Staff',
      team_id: 'team-123',
      department_id: 'dept-456',
      department: { name: 'Engineering' },
      team: { name: 'Alpha Team' },
    };
    mockSingle.mockResolvedValue({ data: mockUser, error: null });

    const result = await getUserDetailsWithId('user-123');

    expect(result).toEqual({
      id: 'user-123',
      display_name: 'Alice',
      role: 'Staff',
      team_id: 'team-123',
      department_id: 'dept-456',
      department_name: 'Engineering',
      team_name: 'Alpha Team',
    });
    expect(result.department).toBeUndefined();
    expect(result.team).toBeUndefined();
  });

  test('should handle null department and team objects', async () => {
    const mockUser = {
      id: 'user-456',
      display_name: 'Bob',
      role: 'Manager',
      team_id: null,
      department_id: null,
      department: null,
      team: null,
    };
    mockSingle.mockResolvedValue({ data: mockUser, error: null });

    const result = await getUserDetailsWithId('user-456');

    expect(result).toEqual({
      id: 'user-456',
      display_name: 'Bob',
      role: 'Manager',
      team_id: null,
      department_id: null,
      department_name: null,
      team_name: null,
    });
  });

  test('should return empty array when data is null but no error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    const result = await getUserDetailsWithId('user-123');

    expect(result).toEqual([]);
  });
});
