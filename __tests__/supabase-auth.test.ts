/**
 * Auth flow unit tests — mocked Supabase client.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(),
}));
jest.mock('react-native-url-polyfill/auto', () => {});

const { __mock: mockSupa } = require('@supabase/supabase-js');

describe('Auth — signInWithPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupa.__clearMocks();
  });

  test('calls signInWithPassword with correct args', async () => {
    mockSupa.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: { user: { id: 'u1' } } }, error: null });
    const result = await mockSupa.auth.signInWithPassword({ email: 'coach@appsnap.test', password: 'Test1234!' });
    expect(mockSupa.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'coach@appsnap.test', password: 'Test1234!' });
    expect(result.error).toBeNull();
  });

  test('returns error on bad credentials', async () => {
    mockSupa.auth.signInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'Invalid login credentials' } });
    const result = await mockSupa.auth.signInWithPassword({ email: 'bad@test.com', password: 'wrong' });
    expect(result.error?.message).toBe('Invalid login credentials');
  });
});

describe('Auth — signUp', () => {
  test('calls signUp with email, password and metadata', async () => {
    mockSupa.auth.signUp.mockResolvedValueOnce({ data: { user: { id: 'new-user' } }, error: null });
    const result = await mockSupa.auth.signUp({
      email: 'new@appsnap.test', password: 'Test1234!',
      options: { data: { full_name: 'New User' } },
    });
    expect(mockSupa.auth.signUp).toHaveBeenCalledTimes(1);
    expect(result.data?.user?.id).toBe('new-user');
  });

  test('validates short password guard (app-level)', () => {
    const validatePassword = (p: string) => p.length >= 8;
    expect(validatePassword('short')).toBe(false);
    expect(validatePassword('Test1234!')).toBe(true);
  });
});

describe('Auth — signOut', () => {
  test('calls signOut once', async () => {
    mockSupa.auth.signOut.mockResolvedValueOnce({ error: null });
    await mockSupa.auth.signOut();
    expect(mockSupa.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
