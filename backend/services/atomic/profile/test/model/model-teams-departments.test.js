const mockOrder = jest.fn();
const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: mockFrom })),
}));

let getAllTeams, getAllDepartments;

beforeEach(() => {
  jest.resetModules();
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockOrder.mockClear();
  
  ({ getAllTeams, getAllDepartments } = require('../../model/user'));
});

describe('getAllTeams', () => {
  test('should return formatted teams data on success', async () => {
    const mockTeams = [
      { id: 't1', name: 'Team Alpha', department_id: 'd1' },
    ];
    mockOrder.mockResolvedValue({ data: mockTeams, error: null });

    const result = await getAllTeams();

    expect(mockFrom).toHaveBeenCalledWith('revamped_teams');
    expect(mockSelect).toHaveBeenCalledWith('id, name, department_id');
    expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
    expect(result).toEqual(mockTeams);
  });

  test('should throw error when database query fails', async () => {
    const mockError = { message: 'Database error', code: 'XX000' };
    mockOrder.mockResolvedValue({ data: null, error: mockError });

    await expect(getAllTeams()).rejects.toThrow('Database error');
  });

  test('should return empty array when data is null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const result = await getAllTeams();

    expect(result).toEqual([]);
  });

  test('should return empty array when data is empty', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const result = await getAllTeams();

    expect(result).toEqual([]);
  });
});

describe('getAllDepartments', () => {
  test('should return formatted departments data on success', async () => {
    const mockDepartments = [
      { id: 'd1', name: 'Engineering' },
    ];
    mockOrder.mockResolvedValue({ data: mockDepartments, error: null });

    const result = await getAllDepartments();

    expect(mockFrom).toHaveBeenCalledWith('revamped_departments');
    expect(mockSelect).toHaveBeenCalledWith('id, name');
    expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
    expect(result).toEqual(mockDepartments);
  });

  test('should throw error when database query fails', async () => {
    const mockError = { message: 'Database error', code: 'XX000' };
    mockOrder.mockResolvedValue({ data: null, error: mockError });

    await expect(getAllDepartments()).rejects.toThrow('Database error');
  });

  test('should return empty array when data is null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const result = await getAllDepartments();

    expect(result).toEqual([]);
  });

  test('should return empty array when data is empty', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const result = await getAllDepartments();

    expect(result).toEqual([]);
  });
});
