const service = require("../services/notificationPreferencesService"); // adjust path
const { supabase } = require("../db/supabase");

describe("notificationPreferencesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------
  // getNotificationDeliveryPreferences
  // -----------------------
  test("getNotificationDeliveryPreferences returns delivery methods", async () => {
    const fakeData = { email: "user@example.com", delivery_method: ["in-app", "email"] };
    supabase.from("notification_preferences").select().eq().single.mockResolvedValue({ data: fakeData, error: null });

    const result = await service.getNotificationDeliveryPreferences("user-123");

    expect(supabase.from).toHaveBeenCalledWith("notification_preferences");
    expect(result).toEqual(fakeData);
  });

  test("getNotificationDeliveryPreferences throws on error", async () => {
    supabase.from("notification_preferences").select().eq().single.mockResolvedValue({ data: null, error: "db error" });

    await expect(service.getNotificationDeliveryPreferences("user-123")).rejects.toBe("db error");
  });

  // -----------------------
  // updateNotificationDeliveryPreferences
  // -----------------------
  test("updateNotificationDeliveryPreferences updates delivery methods", async () => {
    const fakeData = { delivery_method: ["email"] };
    supabase.from("notification_preferences").update().eq().select().single.mockResolvedValue({ data: fakeData, error: null });

    const result = await service.updateNotificationDeliveryPreferences("user-123", ["email"]);
    expect(result).toEqual(fakeData.delivery_method);
  });

  test("updateNotificationDeliveryPreferences throws on error", async () => {
    supabase.from("notification_preferences").update().eq().select().single.mockResolvedValue({ data: null, error: "db error" });

    await expect(service.updateNotificationDeliveryPreferences("user-123", ["email"])).rejects.toBe("db error");
  });

  // -----------------------
  // getNotificationFrequencyPreferences
  // -----------------------
  test("getNotificationFrequencyPreferences returns frequency data", async () => {
    const fakeData = {
      delivery_frequency: "Daily",
      delivery_time: "09:00",
      delivery_day: "Monday",
    };
    supabase.from("notification_preferences").select().eq().single.mockResolvedValue({ data: fakeData, error: null });

    const result = await service.getNotificationFrequencyPreferences("user-123");
    expect(result).toEqual(fakeData);
  });

  test("getNotificationFrequencyPreferences throws on error", async () => {
    supabase.from("notification_preferences").select().eq().single.mockResolvedValue({ data: null, error: "db error" });

    await expect(service.getNotificationFrequencyPreferences("user-123")).rejects.toBe("db error");
  });

  // -----------------------
  // updateNotificationFrequencyPreferences
  // -----------------------
  test("updateNotificationFrequencyPreferences updates frequency data", async () => {
    const fakeData = {
      delivery_frequency: "Weekly",
      delivery_time: "10:00",
      delivery_day: "Friday",
    };
    supabase.from("notification_preferences").update().eq().select().single.mockResolvedValue({ data: fakeData, error: null });

    const prefs = { delivery_frequency: "Weekly", delivery_time: "10:00", delivery_day: "Friday" };
    const result = await service.updateNotificationFrequencyPreferences("user-123", prefs);
    expect(result).toEqual(fakeData);
  });

  test("updateNotificationFrequencyPreferences uses defaults if time/day missing", async () => {
    const fakeData = {
      delivery_frequency: "Weekly",
      delivery_time: "1970-01-01T09:00:00+00:00",
      delivery_day: "Monday",
    };
    supabase.from("notification_preferences").update().eq().select().single.mockResolvedValue({ data: fakeData, error: null });

    const prefs = { delivery_frequency: "Weekly" }; // time/day missing
    const result = await service.updateNotificationFrequencyPreferences("user-123", prefs);
    expect(result).toEqual(fakeData);
  });

  test("updateNotificationFrequencyPreferences throws on error", async () => {
    supabase.from("notification_preferences").update().eq().select().single.mockResolvedValue({ data: null, error: "db error" });

    const prefs = { delivery_frequency: "Weekly" };
    await expect(service.updateNotificationFrequencyPreferences("user-123", prefs)).rejects.toBe("db error");
  });
});
