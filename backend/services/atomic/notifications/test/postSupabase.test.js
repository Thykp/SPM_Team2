// test/postSupabase.test.js
const { postToSupabase } = require("../services/postSupabase");
const { supabase } = require("../db/supabase");

jest.mock("../db/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("postToSupabase", () => {
  const mockNotification = {
    id: "notif1",
    user_id: "user1",
    title: "Test Notification",
    description: "Notification description",
    link: "/app/test",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("inserts a notification successfully", async () => {
    const insertMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockResolvedValue({ data: [mockNotification], error: null });

    supabase.from.mockReturnValue({ insert: insertMock });
    insertMock.mockReturnValue({ select: selectMock });

    const data = await postToSupabase(mockNotification);

    expect(supabase.from).toHaveBeenCalledWith("notifications");
    expect(insertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        id: mockNotification.id,
        to_user_id: mockNotification.user_id,
        title: mockNotification.title,
        description: mockNotification.description,
        link: mockNotification.link,
        read: false,
        user_set_read: false,
      }),
    ]);
    expect(selectMock).toHaveBeenCalled();
    expect(data).toEqual([mockNotification]);
  });

  it("logs error if insertion fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const insertMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });

    supabase.from.mockReturnValue({ insert: insertMock });
    insertMock.mockReturnValue({ select: selectMock });

    const data = await postToSupabase(mockNotification);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[supabaseHelper] Error inserting notification:",
      "DB error"
    );
    expect(data).toBeUndefined();

    consoleSpy.mockRestore();
  });
});
