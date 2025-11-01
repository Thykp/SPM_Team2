const { WebSocketServer } = require("ws");
const crypto = require("crypto");
const WebSocket = require("ws");
WebSocket.OPEN = 1;

const {
  broadcastToUser,
  formatWsAdded,
  formatWsUpdate,
  formatWsReminder,
  addClient,
  clients,
} = require("../services/websocket");

// Suppress console logs during tests
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

// ---------------------- addClient ----------------------
describe("addClient", () => {
  let ws;
  beforeEach(() => {
    clients.clear();
    ws = { on: jest.fn(), isAlive: false };
  });

  it("adds ws to clients map and sets isAlive", () => {
    addClient("userA", ws);
    expect(clients.has("userA")).toBe(true);
    expect(clients.get("userA").has(ws)).toBe(true);
    expect(ws.isAlive).toBe(true);
  });

  it("pong event sets isAlive to true", () => {
    ws.on = jest.fn((event, cb) => { if (event === "pong") cb(); });
    addClient("userB", ws);
    expect(ws.isAlive).toBe(true);
  });

  it("close event removes ws and deletes user if last socket", () => {
    ws.on = jest.fn((event, cb) => { if (event === "close") cb(); });
    addClient("userC", ws);
    expect(clients.has("userC")).toBe(false);
  });

  it("close event removes ws but keeps user if multiple sockets", () => {
    const ws2 = { on: jest.fn(), isAlive: true };
    addClient("userD", ws);
    addClient("userD", ws2);
    const closeCb = ws.on.mock.calls.find(c => c[0] === "close")[1];
    closeCb();
    expect(clients.has("userD")).toBe(true);
    expect(clients.get("userD").has(ws2)).toBe(true);
    expect(clients.get("userD").has(ws)).toBe(false);
  });

  it("addClient with existing user resets isAlive", () => {
    const ws3 = { on: jest.fn(), isAlive: false };
    const ws4 = { on: jest.fn(), isAlive: false };
    clients.set("userExist", new Set([ws3]));
    addClient("userExist", ws4);
    expect(ws4.isAlive).toBe(true);
    expect(clients.get("userExist").has(ws4)).toBe(true);
  });
});

// ---------------------- broadcastToUser ----------------------
// ---------------------- broadcastToUser ----------------------
describe("broadcastToUser", () => {
  let ws1, ws2;

  beforeEach(() => {
    clients.clear();
    // Add OPEN constant to each ws
    ws1 = { send: jest.fn(), readyState: 1, OPEN: 1 }; // OPEN
    ws2 = { send: jest.fn(), readyState: 0, OPEN: 1 }; // CLOSED
    clients.set("user1", new Set([ws1, ws2]));
  });

  it("sends message only to open sockets", () => {
    broadcastToUser("user1", { text: "hello" });
    expect(ws1.send).toHaveBeenCalledWith(JSON.stringify({ text: "hello" }));
    expect(ws2.send).not.toHaveBeenCalled();
  });

  it("sends message to multiple open sockets", () => {
    const wsA = { send: jest.fn(), readyState: 1, OPEN: 1 };
    const wsB = { send: jest.fn(), readyState: 1, OPEN: 1 };
    clients.clear();
    clients.set("userMulti", new Set([wsA, wsB]));

    broadcastToUser("userMulti", { text: "hi" });

    expect(wsA.send).toHaveBeenCalledTimes(1);
    expect(wsB.send).toHaveBeenCalledTimes(1);
    expect(wsA.send).toHaveBeenCalledWith(JSON.stringify({ text: "hi" }));
    expect(wsB.send).toHaveBeenCalledWith(JSON.stringify({ text: "hi" }));
  });
});


// ---------------------- formatWsAdded ----------------------
describe("formatWsAdded", () => {
  it("formats high priority task notification", () => {
    const payload = {
      isTask: true,
      isHighPriority: true,
      resource_content: { title: "Task1" },
      addedBy: "Alice",
      link: "/task/1",
    };
    const notif = formatWsAdded(payload);
    expect(notif.id).toBeDefined();
    expect(typeof notif.id).toBe("string");
    expect(notif.title).toContain("[HIGH] Added to Task");
    expect(notif.description).toContain("Alice has added you");
    expect(notif.link).toBe("/task/1");
  });

  it("defaults resource label if no type matches", () => {
    const payload = { resource_content: { title: "Unknown" }, addedBy: "Bob", link: "/unknown" };
    const notif = formatWsAdded(payload);
    expect(notif.id).toBeDefined();
    expect(typeof notif.id).toBe("string");
    expect(notif.title).toContain("Added to undefined");
  });

  it("formats subtasks, project tasks, and project subtasks", () => {
    const payloadSubtask = {
      isSubtask: true,
      isMediumPriority: true,
      resource_content: { title: "Subtask1", status: "Open" },
      addedBy: "Charlie",
      link: "/subtask/1",
    };
    const notifSubtask = formatWsAdded(payloadSubtask);
    expect(notifSubtask.id).toBeDefined();
    expect(typeof notifSubtask.id).toBe("string");
    expect(notifSubtask.title).toContain("Added to Subtask");
    expect(notifSubtask.description).toContain("(Open)");

    const payloadProjTask = {
      isProjectTask: true,
      resource_content: { title: "ProjTask1" },
      addedBy: "Dana",
      link: "/projtask/1",
    };
    const notifProjTask = formatWsAdded(payloadProjTask);
    expect(notifProjTask.id).toBeDefined();
    expect(typeof notifProjTask.id).toBe("string");
    expect(notifProjTask.title).toContain("Added to Project Task");

    const payloadProjSub = {
      isProjectSubtask: true,
      resource_content: { title: "ProjSub1" },
      addedBy: "Eve",
      link: "/projsub/1",
    };
    const notifProjSub = formatWsAdded(payloadProjSub);
    expect(notifProjSub.id).toBeDefined();
    expect(typeof notifProjSub.id).toBe("string");
    expect(notifProjSub.title).toContain("Added to Project Subtask");
  });
});

// ---------------------- formatWsUpdate ----------------------
describe("formatWsUpdate", () => {
  it("formats project updates", () => {
    const payload = {
      batched_resources: {
        project: [
          { resource_content: { updated: { title: "Proj1", deadline: "Invalid Date", id: "p1" } }, update_type: "updated", updated_by: "Alice" }
        ]
      }
    };
    const result = formatWsUpdate(payload);
    expect(result[0].title).toContain("Proj1");
    expect(result[0].link).toBe("/app/project/p1");
  });

  it("formats task updates", () => {
    const payload = {
      batched_resources: {
        task: [
          { resource_content: { updated: { title: "Task1", status: "Open", parent: null, project_id: "" } }, update_type: "updated", updated_by: "Bob" }
        ]
      }
    };
    const result = formatWsUpdate(payload);
    expect(result[0].title).toContain("Task Task1 updated by: Bob");
    expect(result[0].description).toContain("(Open)");
  });

  it("handles multiple projects and tasks", () => {
    const payload = {
      batched_resources: {
        project: [
          { resource_content: { updated: { title: "ProjA", deadline: "Invalid Date", id: "pa1" } }, update_type: "updated", updated_by: "Alice" },
          { resource_content: { updated: { title: "ProjB", deadline: "2025-01-01", parent: null, project_id: "pb1" } }, update_type: "created", updated_by: "Bob" }
        ],
        task: [
          { resource_content: { updated: { title: "TaskX", parent: null, project_id: "pb1", status: "Open" } }, update_type: "updated", updated_by: "Carol" },
          { resource_content: { updated: { title: "SubtaskY", parent: "t1", project_id: "pb1", status: "Closed" } }, update_type: "updated", updated_by: "Dave" }
        ]
      }
    };
    const result = formatWsUpdate(payload);
    expect(result).toHaveLength(4);
  });
});

// ---------------------- formatWsReminder ----------------------
describe("formatWsReminder", () => {
  it("returns null for missing payload", () => {
    expect(formatWsReminder(null)).toBeNull();
    expect(formatWsReminder({})).toBeNull();
  });

  it("formats high priority reminder", () => {
    const payload = {
      task: { title: "Task1", priority: 8, status: "Open", project_id: "p1", description: "Desc" },
      day: 2
    };
    const notif = formatWsReminder(payload);
    expect(notif.id).toBeDefined();
    expect(typeof notif.id).toBe("string");
    expect(notif.title).toBe("Upcoming Deadline: Task1");
    expect(notif.description).toContain("[HIGH]");
    expect(notif.link).toBe("/app/project/p1");
  });

  it("formats medium priority reminder", () => {
    const payload = {
      task: { title: "TaskMedium", priority: 5, status: "In Progress", project_id: null, description: "Do something" },
      day: 3
    };
    const notif = formatWsReminder(payload);
    expect(notif.id).toBeDefined();
    expect(typeof notif.id).toBe("string");
    expect(notif.description).toContain("[MEDIUM]");
    expect(notif.link).toBe("/app?taskName=TaskMedium");
  });

  it("formats low priority reminder with description", () => {
    const payload = {
      task: { title: "TaskLow", priority: 1, status: "Pending", project_id: null, description: "Low task" },
      day: 5
    };
    const notif = formatWsReminder(payload);
    expect(notif.id).toBeDefined();
    expect(typeof notif.id).toBe("string");
    expect(notif.description).toContain("[LOW]");
    expect(notif.description).toContain('Description: "Low task"');
  });

  
});

// ---------------------- broadcastToUser additional tests ----------------------
describe("broadcastToUser additional edge cases", () => {
  let wsOpen, wsClosed;

  beforeEach(() => {
    clients.clear();
    wsOpen = { send: jest.fn(), readyState: 1, OPEN: 1 };
    wsClosed = { send: jest.fn(), readyState: 0, OPEN: 1 };
  });

  it("does nothing if user has no sockets", () => {
    broadcastToUser("nonExistingUser", { text: "test" });
    expect(wsOpen.send).not.toHaveBeenCalled();
    expect(wsClosed.send).not.toHaveBeenCalled();
  });

  it("ignores closed sockets and still sends to open ones", () => {
    clients.set("userTest", new Set([wsOpen, wsClosed]));
    broadcastToUser("userTest", { text: "msg" });
    expect(wsOpen.send).toHaveBeenCalledTimes(1);
    expect(wsClosed.send).not.toHaveBeenCalled();
  });

  it("handles empty Set gracefully", () => {
    clients.set("userEmpty", new Set());
    expect(() => broadcastToUser("userEmpty", { text: "hi" })).not.toThrow();
  });
});

// ---------------------- formatWsAdded additional tests ----------------------
describe("formatWsAdded additional edge cases", () => {
  it("handles missing status field in resource_content", () => {
    const payload = {
      isTask: true,
      resource_content: { title: "TaskNoStatus" },
      addedBy: "Alice",
      link: "/task/nos",
    };
    const notif = formatWsAdded(payload);
    expect(notif.description).toContain("Alice has added you");
    expect(notif.description).not.toContain("(undefined)"); // status missing
  });

  it("handles missing title/id in resource_content", () => {
    const payload = {
      isTask: true,
      resource_content: {},
      addedBy: "Bob",
      link: "/task/missing",
    };
    const notif = formatWsAdded(payload);
    expect(notif.title).toContain("Added to Task: undefined");
  });

  it("handles unknown resource type gracefully", () => {
    const payload = {
      resource_content: { title: "UnknownResource" },
      addedBy: "Charlie",
      link: "/unknown",
    };
    const notif = formatWsAdded(payload);
    expect(notif.title).toContain("Added to undefined");
  });
});

// ---------------------- formatWsReminder additional tests ----------------------
describe("formatWsReminder additional edge cases", () => {
  it("handles missing project_id and description", () => {
    const payload = {
      task: { title: "TaskNoProjDesc", priority: 3, status: "Pending", project_id: null },
      day: 4,
    };
    const notif = formatWsReminder(payload);
    expect(notif.link).toBe("/app?taskName=TaskNoProjDesc");
    expect(notif.description).toContain("[LOW]"); // priority 3
    expect(notif.description).not.toContain("Description"); // missing
  });

  it("correctly handles priority boundaries", () => {
    const high = { task: { title: "HighTask", priority: 7, status: "Open", project_id: null }, day: 1 };
    const medium = { task: { title: "MediumTask", priority: 5, status: "Open", project_id: null }, day: 1 };
    const low = { task: { title: "LowTask", priority: 4, status: "Open", project_id: null }, day: 1 };

    const notifHigh = formatWsReminder(high);
    const notifMedium = formatWsReminder(medium);
    const notifLow = formatWsReminder(low);

    expect(notifHigh.description).toContain("[MEDIUM]"); // 7 is medium (as per >7 for high)
    expect(notifMedium.description).toContain("[MEDIUM]");
    expect(notifLow.description).toContain("[LOW]");
  });

  it("handles task with no status field", () => {
    const payload = {
      task: { title: "TaskNoStatus", priority: 6, project_id: null },
      day: 2,
    };
    const notif = formatWsReminder(payload);
    expect(notif.description).toContain("Status: N/A");
  });
});

