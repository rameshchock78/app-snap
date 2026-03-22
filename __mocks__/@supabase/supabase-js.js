/**
 * Supabase mock — returns configurable fixtures for each table.
 * Tests set mockData before calling the code under test.
 */

const mockData = {};
const mockError = {};

const chain = (table) => ({
  select:   (cols) => chain(table),
  insert:   (row)  => chain(table),
  update:   (row)  => chain(table),
  upsert:   (row, opts) => chain(table),
  delete:   ()     => chain(table),
  eq:       (col, val) => chain(table),
  neq:      (col, val) => chain(table),
  order:    (col, opts) => chain(table),
  single:   () => Promise.resolve({ data: mockData[table] ?? null, error: mockError[table] ?? null }),
  then:     (resolve) => resolve({ data: mockData[table] ?? [], error: mockError[table] ?? null }),
});

const mockSupabase = {
  from:  (table) => chain(table),
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signUp:  jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
  channel: jest.fn().mockReturnValue({
    on:        jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
  }),
  removeChannel: jest.fn(),
  __setMockData:  (table, data)  => { mockData[table]  = data;  },
  __setMockError: (table, error) => { mockError[table] = error; },
  __clearMocks:   ()             => { Object.keys(mockData).forEach(k => delete mockData[k]); Object.keys(mockError).forEach(k => delete mockError[k]); },
};

module.exports = { createClient: jest.fn(() => mockSupabase), __mock: mockSupabase };
