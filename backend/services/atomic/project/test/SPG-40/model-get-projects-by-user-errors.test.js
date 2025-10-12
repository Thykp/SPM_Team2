jest.mock('../../db/supabase', () => {
  const mockEq = jest.fn().mockResolvedValue({
    data: [],
    error: null,
  });

  const mockSelect = jest.fn(() => ({
    eq: mockEq, // Mock the eq method
  }));

  const mockFrom = jest.fn((tableName) => {
    if (tableName === 'revamped_project_participant') {
      return {
        select: mockSelect, // Mock the select method for the participants table
      };
    }
    return {
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
  });

  return {
    supabase: { from: mockFrom },
  };
});

const projectModel = require('../../model/project2');

describe('getProjectsByUser error handling', () => {
  it('returns empty array when user has no projects', async () => {
    const userId = 'test-user-id';
    const result = await projectModel.getProjectsByUser(userId);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });
});