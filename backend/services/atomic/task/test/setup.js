process.env.NODE_ENV = 'test';
jest.setTimeout(15000);

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_API_KEY = process.env.SUPABASE_API_KEY || 'test_key';

const defaultResponse = { data: [], error: null };

const tableRegistry = new Map();

function makeFromBuilder(tableName) {
  const state = { filters: [], limit: undefined, order: undefined, single: false };

  const result = {
    select: jest.fn(async () => tableRegistry.get(tableName) ?? defaultResponse),
    insert: jest.fn(async () => ({ data: { id: 'new-id' }, error: null })),
    update: jest.fn(async () => ({ data: { id: 'updated-id' }, error: null })),
    delete: jest.fn(async () => ({ data: null, error: null })),

    eq: jest.fn(function (col, val) { state.filters.push({ type: 'eq', col, val }); return this; }),
    neq: jest.fn(function (col, val) { state.filters.push({ type: 'neq', col, val }); return this; }),
    in: jest.fn(function (col, vals) { state.filters.push({ type: 'in', col, vals }); return this; }),
    order: jest.fn(function (col, opts = {}) { state.order = { col, ...opts }; return this; }),
    limit: jest.fn(function (n) { state.limit = n; return this; }),
    single: jest.fn(function () { state.single = true; return this; }),

    __state: state,
  };

  return result;
}

jest.mock('@supabase/supabase-js', () => {
  const createClient = jest.fn(() => {
    return {
      from: jest.fn((tableName) => makeFromBuilder(tableName)),

      auth: {
        getUser: jest.fn(async () => ({ data: { user: { id: 'u_test' } }, error: null })),
      },
    };
  });

  return { createClient };
});
