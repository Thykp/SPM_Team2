jest.mock('../../db/supabase', () => {
  const mockSingle = jest.fn().mockResolvedValue({
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Project',
      description: 'Test Description',
      owner_id: '123e4567-e89b-12d3-a456-426614174000'
    },
    error: null
  });

  const mockSelect = jest.fn(() => ({ single: mockSingle }));
  const mockInsert = jest.fn(() => ({ select: mockSelect }));
  const mockFrom = jest.fn(() => ({ 
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: mockInsert 
  }));

  return {
    supabase: { from: mockFrom }
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
      description: 'Test Description'
    };
    
    const ownerId = '123e4567-e89b-12d3-a456-426614174000';

    const result = await project.addNewProject(testProject, ownerId);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBe('Project created successfully');
    expect(result.data).toBeDefined();
    expect(result.data.title).toBe('Test Project');
    expect(result.data.description).toBe('Test Description');
    expect(result.timestamp).toBeDefined();
  });
});