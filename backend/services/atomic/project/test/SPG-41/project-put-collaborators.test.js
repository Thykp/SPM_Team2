const request = require("supertest");

jest.mock("../../model/project2", () => ({
  updateCollaborators: jest.fn(),
}));

const { updateCollaborators } = require("../../model/project2"); // Use project2 instead of project
const app = require("../../app");

describe("PUT /project/:id/collaborators", () => {
  beforeEach(() => jest.clearAllMocks());

  it("200: updates collaborators", async () => {
    const projectId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const body = { collaborators: ["u1", "u2", "u2"] };
    updateCollaborators.mockResolvedValue({
      success: true,
      message: "Collaborators updated successfully",
      data: [
        { project_id: projectId, profile_id: "u1" },
        { project_id: projectId, profile_id: "u2" },
      ],
      timestamp: "2025-10-01T12:00:00.000Z",
    });

    const res = await request(app)
      .put(`/project/${projectId}/collaborators`)
      .send(body);

    expect(updateCollaborators).toHaveBeenCalledWith(projectId, body.collaborators);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Collaborators updated successfully");
    expect(res.body.data).toEqual([
      { project_id: projectId, profile_id: "u1" },
      { project_id: projectId, profile_id: "u2" },
    ]);
    expect(res.body.timestamp).toBeDefined();
  });

  it("400: rejects non-array body", async () => {
    const res = await request(app)
      .put("/project/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/collaborators")
      .send({ collaborators: "not-an-array" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Collaborators must be an array of UUIDs" });
    expect(updateCollaborators).not.toHaveBeenCalled();
  });

  it("500: bubbles up model error", async () => {
    updateCollaborators.mockRejectedValue(new Error("Database error"));
    const res = await request(app)
      .put("/project/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/collaborators")
      .send({ collaborators: ["u1"] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Database error" });
  });
});