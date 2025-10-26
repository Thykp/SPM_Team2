const mockOrder = jest.fn();
const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

let getAllUsersDropdown;

beforeEach(() => {
  jest.resetModules();
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockOrder.mockClear();
  ({ getAllUsersDropdown } = require('../../model/user'));
});

describe('getAllUsersDropdown', () => {
  test('should return formatted user data on success', async () => {
    const mockUsers = [
      { id: '1', display_name: 'Alice', role: 'Staff', team_id: 't1', department_id: 'd1' },
      { id: '2', display_name: 'Bob', role: 'Manager', team_id: 't2', department_id: 'd2' },
    ];
    mockOrder.mockResolvedValue({ data: mockUsers, error: null });

    const result = await getAllUsersDropdown();

    expect(mockFrom).toHaveBeenCalledWith('revamped_profiles');
    expect(mockSelect).toHaveBeenCalledWith('id, display_name, role, team_id, department_id');
    expect(mockOrder).toHaveBeenCalledWith('display_name', { ascending: true });
    expect(result).toEqual(mockUsers);
  });

  test('should throw error when database query fails', async () => {
    const mockError = { message: 'Database error', code: 'XX000' };
    mockOrder.mockResolvedValue({ data: null, error: mockError });

    await expect(getAllUsersDropdown()).rejects.toThrow('Database error');
  });

  test('should return empty array when data is null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const result = await getAllUsersDropdown();

    expect(result).toEqual([]);
  });

  test('should return empty array when data is empty', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const result = await getAllUsersDropdown();

    expect(result).toEqual([]);
  });
});

