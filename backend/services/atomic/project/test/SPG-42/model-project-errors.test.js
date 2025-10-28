const { supabase } = require('../../db/supabase');
const model = require('../../model/project2');

describe('Project Model Error Scenarios', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('addNewProject rollback scenarios', () => {
    test('should rollback project creation when participant insert fails', async () => {
      const mockProjectId = 'new-proj-id';

      supabase.from = jest.fn()
        // First call: insert project
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
        // Second call: insert participants (fails)
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Participant insert failed' },
          }),
        })
        // Third call: rollback - delete project
        .mockReturnValueOnce({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        });

      await expect(
        model.addNewProject(
          { title: 'Test', description: 'Test' },
          'owner-123',
          ['collab-1']
        )
      ).rejects.toMatchObject({ message: 'Participant insert failed' });
    });
  });

  describe('updateProject error scenarios', () => {
    test('should throw error when no valid fields provided', async () => {
      await expect(
        model.updateProject('proj-123', { invalidField: 'test' })
      ).rejects.toMatchObject({ message: 'No valid fields provided for update' });
    });
  });

  describe('getProjectWithCollaborators error scenarios', () => {
    test('should throw error when fetching project fails', async () => {
      const mockError = { message: 'Project fetch failed', code: 'XX000' };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        });

      await expect(model.getProjectWithCollaborators('proj-123'))
        .rejects.toMatchObject(mockError);
    });

    test('should throw error when fetching collaborators fails', async () => {
      const mockError = { message: 'Collaborator fetch failed', code: 'XX000' };

      supabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'proj-123', title: 'Test' },
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

      await expect(model.getProjectWithCollaborators('proj-123'))
        .rejects.toMatchObject(mockError);
    });
  });
});

