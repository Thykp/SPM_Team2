jest.mock("../../db/supabase", () => {
  let shouldFail = false;

  const mockSingle = jest.fn(() => {
    if (shouldFail) {
      return Promise.resolve({
        data: null,
        error: { message: "Update constraint violation" },
      });
    }
    return Promise.resolve({
      data: { id: "proj-123", title: "Updated" },
      error: null,
    });
  });

  const mockSelect = jest.fn(() => ({ single: mockSingle }));
  const mockEq = jest.fn(() => ({ select: mockSelect }));
  const mockUpdate = jest.fn(() => ({ eq: mockEq }));
  const mockFrom = jest.fn(() => ({ update: mockUpdate }));

  return {
    supabase: { from: mockFrom },
    __setError: () => { shouldFail = true; },
    __clearError: () => { shouldFail = false; },
  };
});

const { __setError, __clearError } = require("../../db/supabase");
const model = require("../../model/project2");

describe("updateProject database error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearError();
  });

  it("throws error when database update fails", async () => {
    __setError();

    await expect(
      model.updateProject("proj-123", { title: "New Title" })
    ).rejects.toMatchObject({
      message: "Update constraint violation",
    });
  });
});