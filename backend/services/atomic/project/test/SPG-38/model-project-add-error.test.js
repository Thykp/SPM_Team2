jest.mock("../../db/supabase", () => {
  let shouldFail = false;

  const mockSelect = jest.fn(() => {
    if (shouldFail) {
      return Promise.resolve({
        data: null,
        error: { message: "Duplicate project title", code: "23505" },
      });
    }
    return Promise.resolve({
      data: [{ id: "new-proj", title: "New Project", description: "Test" }],
      error: null,
    });
  });

  const mockInsert = jest.fn(() => ({ select: mockSelect }));
  const mockFrom = jest.fn(() => ({ insert: mockInsert }));

  return {
    supabase: { from: mockFrom },
    __setError: () => { shouldFail = true; },
    __clearError: () => { shouldFail = false; },
  };
});

const { __setError, __clearError } = require("../../db/supabase");
const model = require("../../model/project2");

describe("addNewProject error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearError();
  });

  it("throws error when insert fails", async () => {
    __setError();

    await expect(
      model.addNewProject({ title: "Test", description: "Test" })
    ).rejects.toMatchObject({
      message: "Duplicate project title",
      code: "23505",
    });
  });
});