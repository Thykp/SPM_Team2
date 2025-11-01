// test/email.test.js
const axios = require("axios");
const { sendDeadlineOrAddedEmail, sendUpdates } = require("../services/email");

jest.mock("axios");

describe("Email Service", () => {
  const mockPayload = {
    user_id: "user1",
    task: { title: "Test Task", description: "Task description" },
    email: "user@example.com",
    push: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendDeadlineOrAddedEmail", () => {
    it("sends email successfully", async () => {
      axios.post.mockResolvedValue({ data: "success" });

      await sendDeadlineOrAddedEmail(mockPayload);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        "https://api.emailjs.com/api/v1.0/email/send",
        expect.objectContaining({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_RESOURCE_TEMPLATE,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          template_params: { payload: mockPayload },
        }),
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("logs error when email fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      axios.post.mockRejectedValue({ message: "Network error" });

      await sendDeadlineOrAddedEmail(mockPayload);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Email] Failed to send Deadline/Added email:",
        "Network error"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("sendUpdates", () => {
    it("sends update email successfully", async () => {
      axios.post.mockResolvedValue({ data: "success" });

      await sendUpdates(mockPayload);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        "https://api.emailjs.com/api/v1.0/email/send",
        expect.objectContaining({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_UPDATE_TEMPLATE,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          template_params: { payload: mockPayload },
        }),
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("logs error when update email fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      axios.post.mockRejectedValue({ message: "Server error" });

      await sendUpdates(mockPayload);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Email] Failed to send Updates email:",
        "Server error"
      );

      consoleSpy.mockRestore();
    });
  });
});
