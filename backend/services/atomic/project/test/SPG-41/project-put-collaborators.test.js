const request = require("supertest");

jest.mock("../../model/project", () => ({
  updateCollaborators: jest.fn(),
}));

const { updateCollaborators } = require("../../model/project");
const app = require("../../app");

describe("PUT /project/:id/collaborators", () => {
  beforeEach(() => jest.clearAllMocks());

  it("200: updates collaborators", async () => {
    const projectId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const body = { collaborators: ["u1","u2","u2"] };
    updateCollaborators.mockResolvedValue({ id: projectId, collaborators: ["u1","u2"] });

    const res = await request(app)
      .put(`/project/${projectId}/collaborators`)
      .send(body);

    expect(updateCollaborators).toHaveBeenCalledWith(projectId, body.collaborators);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.project).toEqual({ id: projectId, collaborators: ["u1","u2"] });
  });

  it("400: rejects non-array body", async () => {
    const res = await request(app)
      .put("/project/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/collaborators")
      .send({ collaborators: "not-an-array" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "collaborators must be an array of UUIDs" });
    expect(updateCollaborators).not.toHaveBeenCalled();
  });

  it("500: bubbles up model error", async () => {
    updateCollaborators.mockRejectedValue(new Error("db down"));
    const res = await request(app)
      .put("/project/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/collaborators")
      .send({ collaborators: ["u1"] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "db down" });
  });
});
