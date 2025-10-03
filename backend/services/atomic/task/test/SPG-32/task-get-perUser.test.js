// backend/services/atomic/task/test/SPG-32/task-get-perUser.test.js
const request = require("supertest");

// Mock the model to avoid DB dependency
jest.mock("../../model/task", () => ({
  getTasksByUsers: jest.fn(),
}));

const { getTasksByUsers } = require("../../model/task");
const app = require("../../app");

describe("GET /task/by-user/:user_id (revamped, mocked)", () => {
  const reqUserId = "588fb335-9986-4c93-872e-6ef103c97f92";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("200 and returns tasks for the user via participant join", async () => {
    const fake = [
      {
        id: "t-123",
        title: "Prepare report",
        deadline: "2025-10-01T10:00:00Z",
        status: "Ongoing",
        project_id: "p-1",
        parent_task_id: null,
      },
    ];
    getTasksByUsers.mockResolvedValue(fake);

    const res = await request(app)
      .get(`/task/by-user/${reqUserId}`)
      .expect("Content-Type", /json/);

    expect(getTasksByUsers).toHaveBeenCalledWith([reqUserId]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fake);
  });

  it("500 when model throws", async () => {
    getTasksByUsers.mockRejectedValue(new Error("db down"));

    const res = await request(app).get(`/task/by-user/${reqUserId}`);

    expect(getTasksByUsers).toHaveBeenCalledWith([reqUserId]);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "db down" });
  });
});
