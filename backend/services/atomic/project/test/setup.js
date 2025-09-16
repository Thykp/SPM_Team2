process.env.NODE_ENV = 'test';
jest.setTimeout(15000);

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_API_KEY = process.env.SUPABASE_API_KEY || 'test_key';

jest.mock('@supabase/supabase-js', () => {
  const createClient = jest.fn(() => {
    return {
      from: () => ({
        select: async () => ({ data: [], error: null }),
        insert: () => ({
          select: async () => ({ data: [{ id: 'test-id', title: 'Test Project' }], error: null }),
        }),
        update: async () => ({ data: null, error: null }),
        delete: async () => ({ data: null, error: null }),
        eq: () => ({
          select: async () => ({ data: [], error: null }),
        }),
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    };
  });
  return { createClient };
});
