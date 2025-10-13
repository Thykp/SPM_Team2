jest.mock('../../db/supabase', () => {
  const mockSelect = jest.fn().mockResolvedValue({
    data: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Project',
        description: 'Test Description',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    error: null,
  });

  const mockInsert = jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Project',
          description: 'Test Description',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      }),
    })),
  }));

  const mockParticipantsInsert = jest.fn().mockResolvedValue({
    data: [
      {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        profile_id: '123e4567-e89b-12d3-a456-426614174000',
        is_owner: true,
      },
    ],
    error: null,
  });

  const mockFrom = jest.fn((tableName) => {
    if (tableName === 'revamped_project') {
      return {
        select: mockSelect, // Mock the select method for the project table
        insert: mockInsert, // Mock the insert method for the project table
      };
    }
    if (tableName === 'revamped_project_participant') {
      return {
        insert: mockParticipantsInsert, // Mock the insert method for the participants table
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

const project = require('../../model/project2');

describe('Project Model', () => {
  test('getAllProjects should return an array', async () => {
    const result = await project.getAllProjects();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  test('addNewProject should accept project data', async () => {
    const testProject = {
      title: 'Test Project',
      description: 'Test Description',
    };

    const ownerId = '123e4567-e89b-12d3-a456-426614174000';

    const result = await project.addNewProject(testProject, ownerId);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toBe('Test Project');
    expect(result.description).toBe('Test Description');
    expect(result.created_at).toBeDefined();
    expect(result.updated_at).toBeDefined();
  });
});