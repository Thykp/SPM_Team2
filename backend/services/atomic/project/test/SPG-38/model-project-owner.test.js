const { supabase } = require('../../db/supabase');
const model = require('../../model/project2');

describe('getProjectOwner function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully get project owner', async () => {
    const mockOwner = {
      profile_id: 'owner-123',
      is_owner: true,
      created_at: '2025-01-15T00:00:00.000Z',
    };

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn()
          .mockReturnValueOnce({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockOwner,
                error: null,
              }),
            }),
          }),
      }),
    });

    const result = await model.getProjectOwner('proj-123');

    expect(result).toEqual(mockOwner);
    expect(supabase.from).toHaveBeenCalledWith('revamped_project_participant');
  });

  test('should throw error when database query fails', async () => {
    const mockError = { message: 'Database error', code: 'XX000' };

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn()
          .mockReturnValueOnce({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
      }),
    });

    await expect(model.getProjectOwner('proj-123')).rejects.toMatchObject(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching project owner:', mockError);
  });

  test('should handle case when no owner found', async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn()
          .mockReturnValueOnce({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No rows returned', code: 'PGRST116' },
              }),
            }),
          }),
      }),
    });

    await expect(model.getProjectOwner('proj-123')).rejects.toMatchObject({
      message: 'No rows returned',
      code: 'PGRST116',
    });
  });
});

