jest.mock("../../db/supabase", () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: "p1", collaborators: ["u1","u2"] }, error: null
    });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockEq     = jest.fn(() => ({ select: mockSelect }));
    const mockUpdate = jest.fn(() => ({ eq: mockEq }));
    const mockFrom   = jest.fn(() => ({ update: mockUpdate }));
    return { supabase: { from: mockFrom } };
  });
  
  const model = require("../../model/project");
  
  test("updateCollaborators: dedupes and updates", async () => {
    const res = await model.updateCollaborators("p1", ["u1","u1","u2"]);
    expect(res).toEqual({ id: "p1", collaborators: ["u1","u2"] });
  });
  