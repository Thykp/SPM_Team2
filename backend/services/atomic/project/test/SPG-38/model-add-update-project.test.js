const { supabase } = require('../../db/supabase');
const model = require('../../model/project2');

describe('addNewProject function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully add project with owner only', async () => {
    const mockProjectId = 'new-proj-123';

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockProjectId, title: 'Test', description: 'Test' },
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

    const result = await model.addNewProject(
      { title: 'Test', description: 'Test' },
      'owner-123'
    );

    expect(result.id).toBe(mockProjectId);
    expect(result.collaborators).toEqual([]);
    expect(result.owner).toBe('owner-123');
  });

  test('should successfully add project with collaborators', async () => {
    const mockProjectId = 'new-proj-456';

    supabase.from = jest.fn()
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockProjectId, title: 'Test', description: 'Test' },
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

    const result = await model.addNewProject(
      { title: 'Test', description: 'Test' },
      'owner-123',
      ['collab-1', 'collab-2']
    );

    expect(result.collaborators).toEqual(['collab-1', 'collab-2']);
  });

  test('should throw error when ownerId is missing', async () => {
    await expect(
      model.addNewProject({ title: 'Test', description: 'Test' }, null)
    ).rejects.toMatchObject({ message: 'Owner ID is required' });
  });

  test('should throw error when insert project fails', async () => {
    const mockError = { message: 'Insert failed', code: '23505' };

    supabase.from = jest.fn().mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    });

    await expect(
      model.addNewProject({ title: 'Test', description: 'Test' }, 'owner-123')
    ).rejects.toMatchObject(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error inserting project:', mockError);
  });
});

describe('updateProject function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully update title', async () => {
    const mockUpdated = { id: 'proj-123', title: 'Updated', description: 'Original' };

    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUpdated,
              error: null,
            }),
          }),
        }),
      }),
    });

    const result = await model.updateProject('proj-123', { title: 'Updated' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockUpdated);
  });

  test('should successfully update description', async () => {
    const mockUpdated = { id: 'proj-123', title: 'Original', description: 'Updated Desc' };

    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUpdated,
              error: null,
            }),
          }),
        }),
      }),
    });

    const result = await model.updateProject('proj-123', { description: 'Updated Desc' });

    expect(result.success).toBe(true);
  });

  test('should successfully update both title and description', async () => {
    const mockUpdated = { id: 'proj-123', title: 'New Title', description: 'New Desc' };

    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUpdated,
              error: null,
            }),
          }),
        }),
      }),
    });

    const result = await model.updateProject('proj-123', {
      title: 'New Title',
      description: 'New Desc',
    });

    expect(result.success).toBe(true);
  });

  test('should throw error when no valid fields provided', async () => {
    await expect(model.updateProject('proj-123', { invalidField: 'test' })).rejects.toMatchObject({
      message: 'No valid fields provided for update',
    });
  });

  test('should throw error when update fails', async () => {
    const mockError = { message: 'Update failed', code: 'XX000' };

    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      }),
    });

    await expect(model.updateProject('proj-123', { title: 'Updated' })).rejects.toMatchObject(
      mockError
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating project:', mockError);
  });
});

