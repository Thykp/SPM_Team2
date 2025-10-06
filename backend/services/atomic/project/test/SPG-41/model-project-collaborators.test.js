const model = require("../../model/project2");

jest.mock("../../db/supabase", () => {
  const mockSingle = jest.fn(() => 
    Promise.resolve({ data: { profile_id: 'owner-123' }, error: null })
  );

  const mockEqForSelect2 = jest.fn(() => ({ single: mockSingle }));
  const mockEqForSelect1 = jest.fn(() => ({ eq: mockEqForSelect2 }));
  const mockSelect = jest.fn(() => ({ eq: mockEqForSelect1 }));

  const mockEqForDelete2 = jest.fn(() =>
    Promise.resolve({ data: null, error: null })
  );
  const mockEqForDelete1 = jest.fn(() => ({ eq: mockEqForDelete2 }));
  const mockDelete = jest.fn(() => ({ eq: mockEqForDelete1 }));

  const mockInsert = jest.fn(() =>
    Promise.resolve({ data: null, error: null })
  );

  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    delete: mockDelete,
    insert: mockInsert
  }));

  return {
    supabase: { from: mockFrom }
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
    expect(res.timestamp).toBeDefined();
  });

  test("updateCollaborators: handles empty array", async () => {
    const res = await model.updateCollaborators("p1", []);
    
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.timestamp).toBeDefined();
  });
});