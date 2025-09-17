describe('db/supabase', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it('creates Supabase client with env vars', () => {
    jest.isolateModules(() => {
      process.env = {
        ...ORIGINAL_ENV,
        SUPABASE_URL: 'http://example',
        SUPABASE_API_KEY: 'key',
      };

      jest.doMock('@supabase/supabase-js', () => {
        const createClient = jest.fn(() => ({ from: jest.fn() }));
        return { createClient };
      });

      const { supabase } = require('../../db/supabase');
      expect(supabase).toBeTruthy();

      const { createClient } = jest.requireMock('@supabase/supabase-js');
      expect(createClient).toHaveBeenCalledWith(
        'http://example',
        'key',
        expect.objectContaining({ auth: { persistSession: false } })
      );
    });
  });
});
