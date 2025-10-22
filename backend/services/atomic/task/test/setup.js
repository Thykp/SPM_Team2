process.env.NODE_ENV = 'test';
jest.setTimeout(15000);

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_API_KEY = process.env.SUPABASE_API_KEY || 'test-key';

jest.mock('@supabase/supabase-js', () => {
  const mockClient = {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
    auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })) },
  };

  return { createClient: jest.fn(() => mockClient) };
});
