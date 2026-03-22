/**
 * Event scheduling logic tests.
 */

type EventType = 'game' | 'practice' | 'meeting' | 'other';
type RsvpStatus = 'yes' | 'no' | 'maybe';

// ── helpers under test ────────────────────────────────────────────────────

const EVENT_EMOJI: Record<EventType, string> = {
  game: '⚽', practice: '🏃', meeting: '📋', other: '📌',
};

function getEventEmoji(type: EventType) {
  return EVENT_EMOJI[type] ?? '📌';
}

function formatEventTimeRange(start: string, end?: string) {
  const s = new Date(start);
  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (!end) return fmt(s);
  const e = new Date(end);
  return `${fmt(s)} – ${fmt(e)}`;
}

function validateEventInput(title: string, type: string, startTime: Date, endTime?: Date) {
  const errors: string[] = [];
  if (!title.trim())             errors.push('Title is required');
  if (!type)                     errors.push('Type is required');
  if (isNaN(startTime.getTime()))errors.push('Start time is invalid');
  if (endTime && endTime <= startTime) errors.push('End time must be after start time');
  return errors;
}

function isUpcoming(startTime: string) {
  return new Date(startTime) > new Date();
}

function eventTypeLabel(type: EventType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ── tests ─────────────────────────────────────────────────────────────────

describe('getEventEmoji', () => {
  test('game → ⚽',     () => expect(getEventEmoji('game')).toBe('⚽'));
  test('practice → 🏃', () => expect(getEventEmoji('practice')).toBe('🏃'));
  test('meeting → 📋',  () => expect(getEventEmoji('meeting')).toBe('📋'));
  test('other → 📌',    () => expect(getEventEmoji('other')).toBe('📌'));
});

describe('formatEventTimeRange', () => {
  test('single time when no end', () => {
    const result = formatEventTimeRange('2026-04-01T10:00:00Z');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  test('includes dash separator with end time', () => {
    const result = formatEventTimeRange('2026-04-01T10:00:00Z', '2026-04-01T12:00:00Z');
    expect(result).toContain('–');
  });
});

describe('validateEventInput', () => {
  const futureDate = new Date(Date.now() + 86_400_000);
  const pastDate   = new Date(Date.now() - 86_400_000);

  test('passes with valid input', () => {
    expect(validateEventInput('Practice', 'practice', futureDate)).toHaveLength(0);
  });

  test('fails with empty title', () => {
    const errs = validateEventInput('', 'game', futureDate);
    expect(errs).toContain('Title is required');
  });

  test('fails with empty type', () => {
    const errs = validateEventInput('Practice', '', futureDate);
    expect(errs).toContain('Type is required');
  });

  test('fails when end <= start', () => {
    const start = new Date('2026-04-01T10:00:00Z');
    const end   = new Date('2026-04-01T09:00:00Z');
    const errs  = validateEventInput('Game', 'game', start, end);
    expect(errs).toContain('End time must be after start time');
  });

  test('passes when end > start', () => {
    const start = new Date('2026-04-01T10:00:00Z');
    const end   = new Date('2026-04-01T12:00:00Z');
    expect(validateEventInput('Game', 'game', start, end)).toHaveLength(0);
  });
});

describe('isUpcoming', () => {
  test('future event is upcoming', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isUpcoming(future)).toBe(true);
  });

  test('past event is not upcoming', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(isUpcoming(past)).toBe(false);
  });
});

describe('eventTypeLabel', () => {
  test('capitalises game',     () => expect(eventTypeLabel('game')).toBe('Game'));
  test('capitalises practice', () => expect(eventTypeLabel('practice')).toBe('Practice'));
  test('capitalises meeting',  () => expect(eventTypeLabel('meeting')).toBe('Meeting'));
});

describe('RSVP status logic', () => {
  const rsvpLabel: Record<RsvpStatus, string> = { yes: 'Going', no: 'Not Going', maybe: 'Maybe' };
  const rsvpEmoji: Record<RsvpStatus, string> = { yes: '✅', no: '❌', maybe: '🤔' };

  test('yes maps to Going',         () => expect(rsvpLabel.yes).toBe('Going'));
  test('no maps to Not Going',      () => expect(rsvpLabel.no).toBe('Not Going'));
  test('maybe maps to Maybe',       () => expect(rsvpLabel.maybe).toBe('Maybe'));
  test('all statuses have emojis',  () => {
    expect(Object.keys(rsvpEmoji)).toEqual(['yes', 'no', 'maybe']);
  });
});
