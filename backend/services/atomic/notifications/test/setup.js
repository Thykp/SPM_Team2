process.env.NODE_ENV = 'test';
jest.setTimeout(15000);

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_API_KEY = process.env.SUPABASE_API_KEY || 'test_key';

jest.mock('@supabase/supabase-js', () => {
  const createTable = (defaultData = null) => {
    const table = {
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(async function () {
        if (this._error) return { data: null, error: this._error };
        return { data: this._data ?? defaultData, error: null };
      }),
      _data: defaultData,
      _error: null,
      mockResolvedValue({ data, error = null }) {
        this._data = data;
        this._error = error;
      },
    };
    return table;
  };

  const notificationsTable = createTable([
    {
      id: 'notif-1',
      to_user_id: 'user-1',
      title: 'Test Notification',
      description: 'This is a test notification',
      link: null,
      read: false,
      user_set_read: false,
      created_at: new Date().toISOString(),
    },
  ]);

  const notificationsWithUserTable = createTable([
    {
      id: 'notif-1',
      to_user_id: 'user-1',
      title: 'Test Notification',
      description: 'This is a test notification',
      link: null,
      read: false,
      user_set_read: false,
      created_at: new Date().toISOString(),
    },
  ]);

  const notificationPreferencesTable = createTable({
    preference_id: 'pref-1',
    user_id: 'user-1',
    email: 'user@example.com',
    delivery_method: ['in-app', 'email'],
    delivery_frequency: 'Immediate',
    delivery_day: 'Monday',
    delivery_time: '1970-01-01T00:00:00.000Z',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const fromMock = jest.fn((tableName) => {
    switch (tableName) {
      case 'notifications':
        return notificationsTable;
      case 'notifications_with_user':
        return notificationsWithUserTable;
      case 'notification_preferences':
        return notificationPreferencesTable;
      default:
        return createTable();
    }
  });

  const createClient = jest.fn(() => ({
    from: fromMock,
    auth: {
      getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
    },
  }));

  return { createClient };
});
