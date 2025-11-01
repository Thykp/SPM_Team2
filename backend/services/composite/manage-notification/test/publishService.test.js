// publistService.test.js
const {
  computeNextNotifyAt,
  updateUserNotifications,
  removeDeadlineReminders,
  publishDeadlineReminder,
  publishUpdate,
  publishAddedToResource,
} = require("../services/publishService");

const { redis, pushToRedis } = require("../services/redisPublisher");

// --- Mock redis + pushToRedis ---
jest.mock("../services/redisPublisher", () => ({
  redis: {
    zrangebyscore: jest.fn(),
    zrem: jest.fn(),
  },
  pushToRedis: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  // Set a fixed time for deterministic results
  jest.useFakeTimers().setSystemTime(new Date("2025-10-30T09:00:00Z"));
});

afterEach(() => {
  jest.useRealTimers();
});


// ============================================================================
// computeNextNotifyAt
// ============================================================================
describe("computeNextNotifyAt", () => {
  test("returns current timestamp for Immediate", () => {
    const result = computeNextNotifyAt({ delivery_frequency: "Immediate" });
    expect(result).toBeLessThanOrEqual(Date.now());
  });

  test("computes next 9AM tomorrow for Daily if now past 9AM", () => {
    const freq = {
      delivery_frequency: "Daily",
      delivery_time: "1970-01-01T09:00:00+00:00",
    };
    const result = computeNextNotifyAt(freq);
    const next = new Date(result);
    expect(next.getHours()).toBe(9);
    expect(next.getUTCMinutes()).toBe(0);
    expect(next.getUTCDate()).toBe(31); // since fake clock is Oct 30
  });

  test("throws error for invalid delivery_time in Daily", () => {
    expect(() =>
      computeNextNotifyAt({ delivery_frequency: "Daily", delivery_time: "bad" })
    ).toThrow("Invalid delivery_time format for Daily");
  });

  test("computes next Monday 9AM for Weekly", () => {
    const freq = {
      delivery_frequency: "Weekly",
      delivery_time: "1970-01-01T09:00:00+00:00",
      delivery_day: "Monday",
    };
    const result = computeNextNotifyAt(freq);
    const next = new Date(result);
    expect(next.getHours()).toBe(9);
    expect(next.getUTCDay()).toBe(1);
  });

  test("throws error for invalid delivery_day in Weekly", () => {
    expect(() =>
      computeNextNotifyAt({
        delivery_frequency: "Weekly",
        delivery_time: "1970-01-01T09:00:00+00:00",
        delivery_day: "Blursday",
      })
    ).toThrow("Invalid delivery_day for Weekly frequency");
  });

  test("throws for invalid delivery_frequency", () => {
    expect(() =>
      computeNextNotifyAt({ delivery_frequency: "Monthly" })
    ).toThrow("Invalid delivery_frequency");
  });
});


// ============================================================================
// updateUserNotifications
// ============================================================================
describe("updateUserNotifications", () => {
  test("updates matching user notifications", async () => {
    const mockItems = [
      JSON.stringify({ user_id: "u1", something: "data" }),
      JSON.stringify({ user_id: "u2", something: "data" }),
    ];
    redis.zrangebyscore.mockResolvedValue(mockItems);
    redis.zrem.mockResolvedValue(1);
    pushToRedis.mockResolvedValue();

    await updateUserNotifications("u1", {
      delivery_frequency: "Immediate",
    });

    expect(redis.zrangebyscore).toHaveBeenCalledWith("update", "-inf", "+inf");
    expect(redis.zrem).toHaveBeenCalledTimes(1);
    expect(pushToRedis).toHaveBeenCalledTimes(1);
  });

  test("handles malformed redis item gracefully", async () => {
    redis.zrangebyscore.mockResolvedValue(["{not:valid"]);
    await expect(
      updateUserNotifications("u1", { delivery_frequency: "Immediate" })
    ).resolves.not.toThrow();
  });

  test("logs error if redis throws", async () => {
    redis.zrangebyscore.mockRejectedValue(new Error("Redis down"));
    await updateUserNotifications("u1", { delivery_frequency: "Immediate" });
    expect(redis.zrangebyscore).toHaveBeenCalled();
  });
});


// ============================================================================
// removeDeadlineReminders
// ============================================================================
describe("removeDeadlineReminders", () => {
  test("removes matching reminders", async () => {
    const mockItems = [
      JSON.stringify({
        type: "deadline_reminder",
        resource_id: "t1",
        user_id: "u1",
        day: 1,
      }),
      JSON.stringify({
        type: "deadline_reminder",
        resource_id: "t2",
        user_id: "u1",
        day: 3,
      }),
    ];
    redis.zrangebyscore.mockResolvedValue(mockItems);
    redis.zrem.mockResolvedValue(1);

    await removeDeadlineReminders("t1", "u1");
    expect(redis.zrem).toHaveBeenCalledTimes(1);
  });

  test("skips invalid JSON", async () => {
    redis.zrangebyscore.mockResolvedValue(["not json"]);
    await removeDeadlineReminders("t1", "u1");
    expect(redis.zrem).not.toHaveBeenCalled();
  });

  test("handles redis error gracefully", async () => {
    redis.zrangebyscore.mockRejectedValue(new Error("Redis error"));
    await removeDeadlineReminders("t1", "u1");
    expect(redis.zrangebyscore).toHaveBeenCalled();
  });
});


// ============================================================================
// publishDeadlineReminder
// ============================================================================
describe("publishDeadlineReminder", () => {
  test("does nothing if deadline missing", async () => {
    await publishDeadlineReminder({ taskId: "t1", userId: "u1" });
    expect(pushToRedis).not.toHaveBeenCalled();
  });

  test("does nothing if invalid deadline", async () => {
    await publishDeadlineReminder({
      taskId: "t1",
      userId: "u1",
      deadline: "not-date",
    });
    expect(pushToRedis).not.toHaveBeenCalled();
  });

  test("pushes reminders for valid deadline", async () => {
    const deadline = new Date("2025-11-05T00:00:00Z");
    await publishDeadlineReminder({
      taskId: "t1",
      userId: "u1",
      deadline,
      reminderDays: [1, 3],
      username: "john",
    });
    expect(pushToRedis).toHaveBeenCalledTimes(2);
    expect(pushToRedis).toHaveBeenCalledWith(
      "deadline_reminders",
      expect.objectContaining({
        resource_id: "t1",
        day: expect.any(Number),
      }),
      expect.any(Number)
    );
  });

  test("handles pushToRedis failure gracefully", async () => {
    pushToRedis.mockRejectedValueOnce(new Error("fail"));
    const deadline = new Date("2025-11-05T00:00:00Z");
    await publishDeadlineReminder({
      taskId: "t1",
      userId: "u1",
      deadline,
    });
    expect(pushToRedis).toHaveBeenCalled();
  });
});


// ============================================================================
// publishUpdate
// ============================================================================
describe("publishUpdate", () => {
  test("pushes update payload", async () => {
    await publishUpdate(
      "modified",
      "r1",
      "task",
      { title: "hi" },
      "u1",
      Date.now(),
      "u2"
    );
    expect(pushToRedis).toHaveBeenCalledWith(
      "update",
      expect.objectContaining({
        type: "update",
        update_type: "modified",
        resource_id: "r1",
      }),
      expect.any(Number)
    );
  });
});


// ============================================================================
// publishAddedToResource
// ============================================================================
describe("publishAddedToResource", () => {
  test("pushes added payload", async () => {
    const resourceContent = { owner: "u3", deadline: "2025-11-05T00:00:00Z" };
    await publishAddedToResource(
      "task",
      "r1",
      ["u1", "u2"],
      resourceContent,
      "uAdmin"
    );
    expect(pushToRedis).toHaveBeenCalledWith(
      "added",
      expect.objectContaining({
        type: "added",
        resource_type: "task",
        resource_id: "r1",
      }),
      expect.any(Number)
    );
  });
});

describe("publishAddedToResource - edge cases", () => {
  let spy;

  beforeEach(() => {
    spy = jest
      .spyOn(require("../services/publishService"), "publishDeadlineReminder")
      .mockResolvedValue();
  });

  afterEach(() => {
    spy.mockRestore();
  });

  test("does not call publishDeadlineReminder for non-task resource", async () => {
    const resourceContent = { owner: "u3", deadline: "2025-11-05T00:00:00Z" };
    await publishAddedToResource("project", "p1", ["u1", "u2"], resourceContent, "admin");
    expect(pushToRedis).toHaveBeenCalledWith(
      "added",
      expect.objectContaining({ type: "added", resource_type: "project" }),
      expect.any(Number)
    );
    expect(spy).not.toHaveBeenCalled();
  });

  test("does not call publishDeadlineReminder if no valid reminderDays (past deadline)", async () => {
    const resourceContent = { owner: "u3", deadline: "2025-10-29T00:00:00Z" };
    await publishAddedToResource("task", "t1", ["u1"], resourceContent, "admin");
    expect(spy).not.toHaveBeenCalled();
  });

  test("handles invalid deadline gracefully", async () => {
    const resourceContent = { owner: "u3", deadline: "invalid-date" };
    await publishAddedToResource("task", "t1", ["u1"], resourceContent, "admin");

    expect(pushToRedis).toHaveBeenCalledWith(
      "added",
      expect.objectContaining({ resource_id: "t1" }),
      expect.any(Number)
    );
    expect(spy).not.toHaveBeenCalled();
  });
});


// ============================================================================
// Additional edge & negative test cases
// ============================================================================

describe("updateUserNotifications - edge cases", () => {
  test("handles empty redis result gracefully", async () => {
    redis.zrangebyscore.mockResolvedValue([]);
    redis.zrem.mockResolvedValue(1);
    pushToRedis.mockResolvedValue();

    await expect(updateUserNotifications("uX", { delivery_frequency: "Immediate" }))
      .resolves.not.toThrow();
    expect(redis.zrem).not.toHaveBeenCalled();
    expect(pushToRedis).not.toHaveBeenCalled();
  });

  test("handles partially invalid JSON entries", async () => {
    redis.zrangebyscore.mockResolvedValue([
      JSON.stringify({ user_id: "u1" }),
      "invalid_json",
      JSON.stringify({ user_id: "u2" }),
    ]);
    redis.zrem.mockResolvedValue(1);
    pushToRedis.mockResolvedValue();

    await expect(updateUserNotifications("u1", { delivery_frequency: "Immediate" }))
      .resolves.not.toThrow();
    expect(pushToRedis).toHaveBeenCalled();
  });
});

describe("removeDeadlineReminders - edge cases", () => {
  test("handles all invalid JSON entries gracefully", async () => {
    redis.zrangebyscore.mockResolvedValue(["invalid1", "invalid2"]);
    await removeDeadlineReminders("t1", "u1");
    expect(redis.zrem).not.toHaveBeenCalled();
  });

  test("skips reminders for other users or resources", async () => {
    redis.zrangebyscore.mockResolvedValue([
      JSON.stringify({ type: "deadline_reminder", resource_id: "t2", user_id: "u2", day: 1 }),
      JSON.stringify({ type: "deadline_reminder", resource_id: "t3", user_id: "u3", day: 2 }),
    ]);
    await removeDeadlineReminders("t1", "u1");
    expect(redis.zrem).not.toHaveBeenCalled();
  });

  test("handles empty redis response", async () => {
    redis.zrangebyscore.mockResolvedValue([]);
    await removeDeadlineReminders("t1", "u1");
    expect(redis.zrem).not.toHaveBeenCalled();
  });
});

describe("publishDeadlineReminder - edge cases", () => {
  test("skips reminderDays array being empty", async () => {
    await publishDeadlineReminder({
      taskId: "t1",
      userId: "u1",
      deadline: new Date("2025-11-05T00:00:00Z"),
      reminderDays: [],
    });
    expect(pushToRedis).not.toHaveBeenCalled();
  });

  test("skips reminderDays with invalid numbers", async () => {
    await publishDeadlineReminder({
      taskId: "t1",
      userId: "u1",
      deadline: new Date("2025-11-05T00:00:00Z"),
      reminderDays: ["a", null, undefined],
    });
    expect(pushToRedis).not.toHaveBeenCalled();
  });

  test("handles reminderDays with mixed valid & invalid numbers", async () => {
    const deadline = new Date("2025-11-05T00:00:00Z");
    await publishDeadlineReminder({
      taskId: "t1",
      userId: "u1",
      deadline,
      reminderDays: [1, "invalid", 3],
    });
    // only valid numeric days should push
    expect(pushToRedis).toHaveBeenCalledTimes(2);
  });
});

describe("publishUpdate - edge cases", () => {
  test("handles empty update payload gracefully", async () => {
    await publishUpdate("modified", "r1", "task", {}, "u1", Date.now(), "u2");
    expect(pushToRedis).toHaveBeenCalled();
  });

  test("handles missing optional updatedBy parameter", async () => {
    await publishUpdate("modified", "r1", "task", { title: "hi" }, "u1", Date.now());
    expect(pushToRedis).toHaveBeenCalledWith(
      "update",
      expect.objectContaining({
        type: "update",
        update_type: "modified",
        resource_id: "r1",
      }),
      expect.any(Number)
    );
  });

  test("handles invalid updatedAt timestamp", async () => {
    await publishUpdate("modified", "r1", "task", { title: "hi" }, "u1", "not-a-timestamp", "u2");
    expect(pushToRedis).toHaveBeenCalled();
  });
});
