const { supabase } = require('../../db/supabase');
const model = require('../../model/project2');

describe('changeProjectOwner rollback scenarios', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should rollback when adding new owner fails', async () => {
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
                  data: { profile_id: 'old-owner-123' },
                  error: null,
                }),
              }),
            }),
        }),
      })
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
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Add failed' },
        }),
      })
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

    await expect(model.changeProjectOwner('proj-123', 'new-owner-456')).rejects.toMatchObject({
      message: 'Add failed',
    });
  });

  test('should rollback when promoting existing participant fails', async () => {
    supabase.from = jest.fn()
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
      .mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Promote failed' },
            }),
          }),
        }),
      })
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

    await expect(model.changeProjectOwner('proj-123', 'new-owner-456')).rejects.toMatchObject({
      message: 'Promote failed',
    });
  });

  test('should successfully change owner when new owner is not a participant', async () => {
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
                  data: { profile_id: 'old-owner-123' },
                  error: null,
                }),
              }),
            }),
        }),
      })
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
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

    const result = await model.changeProjectOwner('proj-123', 'new-external-owner');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Project owner changed successfully');
  });
});

