const mockSelect = jest.fn();
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

let getAllUsers;

beforeEach(() => {
  jest.resetModules();

  mockFrom.mockClear();
  mockSelect.mockClear();

  ({ getAllUsers } = require('../../model/user'));
});

const user = require('../../model/user');

describe('model/user.getAllUsers', () => {
  it('returns data on success', async () => {
    const rows = [
      {
        id: 1,
        email: 'a@example.com',
        department_name: null, // Include the additional fields
        team_name: null,       // Include the additional fields
      },
    ];
    mockSelect.mockResolvedValue({ data: rows, error: null });

    const out = await getAllUsers();

    expect(mockFrom).toHaveBeenCalledWith('revamped_profiles');
    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining(`
      id,
      display_name,
      role,
      team_id,
      department_id,
      department:revamped_departments(name),
      team:revamped_teams(name)
    `));
    expect(out).toEqual(rows); // Updated expected output
  });

  it('throws when supabase returns error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'boom' } });

    await expect(getAllUsers()).rejects.toThrow('boom');
    expect(mockFrom).toHaveBeenCalledWith('revamped_profiles');
  });

  it('returns [] when there are no rows', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    const out = await getAllUsers();
    expect(out).toEqual([]);
  });
});