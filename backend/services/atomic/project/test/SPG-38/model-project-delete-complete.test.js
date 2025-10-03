jest.mock("../../db/supabase", () => {
  let shouldFail = false;

  const mockEq = jest.fn(() => {
    if (shouldFail) {
      return Promise.resolve({
        error: { message: "Cannot delete project with tasks", code: "23503" },
      });
    }
    return Promise.resolve({ error: null });
  });

  const mockDelete = jest.fn(() => ({ eq: mockEq }));
  const mockFrom = jest.fn(() => ({ delete: mockDelete }));

  return {
    supabase: { from: mockFrom },
    __setError: () => { shouldFail = true; },
    __clearError: () => { shouldFail = false; },
  };
});

const { __setError, __clearError } = require("../../db/supabase");
const model = require("../../model/project2");

describe("deleteProject function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearError();
  });

  it("successfully deletes a project", async () => {
    const result = await model.deleteProject("proj-123");

    expect(result).toMatchObject({
      success: true,
      message: "Project deleted successfully",
    });
    expect(result.timestamp).toBeDefined();
  });

  it("throws error when delete fails", async () => {
    __setError();

    await expect(model.deleteProject("proj-123")).rejects.toMatchObject({
      message: "Cannot delete project with tasks",
      code: "23503",
    });
  });
});