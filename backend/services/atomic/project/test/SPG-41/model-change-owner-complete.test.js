const { supabase } = require('../../db/supabase');
const model = require('../../model/project2');

describe('changeProjectOwner function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully change owner when new owner is already a participant', async () => {
    supabase.from = jest.fn()
      // First call: check if new owner is participant
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { profile_id: 'new-owner-456', is_owner: false },
                  error: null,
                }),
              }),
            }),
        }),
      })
      // Second call: get current owner
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { profile_id: 'old-owner-123' },
                  error: null,
                }),
              }),
            }),
        }),
      })
      // Third call: demote old owner
      .mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })
      // Fourth call: promote new owner
      .mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

    const result = await model.changeProjectOwner('proj-123', 'new-owner-456');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Project owner changed successfully');
    expect(result.data.previous_owner).toBe('old-owner-123');
    expect(result.data.new_owner).toBe('new-owner-456');
  });

  test('should return success when user is already the owner', async () => {
    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { profile_id: 'same-owner-123' },
                  error: null,
                }),
              }),
            }),
        }),
      });

    const result = await model.changeProjectOwner('proj-123', 'same-owner-123');

    expect(result.success).toBe(true);
    expect(result.message).toBe('User is already the project owner');
  });

  test('should throw error when checking new owner fails', async () => {
    const mockError = { message: 'Check failed', code: 'XX000' };

    supabase.from = jest.fn().mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn()
          .mockReturnValueOnce({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
      }),
    });

    await expect(model.changeProjectOwner('proj-123', 'new-owner-456'))
      .rejects.toMatchObject(mockError);
  });

  test('should throw error when getting current owner fails', async () => {
    const mockError = { message: 'Get owner failed', code: 'XX000' };

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
        }),
      })
      .mockReturnValueOnce({
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

    await expect(model.changeProjectOwner('proj-123', 'new-owner-456'))
      .rejects.toMatchObject(mockError);
  });
});

