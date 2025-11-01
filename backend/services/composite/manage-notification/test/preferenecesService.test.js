// notificationService.test.js
const axios = require('axios');
const notificationService = require('../services/preferencesService');
const publishService = require('../services/publishService');

jest.mock('axios');
jest.mock('../services/publishService', () => ({
  updateUserNotifications: jest.fn(),
}));

describe("Notification Service", () => {
  const userId = "user123";

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------
  // getDeliveryPreferences
  // ------------------------------
  describe("getDeliveryPreferences", () => {
    test("returns preferences when API succeeds", async () => {
      axios.get.mockResolvedValue({ data: { delivery_method: "email" } });
      const result = await notificationService.getDeliveryPreferences(userId);
      expect(result).toEqual({ delivery_method: "email" });
      expect(axios.get).toHaveBeenCalledWith(
        `http://kong:8000/notifications/preferences/delivery-method/${userId}`
      );
    });

    test("throws error when API returns 4xx/5xx response", async () => {
      axios.get.mockRejectedValue({ response: { data: "Not found" } });
      await expect(notificationService.getDeliveryPreferences(userId)).rejects.toThrow(
        /Failed to fetch notification delivery preferences/
      );
    });

    test("throws error when network fails without response", async () => {
      axios.get.mockRejectedValue(new Error("Network Error"));
      await expect(notificationService.getDeliveryPreferences(userId)).rejects.toThrow(
        /Failed to fetch notification delivery preferences/
      );
    });

    test("handles empty response gracefully", async () => {
      axios.get.mockResolvedValue({ data: null });
      const result = await notificationService.getDeliveryPreferences(userId);
      expect(result).toBeNull();
    });
  });

  // ------------------------------
  // updateDeliveryPreferences
  // ------------------------------
  describe("updateDeliveryPreferences", () => {
    test("calls API with correct payload", async () => {
      axios.put.mockResolvedValue({ status: 200 });
      await notificationService.updateDeliveryPreferences(userId, "sms");
      expect(axios.put).toHaveBeenCalledWith(
        `http://kong:8000/notifications/preferences/delivery-method/${userId}`,
        { delivery_method: "sms" }
      );
    });

    test("throws error when API fails", async () => {
      axios.put.mockRejectedValue(new Error("Bad Request"));
      await expect(
        notificationService.updateDeliveryPreferences(userId, "sms")
      ).rejects.toThrow(/Failed to update notification delivery preferences/);
    });

    test("throws error when API returns response.data", async () => {
      axios.put.mockRejectedValue({ response: { data: "Forbidden" } });
      await expect(
        notificationService.updateDeliveryPreferences(userId, "sms")
      ).rejects.toThrow(/Failed to update notification delivery preferences/);
    });
  });

  // ------------------------------
  // getFrequencyPreferences
  // ------------------------------
  describe("getFrequencyPreferences", () => {
    test("returns frequency preferences when API succeeds", async () => {
      axios.get.mockResolvedValue({ data: { delivery_frequency: "Daily" } });
      const result = await notificationService.getFrequencyPreferences(userId);
      expect(result).toEqual({ delivery_frequency: "Daily" });
      expect(axios.get).toHaveBeenCalledWith(
        `http://kong:8000/notifications/preferences/frequency/${userId}`
      );
    });

    test("throws error when API fails with response", async () => {
      axios.get.mockRejectedValue({ response: { data: "Not found" } });
      await expect(notificationService.getFrequencyPreferences(userId)).rejects.toThrow(
        /Failed to fetch notification frequency preferences/
      );
    });

    test("throws error when network fails without response", async () => {
      axios.get.mockRejectedValue(new Error("Network Error"));
      await expect(notificationService.getFrequencyPreferences(userId)).rejects.toThrow(
        /Failed to fetch notification frequency preferences/
      );
    });

    test("handles empty response gracefully", async () => {
      axios.get.mockResolvedValue({ data: null });
      const result = await notificationService.getFrequencyPreferences(userId);
      expect(result).toBeNull();
    });
  });

  // ------------------------------
  // updateFrequencyPreferences
  // ------------------------------
  describe("updateFrequencyPreferences", () => {
    const fullFreq = {
      delivery_frequency: "Daily",
      delivery_time: "1970-01-01T09:00:00+00:00",
      delivery_day: "Monday",
    };

    test("updates API and calls updateUserNotifications successfully", async () => {
      axios.patch.mockResolvedValue({ status: 200 });
      publishService.updateUserNotifications.mockResolvedValue();

      await notificationService.updateFrequencyPreferences(userId, fullFreq);

      expect(axios.patch).toHaveBeenCalledWith(
        `http://kong:8000/notifications/preferences/frequency/${userId}`,
        fullFreq
      );
      expect(publishService.updateUserNotifications).toHaveBeenCalledWith(userId, fullFreq);
    });

    test("applies defaults if delivery_time or delivery_day missing", async () => {
      const partialFreq = { delivery_frequency: "Weekly" };
      axios.patch.mockResolvedValue({ status: 200 });
      publishService.updateUserNotifications.mockResolvedValue();

      await notificationService.updateFrequencyPreferences(userId, partialFreq);

      expect(axios.patch).toHaveBeenCalledWith(
        `http://kong:8000/notifications/preferences/frequency/${userId}`,
        {
          delivery_frequency: "Weekly",
          delivery_time: "1970-01-01T09:00:00+00:00",
          delivery_day: "Monday",
        }
      );
    });

    test("throws error when API patch fails", async () => {
      axios.patch.mockRejectedValue(new Error("API failure"));
      await expect(
        notificationService.updateFrequencyPreferences(userId, fullFreq)
      ).rejects.toThrow(/Failed to update notification frequency preferences/);
    });

    test("throws error when updateUserNotifications fails", async () => {
      axios.patch.mockResolvedValue({ status: 200 });
      publishService.updateUserNotifications.mockRejectedValue(new Error("Internal failure"));

      await expect(
        notificationService.updateFrequencyPreferences(userId, fullFreq)
      ).rejects.toThrow(/Failed to update existing notification frequency/);
    });

    test("handles API returning error object with response.data", async () => {
      axios.patch.mockRejectedValue({ response: { data: "Forbidden" } });
      await expect(
        notificationService.updateFrequencyPreferences(userId, fullFreq)
      ).rejects.toThrow(/Failed to update notification frequency preferences/);
    });

    test("handles null/undefined frequency object gracefully", async () => {
      axios.patch.mockResolvedValue({ status: 200 });
      publishService.updateUserNotifications.mockResolvedValue();

      await notificationService.updateFrequencyPreferences(userId, {});
      expect(axios.patch).toHaveBeenCalledWith(
        `http://kong:8000/notifications/preferences/frequency/${userId}`,
        {
          delivery_frequency: undefined,
          delivery_time: "1970-01-01T09:00:00+00:00",
          delivery_day: "Monday",
        }
      );
    });
  });
});
