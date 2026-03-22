/**
 * Unit tests for pure utility / business logic functions.
 * No Supabase or React needed — runs fully in Node.
 */

// ── helpers replicated from app logic ──────────────────────────────────────

function groupEventsByDate(events: Array<{ start_time: string; title: string }>) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msDay = 86_400_000;

  const groups: Record<string, typeof events> = {
    Today: [], Tomorrow: [], 'This Week': [], Later: [],
  };

  for (const event of events) {
    const start = new Date(event.start_time);
    const diff  = Math.floor((start.getTime() - today.getTime()) / msDay);

    if (diff === 0)       groups['Today'].push(event);
    else if (diff === 1)  groups['Tomorrow'].push(event);
    else if (diff <= 7)   groups['This Week'].push(event);
    else                  groups['Later'].push(event);
  }

  return groups;
}

function formatRsvpSummary(attendances: Array<{ status: string }>) {
  return attendances.reduce(
    (acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );
}

function formatInviteCode(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function invoiceAmountDisplay(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function winLossRecord(games: Array<{ home_score: number; away_score: number }>) {
  return games.reduce(
    (acc, g) => {
      if (g.home_score > g.away_score)       acc.wins++;
      else if (g.home_score < g.away_score)  acc.losses++;
      else                                   acc.draws++;
      return acc;
    },
    { wins: 0, losses: 0, draws: 0 }
  );
}

function roleHierarchyCanEdit(role: string) {
  return role === 'coach' || role === 'manager';
}

// ── test suites ────────────────────────────────────────────────────────────

describe('groupEventsByDate', () => {
  const make = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(10, 0, 0, 0);
    return { start_time: d.toISOString(), title: `Event +${offsetDays}d` };
  };

  test('routes today event to Today', () => {
    const groups = groupEventsByDate([make(0)]);
    expect(groups.Today).toHaveLength(1);
  });

  test('routes tomorrow event to Tomorrow', () => {
    const groups = groupEventsByDate([make(1)]);
    expect(groups.Tomorrow).toHaveLength(1);
  });

  test('routes day 3 event to This Week', () => {
    const groups = groupEventsByDate([make(3)]);
    expect(groups['This Week']).toHaveLength(1);
  });

  test('routes day 14 event to Later', () => {
    const groups = groupEventsByDate([make(14)]);
    expect(groups.Later).toHaveLength(1);
  });

  test('handles empty array', () => {
    const groups = groupEventsByDate([]);
    expect(Object.values(groups).every(g => g.length === 0)).toBe(true);
  });

  test('distributes mixed events correctly', () => {
    const events = [make(0), make(0), make(1), make(5), make(20)];
    const groups = groupEventsByDate(events);
    expect(groups.Today).toHaveLength(2);
    expect(groups.Tomorrow).toHaveLength(1);
    expect(groups['This Week']).toHaveLength(1);
    expect(groups.Later).toHaveLength(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────

describe('formatRsvpSummary', () => {
  test('counts correctly', () => {
    const result = formatRsvpSummary([
      { status: 'yes' }, { status: 'yes' }, { status: 'no' }, { status: 'maybe' },
    ]);
    expect(result).toEqual({ yes: 2, no: 1, maybe: 1 });
  });

  test('handles empty', () => {
    expect(formatRsvpSummary([])).toEqual({});
  });

  test('handles all-yes', () => {
    const result = formatRsvpSummary(Array(5).fill({ status: 'yes' }));
    expect(result.yes).toBe(5);
    expect(result.no).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────────────────────────────

describe('formatInviteCode', () => {
  test('uppercases input',        () => expect(formatInviteCode('abcd1234')).toBe('ABCD1234'));
  test('trims whitespace',        () => expect(formatInviteCode('  AB12CD34  ')).toBe('AB12CD34'));
  test('removes special chars',   () => expect(formatInviteCode('AB-12-CD')).toBe('AB12CD'));
  test('handles already valid',   () => expect(formatInviteCode('THUNDER1')).toBe('THUNDER1'));
});

// ──────────────────────────────────────────────────────────────────────────

describe('invoiceAmountDisplay', () => {
  test('formats whole dollars',   () => expect(invoiceAmountDisplay(5000)).toBe('$50.00'));
  test('formats cents',           () => expect(invoiceAmountDisplay(199)).toBe('$1.99'));
  test('formats zero',            () => expect(invoiceAmountDisplay(0)).toBe('$0.00'));
  test('formats large amount',    () => expect(invoiceAmountDisplay(100000)).toBe('$1000.00'));
});

// ──────────────────────────────────────────────────────────────────────────

describe('winLossRecord', () => {
  const games = [
    { home_score: 3, away_score: 1 },  // win
    { home_score: 0, away_score: 2 },  // loss
    { home_score: 1, away_score: 1 },  // draw
    { home_score: 2, away_score: 0 },  // win
  ];

  test('counts wins',   () => expect(winLossRecord(games).wins).toBe(2));
  test('counts losses', () => expect(winLossRecord(games).losses).toBe(1));
  test('counts draws',  () => expect(winLossRecord(games).draws).toBe(1));
  test('handles empty', () => expect(winLossRecord([])).toEqual({ wins: 0, losses: 0, draws: 0 }));
});

// ──────────────────────────────────────────────────────────────────────────

describe('roleHierarchyCanEdit', () => {
  test('coach can edit',   () => expect(roleHierarchyCanEdit('coach')).toBe(true));
  test('manager can edit', () => expect(roleHierarchyCanEdit('manager')).toBe(true));
  test('player cannot',    () => expect(roleHierarchyCanEdit('player')).toBe(false));
  test('parent cannot',    () => expect(roleHierarchyCanEdit('parent')).toBe(false));
});
