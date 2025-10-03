/* Previous test file based on original database design */

// jest.mock("../../db/supabase", () => {
//     const mockSingle = jest.fn().mockResolvedValue({
//       data: { id: "p1", collaborators: ["u1","u2"] }, error: null
//     });
//     const mockSelect = jest.fn(() => ({ single: mockSingle }));
//     const mockEq     = jest.fn(() => ({ select: mockSelect }));
//     const mockUpdate = jest.fn(() => ({ eq: mockEq }));
//     const mockFrom   = jest.fn(() => ({ update: mockUpdate }));
//     return { supabase: { from: mockFrom } };
//   });
  
//   const model = require("../../model/project");
  
//   test("updateCollaborators: dedupes and updates", async () => {
//     const res = await model.updateCollaborators("p1", ["u1","u1","u2"]);
//     expect(res).toEqual({ id: "p1", collaborators: ["u1","u2"] });
//   });
  

/* New test file based on new database design */

const model = require("../../model/project2"); // Use project2 instead of project

jest.mock("../../db/supabase", () => {
  const mockEq = jest.fn().mockResolvedValue({
    data: null,
    error: null
  });
  
  const mockDelete = jest.fn(() => ({
    eq: mockEq
  }));

  const mockInsert = jest.fn().mockResolvedValue({
    data: [
      { project_id: "p1", profile_id: "u1" },
      { project_id: "p1", profile_id: "u2" }
    ],
    error: null
  });

  const mockFrom = jest.fn((table) => ({
    delete: mockDelete,
    insert: mockInsert
  }));

  return {
    supabase: {
      from: mockFrom
    }
  };
});

describe("updateCollaborators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updateCollaborators: dedupes and updates", async () => {
    const res = await model.updateCollaborators("p1", ["u1", "u1", "u2"]);
    
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.message).toBe("Collaborators updated successfully");
    expect(res.data).toEqual([
      { project_id: "p1", profile_id: "u1" },
      { project_id: "p1", profile_id: "u2" }
    ]);
  });
});