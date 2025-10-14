jest.mock('../../db/supabase', () => {
  const mockSingle = jest.fn().mockResolvedValue({
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Project',
      description: 'Test Description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    error: null,
  });

  const mockSelect = jest.fn(() => ({
    single: mockSingle,
  }));

  const mockInsert = jest.fn(() => ({
    select: mockSelect,
  }));

  const mockFrom = jest.fn(() => ({
    insert: mockInsert,
  }));

  return {
    supabase: { from: mockFrom },
  };
});

const project = require('../../model/project2');

describe('Project Model', () => {
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