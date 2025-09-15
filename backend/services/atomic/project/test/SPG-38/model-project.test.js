const project = require('../../model/project');

describe('Project Model', () => {
  test('getAllProjects should return an array', async () => {
    const result = await project.getAllProjects();
    expect(Array.isArray(result)).toBe(true);
  });

  test('addNewProj should accept project data', async () => {
    const testProject = {
      title: 'Test Project',
      description: 'Test Description',
      collaborators: ['user1'],
      owner: 'testuser',
      task_list: []
    };

    const result = await project.addNewProj(testProject);
    // Expect the new response format
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBe('Project created successfully');
    expect(result.data).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });
});
