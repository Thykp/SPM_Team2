jest.mock("../../db/supabase", () => {
  let deleteError = false;
  let insertError = false;

  const mockEq = jest.fn(() => {
    if (deleteError) {
      return Promise.resolve({
        error: { message: "Foreign key constraint on delete" },
      });
    }
    return Promise.resolve({ error: null });
  });

  const mockDelete = jest.fn(() => ({ eq: mockEq }));

  const mockInsert = jest.fn(() => {
    if (insertError) {
      return Promise.resolve({
        error: { message: "Invalid profile_id" },
      });
    }
    return Promise.resolve({
      data: [{ project_id: "p1", profile_id: "u1" }],
      error: null,
    });
  });

  const mockFrom = jest.fn(() => ({
    delete: mockDelete,
    insert: mockInsert,
  }));

  return {
    supabase: { from: mockFrom },
    __setDeleteError: () => { deleteError = true; },
    __setInsertError: () => { insertError = true; },
    __clearErrors: () => {
      deleteError = false;
      insertError = false;
    },
  };
});

const { __setDeleteError, __setInsertError, __clearErrors } = require("../../db/supabase");
const model = require("../../model/project2");

describe("updateCollaborators database error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearErrors();
  });

  it("throws error when delete operation fails", async () => {
    __setDeleteError();

    await expect(
      model.updateCollaborators("proj-123", ["u1"])
    ).rejects.toMatchObject({
      message: "Foreign key constraint on delete",
    });
  });

  it("throws error when insert operation fails", async () => {
    __setInsertError();

    await expect(
      model.updateCollaborators("proj-123", ["u1"])
    ).rejects.toMatchObject({
      message: "Invalid profile_id",
    });
  });
});