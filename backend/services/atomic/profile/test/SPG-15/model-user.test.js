// test/SPG-15/model-user.test.js

// Keep a stable implementation for from() -> { select: mockSelect }
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

  // Don't wipe implementations; just clear call history
  mockFrom.mockClear();
  mockSelect.mockClear();

  // If you prefer mockReset(), then re-apply the implementation:
  // mockFrom.mockReset();
  // mockSelect.mockReset();
  // mockFrom.mockImplementation(() => ({ select: mockSelect }));

  ({ getAllUsers } = require('../../model/user'));
});

describe('model/user.getAllUsers', () => {
  it('returns data on success', async () => {
    const rows = [{ id: 1, email: 'a@example.com' }];
    mockSelect.mockResolvedValue({ data: rows, error: null });

    const out = await getAllUsers();

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(out).toEqual(rows);
  });

  it('throws when supabase returns error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'boom' } });

    await expect(getAllUsers()).rejects.toThrow('boom');
    expect(mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('returns [] when there are no rows', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    const out = await getAllUsers();
    expect(out).toEqual([]);
  });
});
