// test/notificationService.test.js
const service = require("../services/notificationService");
const { supabase } = require("../db/supabase");

describe("notificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------
  // getUserNotifications
  // -----------------------
  test("getUserNotifications returns ordered data", async () => {
    const fakeData = [
      { id: "notif-1", title: "Test 1" },
      { id: "notif-2", title: "Test 2" },
    ];
    supabase.from("notifications_with_user")
      .select()
      .eq()
      .order.mockResolvedValueOnce({ data: fakeData, error: null });

    const result = await service.getUserNotifications("user-123");

    expect(supabase.from).toHaveBeenCalledWith("notifications_with_user");
    expect(result).toEqual(fakeData);
  });

  test("getUserNotifications throws on error", async () => {
    supabase.from("notifications_with_user")
      .select()
      .eq()
      .order.mockResolvedValueOnce({ data: null, error: "db error" });

    await expect(service.getUserNotifications("user-123")).rejects.toThrow(
      "Failed to fetch notifications"
    );
  });

  // -----------------------
  // markAsRead
  // -----------------------
  test("markAsRead updates notifications", async () => {
    const fakeData = [{ id: "notif-1", read: true }];
    supabase.from("notifications")
      .update()
      .in()
      .select.mockResolvedValueOnce({ data: fakeData, error: null });

    const result = await service.markAsRead(["notif-1"]);

    expect(result).toEqual(fakeData);
  });

  test("markAsRead throws if no IDs provided", async () => {
    await expect(service.markAsRead([])).rejects.toThrow("No notification IDs provided");
  });

  test("markAsRead throws on DB error", async () => {
    supabase.from("notifications")
      .update()
      .in()
      .select.mockResolvedValueOnce({ data: null, error: "db error" });

    await expect(service.markAsRead(["notif-1"])).rejects.toThrow("Failed to mark as read");
  });

  // -----------------------
  // deleteAll
  // -----------------------
  test("deleteAll removes all notifications for a user", async () => {
    const fakeData = [{ id: "notif-1" }, { id: "notif-2" }];
    supabase.from("notifications")
      .delete()
      .eq()
      .select.mockResolvedValueOnce({ data: fakeData, error: null });

    const result = await service.deleteAll("user-123");

    expect(supabase.from).toHaveBeenCalledWith("notifications");
    expect(result).toEqual(fakeData);
  });

  test("deleteAll throws on error", async () => {
    supabase.from("notifications")
      .delete()
      .eq()
      .select.mockResolvedValueOnce({ data: null, error: "db error" });

    await expect(service.deleteAll("user-123")).rejects.toThrow("Failed to delete all");
  });

  // -----------------------
  // deleteOne
  // -----------------------
  test("deleteOne removes a single notification", async () => {
    const fakeData = [{ id: "notif-1" }];
    supabase.from("notifications")
      .delete()
      .eq()
      .eq()
      .select.mockResolvedValueOnce({ data: fakeData, error: null });

    const result = await service.deleteOne("user-123", "notif-1");

    expect(result).toEqual(fakeData[0]);
  });

  test("deleteOne throws if notification not found", async () => {
    supabase.from("notifications")
      .delete()
      .eq()
      .eq()
      .select.mockResolvedValueOnce({ data: [], error: null });

    await expect(service.deleteOne("user-123", "notif-99")).rejects.toThrow(
      "Notification not found"
    );
  });

  test("deleteOne throws on DB error", async () => {
    supabase.from("notifications")
      .delete()
      .eq()
      .eq()
      .select.mockResolvedValueOnce({ data: null, error: "db error" });

    await expect(service.deleteOne("user-123", "notif-1")).rejects.toThrow(
      "Failed to delete notification"
    );
  });

  // -----------------------
  // toggleRead
  // -----------------------
  test("toggleRead flips user_set_read", async () => {
    // First fetch returns false
    supabase.from("notifications")
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: { user_set_read: false },
        error: null,
      });

    // Update sets it to true
    supabase.from("notifications")
      .update()
      .eq()
      .select()
      .single.mockResolvedValueOnce({
        data: { user_set_read: true },
        error: null,
      });

    const result = await service.toggleRead("notif-1");

    expect(result).toEqual({ user_set_read: true });
  });

  test("toggleRead throws if no ID provided", async () => {
    await expect(service.toggleRead()).rejects.toThrow("No notification ID provided");
  });

  test("toggleRead throws if notification not found", async () => {
    supabase.from("notifications")
      .select()
      .eq()
      .single.mockResolvedValueOnce({ data: null, error: null });

    await expect(service.toggleRead("notif-1")).rejects.toThrow("Notification not found");
  });

  test("toggleRead throws on update error", async () => {
    supabase.from("notifications")
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: { user_set_read: false },
        error: null,
      });

    supabase.from("notifications")
      .update()
      .eq()
      .select()
      .single.mockResolvedValueOnce({
        data: null,
        error: "db error",
      });

    await expect(service.toggleRead("notif-1")).rejects.toThrow("Failed to toggle read");
  });
});
