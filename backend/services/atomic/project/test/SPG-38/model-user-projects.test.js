const { supabase } = require('../../db/supabase');
const model = require('../../model/project2');

describe('getProjectsByUser function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully get projects by user with enrichment', async () => {
    const mockParticipantProjects = [
      { project_id: 'proj-1' },
      { project_id: 'proj-2' },
    ];
    const mockProjects = [
      { id: 'proj-1', title: 'Project 1' },
      { id: 'proj-2', title: 'Project 2' },
    ];
    const mockCollabs1 = [
      { profile_id: 'owner-123', is_owner: true },
      { profile_id: 'user-123', is_owner: false },
    ];
    const mockCollabs2 = [
      { profile_id: 'owner-456', is_owner: true },
      { profile_id: 'user-123', is_owner: false },
    ];

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockParticipantProjects,
            error: null,
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockProjects,
            error: null,
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockCollabs1,
            error: null,
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockCollabs2,
            error: null,
          }),
        }),
      });

    const result = await model.getProjectsByUser('user-123');

    expect(result).toHaveLength(2);
    expect(result[0].collaborators).toEqual(['owner-123', 'user-123']);
    expect(result[0].owner).toBe('owner-123');
  });

  test('should return empty array when user has no projects', async () => {
    supabase.from = jest.fn().mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    const result = await model.getProjectsByUser('user-no-projects');

    expect(result).toEqual([]);
  });

  test('should handle null participant projects', async () => {
    supabase.from = jest.fn().mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    });

    const result = await model.getProjectsByUser('user-no-projects');

    expect(result).toEqual([]);
  });

  test('should throw error when participant fetch fails', async () => {
    const mockError = { message: 'Participant query failed' };

    supabase.from = jest.fn().mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    });

    await expect(model.getProjectsByUser('user-123')).rejects.toMatchObject(
      new Error(mockError.message)
    );
  });

  test('should throw error when project fetch fails', async () => {
    const mockParticipantProjects = [{ project_id: 'proj-1' }];
    const mockError = { message: 'Project query failed' };

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockParticipantProjects,
            error: null,
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

    await expect(model.getProjectsByUser('user-123')).rejects.toMatchObject(
      new Error(mockError.message)
    );
  });

  test('should throw error when collaborator enrichment fails', async () => {
    const mockParticipantProjects = [{ project_id: 'proj-1' }];
    const mockProjects = [{ id: 'proj-1', title: 'Project 1' }];
    const mockError = { message: 'Collab enrichment failed' };

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockParticipantProjects,
            error: null,
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockProjects,
            error: null,
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

    await expect(model.getProjectsByUser('user-123')).rejects.toMatchObject(mockError);
  });
});

