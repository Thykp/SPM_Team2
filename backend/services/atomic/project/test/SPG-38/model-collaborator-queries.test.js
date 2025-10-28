const { supabase } = require('../../db/supabase');
const model = require('../../model/project2');

describe('getProjectCollaborators function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully get project collaborators', async () => {
    const mockCollaborators = [
      { profile_id: 'user-1', is_owner: true, created_at: '2025-01-01' },
      { profile_id: 'user-2', is_owner: false, created_at: '2025-01-02' },
    ];

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockCollaborators,
          error: null,
        }),
      }),
    });

    const result = await model.getProjectCollaborators('proj-123');

    expect(result).toEqual(mockCollaborators);
    expect(supabase.from).toHaveBeenCalledWith('revamped_project_participant');
  });

  test('should return empty array when no collaborators', async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    const result = await model.getProjectCollaborators('proj-123');

    expect(result).toEqual([]);
  });

  test('should return empty array when data is null', async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    });

    const result = await model.getProjectCollaborators('proj-123');

    expect(result).toEqual([]);
  });

  test('should throw error when database query fails', async () => {
    const mockError = { message: 'Database error', code: 'XX000' };

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    });

    await expect(model.getProjectCollaborators('proj-123')).rejects.toMatchObject(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching project collaborators:',
      mockError
    );
  });
});

describe('getProjectWithCollaborators function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully get project with collaborators', async () => {
    const mockProject = { id: 'proj-123', title: 'Test', description: 'Test' };
    const mockCollaborators = [
      { profile_id: 'owner-123', is_owner: true, created_at: '2025-01-01' },
      { profile_id: 'collab-1', is_owner: false, created_at: '2025-01-02' },
    ];

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProject,
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockCollaborators,
            error: null,
          }),
        }),
      });

    const result = await model.getProjectWithCollaborators('proj-123');

    expect(result.id).toBe('proj-123');
    expect(result.collaborators).toEqual(['owner-123', 'collab-1']);
    expect(result.owner).toBe('owner-123');
  });

  test('should return null when project not found', async () => {
    supabase.from = jest.fn().mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      }),
    });

    const result = await model.getProjectWithCollaborators('non-existent');

    expect(result).toBeNull();
  });

  test('should handle project with no collaborators', async () => {
    const mockProject = { id: 'proj-123', title: 'Test' };

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProject,
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

    const result = await model.getProjectWithCollaborators('proj-123');

    expect(result.collaborators).toEqual([]);
    expect(result.owner).toBeNull();
  });

  test('should throw error when collaborators fetch fails', async () => {
    const mockProject = { id: 'proj-123', title: 'Test' };
    const mockError = { message: 'Collab fetch failed', code: 'XX000' };

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProject,
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

    await expect(model.getProjectWithCollaborators('proj-123')).rejects.toMatchObject(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching collaborators:', mockError);
  });
});

