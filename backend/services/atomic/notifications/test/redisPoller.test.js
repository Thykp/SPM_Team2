// test/redisPoller.test.js
const { pollNotifications } = require("../services/redisPoller");
const {
  handleDeadlineReminder,
  handleAddedToResource,
  handleUpdate,
} = require("../services/notificationHandler");

jest.mock("../services/notificationHandler");

let redisMockInstance;

jest.mock("ioredis", () => {
  const redisMock = {
    zrangebyscore: jest.fn().mockResolvedValue([]),
    zrem: jest.fn().mockResolvedValue(1),
  };
  return jest.fn(() => redisMock);
});

beforeEach(() => {
  const Redis = require("ioredis");
  redisMockInstance = new Redis();
  jest.clearAllMocks();
});

describe("pollNotifications", () => {
  test("does nothing if no notifications", async () => {
    await pollNotifications("deadline_reminders");

    expect(redisMockInstance.zrangebyscore).toHaveBeenCalledWith(
      "deadline_reminders",
      0,
      expect.any(Number)
    );
    expect(handleDeadlineReminder).not.toHaveBeenCalled();
    expect(handleAddedToResource).not.toHaveBeenCalled();
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  test("processes a deadline reminder notification", async () => {
    const notif = JSON.stringify({
      type: "deadline_reminder",
      resource_type: "task",
      resource_id: "task-1",
      user_id: "user-1",
    });
    redisMockInstance.zrangebyscore.mockResolvedValue([notif]);

    await pollNotifications("deadline_reminders");

    expect(handleDeadlineReminder).toHaveBeenCalledWith(JSON.parse(notif));
    expect(redisMockInstance.zrem).toHaveBeenCalledWith("deadline_reminders", notif);
  });

  test("processes an added notification", async () => {
    const notif = JSON.stringify({
      type: "added",
      resource_type: "project",
      resource_id: "proj-1",
      user_id: "user-1",
    });
    redisMockInstance.zrangebyscore.mockResolvedValue([notif]);

    await pollNotifications("added");

    expect(handleAddedToResource).toHaveBeenCalledWith(JSON.parse(notif));
    expect(redisMockInstance.zrem).toHaveBeenCalledWith("added", notif);
  });

  test("groups update notifications by user", async () => {
    const notif1 = JSON.stringify({ type: "update", user_id: "user1", id: 1 });
    const notif2 = JSON.stringify({ type: "update", user_id: "user1", id: 2 });
    const notif3 = JSON.stringify({ type: "update", user_id: "user2", id: 3 });
    redisMockInstance.zrangebyscore.mockResolvedValue([notif1, notif2, notif3]);

    await pollNotifications("update");

    expect(handleUpdate).toHaveBeenCalledTimes(2);
    expect(handleUpdate).toHaveBeenCalledWith("user1", [
      { type: "update", user_id: "user1", id: 1 },
      { type: "update", user_id: "user1", id: 2 },
    ]);
    expect(handleUpdate).toHaveBeenCalledWith("user2", [
      { type: "update", user_id: "user2", id: 3 },
    ]);
    expect(redisMockInstance.zrem).toHaveBeenCalledTimes(3);
  });

  test("skips update notifications with missing type and logs warning", async () => {
    const invalidNotif = JSON.stringify({ user_id: "user1" });
    redisMockInstance.zrangebyscore.mockResolvedValue([invalidNotif]);

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await pollNotifications("update");

    expect(handleUpdate).not.toHaveBeenCalled();
    expect(redisMockInstance.zrem).toHaveBeenCalledWith("update", invalidNotif);
    expect(warnSpy).toHaveBeenCalledWith("[poller] Skipping invalid payload:", invalidNotif);

    warnSpy.mockRestore();
  });

  test("logs error if handleUpdate throws", async () => {
    const notif = JSON.stringify({ type: "update", user_id: "user1", id: 1 });
    redisMockInstance.zrangebyscore.mockResolvedValue([notif]);
    handleUpdate.mockRejectedValue(new Error("update failed"));

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await pollNotifications("update");

    expect(errorSpy).toHaveBeenCalledWith(
      "[poller] Failed to process updates for user user1:",
      expect.any(Error)
    );
    expect(redisMockInstance.zrem).toHaveBeenCalledWith("update", notif);

    errorSpy.mockRestore();
  });

  test("removes invalid JSON notifications and logs error", async () => {
    const invalidNotif = "{ this is : invalid }";
    redisMockInstance.zrangebyscore.mockResolvedValue([invalidNotif]);

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await pollNotifications("deadline_reminders");

    expect(handleDeadlineReminder).not.toHaveBeenCalled();
    expect(handleAddedToResource).not.toHaveBeenCalled();
    expect(redisMockInstance.zrem).toHaveBeenCalledWith("deadline_reminders", invalidNotif);
    expect(errorSpy).toHaveBeenCalledWith(
      "[poller] Failed to process notification:",
      expect.any(SyntaxError)
    );

    errorSpy.mockRestore();
  });

  test("skips unknown notification types and logs warning", async () => {
    const notif = JSON.stringify({
      type: "unknown_type",
      resource_type: "task",
      resource_id: "task-1",
      user_id: "user-1",
    });
    redisMockInstance.zrangebyscore.mockResolvedValue([notif]);

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await pollNotifications("deadline_reminders");

    expect(handleDeadlineReminder).not.toHaveBeenCalled();
    expect(handleAddedToResource).not.toHaveBeenCalled();
    expect(redisMockInstance.zrem).toHaveBeenCalledWith("deadline_reminders", notif);
    expect(warnSpy).toHaveBeenCalledWith("[poller] Unknown notification type:", "unknown_type");

    warnSpy.mockRestore();
  });
});
