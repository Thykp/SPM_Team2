const request = require("supertest");

jest.mock("../../model/project2", () => ({
  getProjectById: jest.fn(),
  updateProject: jest.fn(),
}));

const { getProjectById, updateProject } = require("../../model/project2");
const app = require("../../app");

describe("PUT /project/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  it("200: updates project successfully", async () => {
    const projectId = "proj-123";
    const updateData = {
      title: "Updated Title",
      description: "Updated Description",
    };

    getProjectById.mockResolvedValue({ id: projectId, title: "Old Title" });
    updateProject.mockResolvedValue({
      success: true,
      message: "Project updated successfully",
      data: { id: projectId, ...updateData },
      timestamp: "2025-10-03T00:00:00Z",
    });

    const res = await request(app)
      .put(`/project/${projectId}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(updateProject).toHaveBeenCalledWith(projectId, updateData);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Updated Title");
  });

  it("404: project not found", async () => {
    getProjectById.mockResolvedValue(null);

    const res = await request(app)
      .put("/project/nonexistent-id")
      .send({ title: "New Title" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Project not found");
  });

  it("400: empty update data", async () => {
    getProjectById.mockResolvedValue({ id: "proj-123" });

    const res = await request(app)
      .put("/project/proj-123")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Update data is required");
  });

  it("400: invalid collaborators format", async () => {
    getProjectById.mockResolvedValue({ id: "proj-123" });

    const res = await request(app)
      .put("/project/proj-123")
      .send({ collaborators: "not-an-array" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("collaborators must be an array of UUIDs");
  });

  it("400: invalid tasklist format", async () => {
    getProjectById.mockResolvedValue({ id: "proj-123" });

    const res = await request(app)
      .put("/project/proj-123")
      .send({ tasklist: "not-an-array" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("tasklist must be an array of task IDs");
  });

  it("400: invalid task_list format", async () => {
    getProjectById.mockResolvedValue({ id: "proj-123" });

    const res = await request(app)
      .put("/project/proj-123")
      .send({ task_list: "not-an-array" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("tasklist must be an array of task IDs");
  });

  it("500: handles update error", async () => {
    getProjectById.mockResolvedValue({ id: "proj-123" });
    updateProject.mockRejectedValue(new Error("Update failed"));

    const res = await request(app)
      .put("/project/proj-123")
      .send({ title: "New Title" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});