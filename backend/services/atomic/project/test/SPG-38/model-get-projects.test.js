const { supabase } = require('../../db/supabase');
const model = require('../../model/project2');

describe('getAllProjects function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully get all projects', async () => {
    const mockProjects = [
      { id: 'proj-1', title: 'Project 1', description: 'Desc 1' },
      { id: 'proj-2', title: 'Project 2', description: 'Desc 2' },
    ];

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: mockProjects,
        error: null,
      }),
    });

    const result = await model.getAllProjects();

    expect(result).toEqual(mockProjects);
    expect(supabase.from).toHaveBeenCalledWith('revamped_project');
  });

  test('should throw error when database query fails', async () => {
    const mockError = { message: 'Database error', code: 'XX000' };

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    });

    await expect(model.getAllProjects()).rejects.toThrow('Database error');
  });

  test('should return empty array when data is null', async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    const result = await model.getAllProjects();

    expect(result).toEqual([]);
  });
});

describe('getProjectById function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully get project by ID', async () => {
    const mockProject = { id: 'proj-123', title: 'Test Project' };

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProject,
            error: null,
          }),
        }),
      }),
    });

    const result = await model.getProjectById('proj-123');

    expect(result).toEqual(mockProject);
  });

  test('should return null when project not found (NOT_FOUND error)', async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      }),
    });

    const result = await model.getProjectById('non-existent');

    expect(result).toBeNull();
  });

  test('should throw error when database query fails with other error', async () => {
    const mockError = { code: 'XX000', message: 'Database error' };

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    });

    await expect(model.getProjectById('proj-123')).rejects.toMatchObject(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching project by ID:', mockError);
  });
});

describe('deleteProject function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should successfully delete project', async () => {
    supabase.from = jest.fn().mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    });

    const result = await model.deleteProject('proj-123');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Project deleted successfully');
    expect(result.timestamp).toBeDefined();
  });

  test('should throw error when delete fails', async () => {
    const mockError = { message: 'Delete failed', code: '23503' };

    supabase.from = jest.fn().mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    });

    await expect(model.deleteProject('proj-123')).rejects.toMatchObject(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting project:', mockError);
  });
});

