jest.mock("../../db/supabase", () => {
  let shouldReturnError = false;
  let errorCode = null;

  const mockSingle = jest.fn(() => {
    if (shouldReturnError) {
      return Promise.resolve({
        data: null,
        error: { code: errorCode, message: "Test error" },
      });
    }
    return Promise.resolve({
      data: { id: "proj-123", title: "Test Project" },
      error: null,
    });
  });

  const mockEq = jest.fn(() => ({
    single: mockSingle,
  }));

  const mockSelect = jest.fn(() => ({
    eq: mockEq,
  }));

  const mockFrom = jest.fn(() => ({
    select: mockSelect,
  }));

  return {
    supabase: {
      from: mockFrom,
    },
    __setError: (code) => {
      shouldReturnError = true;
      errorCode = code;
    },
    __clearError: () => {
      shouldReturnError = false;
      errorCode = null;
    },
  };
});

const { __setError, __clearError } = require("../../db/supabase");
const model = require("../../model/project2");

describe("getProjectById model function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearError();
  });

  it("returns project when found", async () => {
    const result = await model.getProjectById("proj-123");

    expect(result).toBeDefined();
    expect(result.id).toBe("proj-123");
    expect(result.title).toBe("Test Project");
  });

  it("returns null when project not found (PGRST116)", async () => {
    __setError("PGRST116");

    const result = await model.getProjectById("nonexistent-id");

    expect(result).toBeNull();
  });

  it("throws error for other database errors", async () => {
    __setError("OTHER_ERROR");

    await expect(model.getProjectById("proj-123")).rejects.toMatchObject({
      code: "OTHER_ERROR",
      message: "Test error",
    });
  });
});