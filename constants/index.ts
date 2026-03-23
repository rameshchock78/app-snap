export * from './colors';

export const APP_NAME = 'Teamly';

export const ROLES = {
  COACH: 'coach',
  MANAGER: 'manager',
  PLAYER: 'player',
  PARENT: 'parent',
} as const;

export const EVENT_TYPES = {
  GAME: 'game',
  PRACTICE: 'practice',
  MEETING: 'meeting',
  OTHER: 'other',
} as const;

export const RSVP_STATUS = {
  YES: 'yes',
  NO: 'no',
  MAYBE: 'maybe',
} as const;
