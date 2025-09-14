const origEnv = { ...process.env };

afterEach(() => {
  jest.resetModules();
  process.env = { ...origEnv };
});

it('creates supabase client with env vars', () => {
  process.env.SUPABASE_URL = 'http://example';
  process.env.SUPABASE_API_KEY = 'key';

  const createClient = jest.fn(() => ({ from: jest.fn() }));
  jest.mock('@supabase/supabase-js', () => ({ createClient }));

  // Load the module *after* mocking & env set
  jest.isolateModules(() => {
    const { supabase } = require('../../db/supabase');
    expect(supabase).toBeTruthy();
  });

  expect(createClient).toHaveBeenCalledWith('http://example', 'key');
});
