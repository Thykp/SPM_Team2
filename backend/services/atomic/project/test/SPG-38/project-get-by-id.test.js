const request = require("supertest");

jest.mock("../../model/project2", () => ({
  getProjectById: jest.fn(),
  getAllProjects: jest.fn(),
}));

const { getProjectById, getAllProjects } = require("../../model/project2");
const app = require("../../app");

describe("GET /project/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  it("200: returns project by ID", async () => {
    const mockProject = {
      id: "proj-123",
      title: "Test Project",
      description: "Test Description",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    getProjectById.mockResolvedValue(mockProject);

    const res = await request(app).get("/project/proj-123");

    expect(res.status).toBe(200);
    expect(getProjectById).toHaveBeenCalledWith("proj-123");
    expect(res.body).toEqual(mockProject);
  });

  it("404: project not found", async () => {
    getProjectById.mockResolvedValue(null);

    const res = await request(app).get("/project/nonexistent-id");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Project not found");
  });

  it("500: handles database error", async () => {
    getProjectById.mockRejectedValue(new Error("Database error"));

    const res = await request(app).get("/project/proj-123");

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});