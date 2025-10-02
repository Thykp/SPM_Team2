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

    const result = await project.addNewProject(testProject);
    // Expect the new response format
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBe('Project created successfully');
    expect(result.data).toBeDefined();
    expect(result.data.title).toBe('Test Project');
    expect(result.data.description).toBe('Test Description');
    expect(result.timestamp).toBeDefined();
  });
});
