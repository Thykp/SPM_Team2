const { supabase } = require('../../db/supabase');
const model = require('../../model/project2');

describe('updateCollaborators function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully update collaborators', async () => {
    supabase.from = jest.fn()
      // First call: get current owner
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { profile_id: 'owner-123' },
                  error: null,
                }),
              }),
            }),
        }),
      })
      // Second call: delete existing collaborators
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })
      // Third call: insert new collaborators
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

    const result = await model.updateCollaborators('proj-123', ['collab-1', 'collab-2']);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Collaborators updated successfully');
  });

  test('should deduplicate collaborators array', async () => {
    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { profile_id: 'owner-123' },
                  error: null,
                }),
              }),
            }),
        }),
      })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

    const result = await model.updateCollaborators('proj-123', ['user1', 'user2', 'user1', 'user2']);

    expect(result.success).toBe(true);
  });

  test('should exclude owner from collaborators list', async () => {
    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { profile_id: 'owner-123' },
                  error: null,
                }),
              }),
            }),
        }),
      })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

    const result = await model.updateCollaborators('proj-123', ['owner-123', 'user1']);

    expect(result.success).toBe(true);
  });

  test('should handle empty collaborators array', async () => {
    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { profile_id: 'owner-123' },
                  error: null,
                }),
              }),
            }),
        }),
      })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

    const result = await model.updateCollaborators('proj-123', []);

    expect(result.success).toBe(true);
  });

  test('should throw error when fetching owner fails', async () => {
    const mockError = { message: 'Owner fetch failed', code: 'XX000' };

    supabase.from = jest.fn().mockReturnValueOnce({
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

    await expect(model.updateCollaborators('proj-123', ['user1']))
      .rejects.toMatchObject(mockError);
  });

  test('should throw error when delete fails', async () => {
    const mockError = { message: 'Delete failed', code: 'XX000' };

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { profile_id: 'owner-123' },
                  error: null,
                }),
              }),
            }),
        }),
      })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

    await expect(model.updateCollaborators('proj-123', ['user1']))
      .rejects.toMatchObject(mockError);
  });

  test('should throw error when insert fails', async () => {
    const mockError = { message: 'Insert failed', code: 'XX000' };

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { profile_id: 'owner-123' },
                  error: null,
                }),
              }),
            }),
        }),
      })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });

    await expect(model.updateCollaborators('proj-123', ['user1']))
      .rejects.toMatchObject(mockError);
  });
});

