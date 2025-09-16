const { supabase } = require('../../db/supabase');

describe('Supabase Database Connection', () => {
  test('supabase client should be defined', () => {
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeDefined();
  });
});
