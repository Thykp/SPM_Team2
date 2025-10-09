jest.mock("../../db/supabase", () => {
  let mockProjectData = { 
    id: "test-proj-123", 
    title: "Test Project",
    description: "Test Description" 
  };

  const mockSingleForGet = jest.fn(() =>
    Promise.resolve({ data: mockProjectData, error: null })
  );

  const mockSingleForUpdate = jest.fn(() =>
    Promise.resolve({ 
      data: { ...mockProjectData, updated_at: new Date().toISOString() }, 
      error: null 
    })
  );

  const mockSelect = jest.fn(() => ({ single: mockSingleForUpdate }));
  
  const mockEqForUpdate = jest.fn(() => ({ select: mockSelect }));
  
  const mockUpdate = jest.fn(() => ({ eq: mockEqForUpdate }));

  const mockEqForGet = jest.fn(() => ({ single: mockSingleForGet }));

  const mockSelectForGet = jest.fn(() => ({ eq: mockEqForGet }));

  const mockFrom = jest.fn((table) => {
    if (table === 'revamped_project') {
      return { 
        select: mockSelectForGet,
        update: mockUpdate
      };
    }
  });

  return {
    supabase: { from: mockFrom }
  };
});

const request = require("supertest");
const app = require("../../app");

const testProjectId = "test-proj-123";

describe("PUT /project/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("200: updates project successfully", async () => {
    const res = await request(app)
      .put(`/project/${testProjectId}`)
      .send({
        title: "Updated Title",
        description: "Updated Description"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("200: accepts empty title (no validation)", async () => {
    const res = await request(app)
      .put(`/project/${testProjectId}`)
      .send({
        title: "",
        description: "Valid Description"
      });

    expect(res.status).toBe(200);
  });

  test("200: accepts partial updates", async () => {
    const res = await request(app)
      .put(`/project/${testProjectId}`)
      .send({ description: "Only description updated" });

    expect(res.status).toBe(200);
  });

  test("200: accepts collaborators as array", async () => {
    const res = await request(app)
      .put(`/project/${testProjectId}`)
      .send({
        title: "Test",
        description: "Test",
        collaborators: ["user1", "user2"]
      });

    expect(res.status).toBe(200);
  });

  test("200: accepts tasklist as array", async () => {
    const res = await request(app)
      .put(`/project/${testProjectId}`)
      .send({
        title: "Test",
        description: "Test",
        tasklist: ["task1", "task2"]
      });

    expect(res.status).toBe(200);
  });
});