// test/notificationHandler.test.js
const {
  handleDeadlineReminder,
  handleUpdate,
  handleAddedToResource,
  getUserPreferences,
  getTaskDetails,
} = require("../services/notificationHandler");

const websocket = require("../services/websocket");
const postSupabase = require("../services/postSupabase");
const email = require("../services/email");
const axios = require("axios");

jest.mock("../services/websocket", () => ({
  broadcastToUser: jest.fn(),
  formatWsAdded: jest.fn().mockImplementation(p => ({ ...p, id: "uuid-1234" })),
  formatWsReminder: jest.fn().mockImplementation(p => ({ ...p, id: "uuid-1234" })),
  formatWsUpdate: jest.fn(),
}));

jest.mock("../services/postSupabase", () => ({
  postToSupabase: jest.fn(),
}));

jest.mock("../services/email", () => ({
  sendDeadlineOrAddedEmail: jest.fn(),
  sendUpdates: jest.fn(),
}));

jest.mock("axios");

describe("Notification Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------- getUserPreferences --------------------
  describe("getUserPreferences", () => {
    it("returns preferences from API", async () => {
      axios.get.mockResolvedValueOnce({ data: { email: "a@b.com", delivery_method: ["in-app"] } });
      const prefs = await getUserPreferences("user1");
      expect(prefs.email).toBe("a@b.com");
      expect(prefs.delivery_method).toContain("in-app");
    });

    it("returns default on axios failure", async () => {
      axios.get.mockRejectedValueOnce(new Error("Network Error"));
      const prefs = await getUserPreferences("userX");
      expect(prefs).toEqual({ email: "", delivery_method: [] });
    });
  });

  // -------------------- getTaskDetails --------------------
  describe("getTaskDetails", () => {
    it("returns task details from API", async () => {
      axios.get.mockResolvedValueOnce({ data: { title: "Task1", priority: 5 } });
      const task = await getTaskDetails("task1");
      expect(task.title).toBe("Task1");
    });

    it("returns empty array on axios failure", async () => {
      axios.get.mockRejectedValueOnce(new Error("Task API down"));
      const task = await getTaskDetails("taskX");
      expect(task).toEqual([]);
    });
  });

  // -------------------- handleDeadlineReminder --------------------
  describe("handleDeadlineReminder", () => {
    it("does nothing if no user_id", async () => {
      await handleDeadlineReminder({});
      expect(websocket.broadcastToUser).not.toHaveBeenCalled();
    });

    it("processes reminder if user_id exists", async () => {
      const payload = { user_id: "user1", resource_id: "task1" };
      axios.get.mockImplementation((url) => {
        if(url.includes("preferences")) return Promise.resolve({ data: { email: "a@b.com", delivery_method: ["in-app","email"] } });
        if(url.includes("/task/")) return Promise.resolve({ data: { title: "Task1", priority: 8, description: "Desc", status: "Open", project_id: "p1", deadline: "2025-10-30T10:00:00Z" } });
      });

      await handleDeadlineReminder(payload);

      expect(websocket.formatWsReminder).toHaveBeenCalled();
      expect(websocket.broadcastToUser).toHaveBeenCalledWith("user1", expect.objectContaining({ id: "uuid-1234" }));
      expect(postSupabase.postToSupabase).toHaveBeenCalled();
      expect(email.sendDeadlineOrAddedEmail).toHaveBeenCalled();
    });
  });

  // -------------------- handleUpdate --------------------
  describe("handleUpdate", () => {
    it("skips payloads with missing resource_type or resource_id", async () => {
        const payloads = [
            { update_type: "updated", resource_type: null, resource_id: "x" },
            { update_type: "updated", resource_type: "task", resource_id: null },
        ];

        await handleUpdate("user1", payloads);

        // Expect formatWsUpdate to be called with empty batched resources
        expect(websocket.formatWsUpdate).toHaveBeenCalledWith(expect.objectContaining({ batched_resources: { project: [], task: [] } }));
        expect(websocket.broadcastToUser).not.toHaveBeenCalled();
    });

    it("processes batched project and task updates", async () => {
      const now = new Date().toISOString();
      const payloads = [
        { update_type: "updated", resource_type: "project", resource_id: "p1", resource_content: { updated: { updated_at: now, title: "Proj1", deadline: now }, original: { deadline: now } }, updated_by: "Alice", original_sent: now },
        { update_type: "updated", resource_type: "task", resource_id: "t1", resource_content: { updated: { updated_at: now, title: "Task1", deadline: now }, original: { deadline: now } }, updated_by: "Bob", original_sent: now },
      ];

      websocket.formatWsUpdate.mockReturnValue([
        { title: "Proj1 updated", description: "desc", id: "uuid-1234" },
        { title: "Task1 updated", description: "desc", id: "uuid-1234" },
      ]);

      await handleUpdate("user1", payloads);

      expect(websocket.formatWsUpdate).toHaveBeenCalled();
      expect(websocket.broadcastToUser).toHaveBeenCalledTimes(2);
      expect(postSupabase.postToSupabase).toHaveBeenCalledTimes(2);
      expect(email.sendUpdates).toHaveBeenCalled();
    });
  });

  // -------------------- handleAddedToResource --------------------
  describe("handleAddedToResource", () => {
    it("returns if collaborator_ids is not an array", async () => {
        await handleAddedToResource({ collaborator_ids: null });
        expect(websocket.formatWsAdded).not.toHaveBeenCalled();
    });

    it("processes added notification for each collaborator", async () => {
        const payload = { collaborator_ids: ["user1","user2"], resource_type: "task", resource_id: "task", resource_content: { title: "Task1", priority: 8 } };
        await handleAddedToResource(payload);
        expect(websocket.formatWsAdded).toHaveBeenCalledTimes(2);
        expect(websocket.broadcastToUser).toHaveBeenCalledTimes(2);
        expect(postSupabase.postToSupabase).toHaveBeenCalledTimes(2);
        expect(email.sendDeadlineOrAddedEmail).toHaveBeenCalledTimes(2);
    });

    it("calculates high, medium, low priority correctly", async () => {
        const highPayload = { collaborator_ids: ["user1"], resource_type: "task", resource_id: "task", resource_content: { title: "TaskHigh", priority: 8 } };
        await handleAddedToResource(highPayload);
        expect(websocket.formatWsAdded).toHaveBeenCalledWith(expect.objectContaining({ isHighPriority: true }));

        const mediumPayload = { collaborator_ids: ["user1"], resource_type: "task", resource_id: "task", resource_content: { title: "TaskMedium", priority: 5 } };
        await handleAddedToResource(mediumPayload);
        expect(websocket.formatWsAdded).toHaveBeenCalledWith(expect.objectContaining({ isMediumPriority: true }));

        const lowPayload = { collaborator_ids: ["user1"], resource_type: "task", resource_id: "task", resource_content: { title: "TaskLow", priority: 2 } };
        await handleAddedToResource(lowPayload);
        expect(websocket.formatWsAdded).toHaveBeenCalledWith(expect.objectContaining({ isLowPriority: true }));
    });

    it("handles project, project task, project subtask, subtask, and task links correctly", async () => {
        const baseUser = ["user1"];
        
        const taskPayload = { collaborator_ids: baseUser, resource_type: "task", resource_id: "task", resource_content: { title: "Task" } };
        await handleAddedToResource(taskPayload);
        expect(websocket.formatWsAdded).toHaveBeenCalledWith(expect.objectContaining({ isTask: true }));

        const subtaskPayload = { collaborator_ids: baseUser, resource_type: "task", resource_id: "x", resource_content: { project_id: "" } };
        await handleAddedToResource(subtaskPayload);
        expect(websocket.formatWsAdded).toHaveBeenCalledWith(expect.objectContaining({ isSubtask: true }));

        const projectPayload = { collaborator_ids: baseUser, resource_type: "project", resource_id: "p1", resource_content: { id: "p1" } };
        await handleAddedToResource(projectPayload);
        expect(websocket.formatWsAdded).toHaveBeenCalledWith(expect.objectContaining({ isProject: true }));

        const projectTaskPayload = { collaborator_ids: baseUser, resource_type: "project", resource_id: "p2", resource_content: { project_id: "p2" } };
        await handleAddedToResource(projectTaskPayload);
        expect(websocket.formatWsAdded).toHaveBeenCalledWith(expect.objectContaining({ isProjectTask: true }));

        const projectSubtaskPayload = { collaborator_ids: baseUser, resource_type: "task", resource_id: "x", resource_content: { project_id: "p3" } };
        await handleAddedToResource(projectSubtaskPayload);
        expect(websocket.formatWsAdded).toHaveBeenCalledWith(expect.objectContaining({ isProjectSubtask: true }));
    });

    it("handles edge-case payloads with missing project_id or resource_content", async () => {
        const payload = { collaborator_ids: ["user1"], resource_type: "task", resource_id: "x", resource_content: {} };
        await handleAddedToResource(payload);
        expect(websocket.formatWsAdded).toHaveBeenCalled();
    });
  });

  // -------------------- processUpdateNotification error handling --------------------
  describe("processUpdateNotification error handling", () => {
    it("logs an error if formatWsUpdate throws", async () => {
        websocket.formatWsUpdate.mockImplementation(() => { throw new Error("test error"); });

        const payloads = [
          { 
              update_type: "updated", 
              resource_type: "task", 
              resource_id: "t1", 
              resource_content: { updated: {}, original: {} }, 
              updated_by: "Alice", 
              original_sent: new Date().toISOString() 
          }
        ];

        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        await handleUpdate("user1", payloads);

        // Check only first argument to console.error
        expect(consoleSpy.mock.calls[0][0]).toContain("[processUpdateNotification] Failed:");
        consoleSpy.mockRestore();
    });
  });
});
