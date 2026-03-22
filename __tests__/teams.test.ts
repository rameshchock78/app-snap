/**
 * Team management business-logic tests.
 */

describe('Team — invite code validation', () => {
  const VALID_CODE_RE = /^[A-Z0-9]{8}$/;

  const validate = (code: string) => VALID_CODE_RE.test(code.trim().toUpperCase());

  test('accepts 8-char alphanumeric',  () => expect(validate('THUNDER1')).toBe(true));
  test('accepts lowercase (normalised)',() => expect(validate('thunder1')).toBe(true));
  test('rejects 7-char code',          () => expect(validate('SHORT12')).toBe(false));
  test('rejects 9-char code',          () => expect(validate('TOOLONGXX')).toBe(false));
  test('rejects special chars',        () => expect(validate('THUND-ER')).toBe(false));
  test('rejects empty string',         () => expect(validate('')).toBe(false));
});

describe('Team — role permissions', () => {
  type Role = 'coach' | 'manager' | 'player' | 'parent';

  const canCreateEvent  = (r: Role) => r === 'coach' || r === 'manager';
  const canDeleteEvent  = (r: Role) => r === 'coach' || r === 'manager';
  const canCreateInvoice= (r: Role) => r === 'coach' || r === 'manager';
  const canChangeRole   = (r: Role) => r === 'coach';

  test('coach can create event',    () => expect(canCreateEvent('coach')).toBe(true));
  test('manager can create event',  () => expect(canCreateEvent('manager')).toBe(true));
  test('player cannot create event',() => expect(canCreateEvent('player')).toBe(false));
  test('parent cannot create event',() => expect(canCreateEvent('parent')).toBe(false));

  test('coach can delete event',    () => expect(canDeleteEvent('coach')).toBe(true));
  test('player cannot delete event',() => expect(canDeleteEvent('player')).toBe(false));

  test('only coach can change roles',() => {
    expect(canChangeRole('coach')).toBe(true);
    expect(canChangeRole('manager')).toBe(false);
  });

  test('manager can create invoice', () => expect(canCreateInvoice('manager')).toBe(true));
  test('player cannot create invoice',() => expect(canCreateInvoice('player')).toBe(false));
});

describe('Team — sport list completeness', () => {
  const SPORTS = ['Soccer', 'Basketball', 'Baseball', 'Softball', 'Volleyball', 'Football', 'Hockey', 'Tennis', 'Swimming', 'Other'];

  test('contains at least 10 sports', () => expect(SPORTS.length).toBeGreaterThanOrEqual(10));
  test('contains Soccer',             () => expect(SPORTS).toContain('Soccer'));
  test('contains Other as fallback',  () => expect(SPORTS).toContain('Other'));
  test('no duplicates',               () => expect(new Set(SPORTS).size).toBe(SPORTS.length));
});
