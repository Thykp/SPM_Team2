jest.mock("../../db/supabase", () => {
  const mockSingle = jest.fn().mockResolvedValue({
    data: {
      id: "proj-123",
      title: "Updated Title",
      description: "Updated Description",
      updated_at: "2025-10-03T00:00:00Z",
    },
    error: null,
  });

  const mockSelect = jest.fn(() => ({
    single: mockSingle,
  }));

  const mockEq = jest.fn(() => ({
    select: mockSelect,
  }));

  const mockUpdate = jest.fn(() => ({
    eq: mockEq,
  }));

  const mockFrom = jest.fn(() => ({
    update: mockUpdate,
  }));

  return {
    supabase: {
      from: mockFrom,
    },
  };
});

const model = require("../../model/project2");

describe("updateProject model function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates project with title only", async () => {
    const updateData = {
      title: "Updated Title",
    };

    const result = await model.updateProject("proj-123", updateData);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Project updated successfully");
    expect(result.data.title).toBe("Updated Title");
  });

  it("updates project with description only", async () => {
    const updateData = {
      description: "Updated Description",
    };

    const result = await model.updateProject("proj-123", updateData);

    expect(result.success).toBe(true);
    expect(result.data.description).toBe("Updated Description");
  });

  it("updates project with both title and description", async () => {
    const updateData = {
      title: "Updated Title",
      description: "Updated Description",
    };

    const result = await model.updateProject("proj-123", updateData);

    expect(result.success).toBe(true);
    expect(result.data.title).toBe("Updated Title");
    expect(result.data.description).toBe("Updated Description");
  });

  it("throws error when no valid fields provided", async () => {
    await expect(model.updateProject("proj-123", {})).rejects.toThrow(
      "No valid fields provided for update"
    );
  });

  it("throws error when only invalid fields provided", async () => {
    await expect(model.updateProject("proj-123", { invalidField: "test" })).rejects.toThrow(
      "No valid fields provided for update"
    );
  });
});