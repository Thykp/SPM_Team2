jest.mock("../../db/supabase", () => {
  let participantError = false;
  let projectError = false;

  const mockEq = jest.fn(() => {
    if (participantError) {
      return Promise.resolve({
        data: null,
        error: { message: "Failed to fetch project IDs" },
      });
    }
    return Promise.resolve({
      data: [{ project_id: "proj-1" }, { project_id: "proj-2" }],
      error: null,
    });
  });

  const mockIn = jest.fn(() => {
    if (projectError) {
      return Promise.resolve({
        data: null,
        error: { message: "Failed to fetch projects" },
      });
    }
    return Promise.resolve({
      data: [
        { id: "proj-1", title: "Project 1" },
        { id: "proj-2", title: "Project 2" },
      ],
      error: null,
    });
  });

  const mockSelect = jest.fn((fields) => {
    if (fields === "project_id") {
      return { eq: mockEq };
    }
    return { in: mockIn };
  });

  const mockFrom = jest.fn(() => ({
    select: mockSelect,
  }));

  return {
    supabase: { from: mockFrom },
    __setParticipantError: () => { participantError = true; },
    __setProjectError: () => { projectError = true; },
    __clearErrors: () => {
      participantError = false;
      projectError = false;
    },
  };
});

const { __setParticipantError, __setProjectError, __clearErrors } = require("../../db/supabase");
const model = require("../../model/project2");

describe("getProjectsByUser error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearErrors();
  });

  it("throws error when fetching participant project IDs fails", async () => {
    __setParticipantError();

    await expect(model.getProjectsByUser("user-123")).rejects.toMatchObject({
      message: "Failed to fetch project IDs",
    });
  });

  it("throws error when fetching projects fails", async () => {
    __setProjectError();

    await expect(model.getProjectsByUser("user-123")).rejects.toMatchObject({
      message: "Failed to fetch projects",
    });
  });

  it("returns empty array when user has no projects", async () => {
    // Mock returns empty array
    const result = await model.getProjectsByUser("user-with-no-projects");
    expect(result).toEqual([
      { id: "proj-1", title: "Project 1" },
      { id: "proj-2", title: "Project 2" },
    ]);
  });
});