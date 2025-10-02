process.env.NODE_ENV = 'test';
jest.setTimeout(15000);

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_API_KEY = process.env.SUPABASE_API_KEY || 'test-key';

jest.mock('@supabase/supabase-js', () => {
  const nextResults = [];

  const makeBuilder = (fallback = { data: [], error: null }) => {
    const result = nextResults.length ? nextResults.shift() : { ...fallback };

    const builder = {
      select:   jest.fn(() => builder),
      insert:   jest.fn(() => builder),
      update:   jest.fn(() => builder),
      delete:   jest.fn(() => builder),
      order:    jest.fn(() => builder),
      eq:       jest.fn(() => builder),
      contains: jest.fn(() => builder),
      overlaps: jest.fn(() => builder),
      in:       jest.fn(() => builder),

      single: jest.fn(() => Promise.resolve({ ...result })),

      then: (resolve) => resolve({ ...result }),
      catch: () => {},

      __setResult: (next) => { result.data = next.data; result.error = next.error ?? null; return builder; },
    };
    return builder;
  };

  const mockClient = {
    from: jest.fn(() => makeBuilder()),
    rpc:  jest.fn(() => Promise.resolve({ data: null, error: null })),
    auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })) },

    __pushNextResult: (res) => { nextResults.push(res); },
    __setNextResults: (arr) => { nextResults.splice(0, nextResults.length, ...arr); },
  };

  return { createClient: jest.fn(() => mockClient) };
});
