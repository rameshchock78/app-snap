/**
 * Stats and scoring logic tests.
 */

function calculateRecord(games: Array<{ home_score: number; away_score: number }>) {
  return games.reduce(
    (acc, g) => {
      if      (g.home_score > g.away_score) acc.wins++;
      else if (g.home_score < g.away_score) acc.losses++;
      else                                   acc.draws++;
      acc.goalsFor     += g.home_score;
      acc.goalsAgainst += g.away_score;
      return acc;
    },
    { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0 }
  );
}

function formatScore(home: number, away: number, teamName = 'Us') {
  return `${teamName} ${home} – ${away}`;
}

function isLiveGame(game: { is_live: boolean }) {
  return game.is_live === true;
}

function validateScoreInput(score: number) {
  return Number.isInteger(score) && score >= 0 && score <= 99;
}

function goalDifference(home: number, away: number) {
  return home - away;
}

describe('calculateRecord', () => {
  const games = [
    { home_score: 3, away_score: 1 }, // W
    { home_score: 0, away_score: 2 }, // L
    { home_score: 1, away_score: 1 }, // D
    { home_score: 2, away_score: 0 }, // W
    { home_score: 1, away_score: 3 }, // L
  ];

  test('counts 2 wins',             () => expect(calculateRecord(games).wins).toBe(2));
  test('counts 2 losses',           () => expect(calculateRecord(games).losses).toBe(2));
  test('counts 1 draw',             () => expect(calculateRecord(games).draws).toBe(1));
  test('sums goals for',            () => expect(calculateRecord(games).goalsFor).toBe(7));
  test('sums goals against',        () => expect(calculateRecord(games).goalsAgainst).toBe(7));
  test('handles empty array',       () => expect(calculateRecord([])).toEqual({ wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0 }));
  test('handles single win',        () => {
    const r = calculateRecord([{ home_score: 1, away_score: 0 }]);
    expect(r.wins).toBe(1);
    expect(r.losses).toBe(0);
  });
});

describe('formatScore', () => {
  test('formats default team name',  () => expect(formatScore(3, 1)).toBe('Us 3 – 1'));
  test('formats custom team name',   () => expect(formatScore(2, 2, 'Thunder FC')).toBe('Thunder FC 2 – 2'));
  test('formats 0-0 draw',           () => expect(formatScore(0, 0, 'Thunder')).toBe('Thunder 0 – 0'));
});

describe('isLiveGame', () => {
  test('true when is_live = true',   () => expect(isLiveGame({ is_live: true })).toBe(true));
  test('false when is_live = false', () => expect(isLiveGame({ is_live: false })).toBe(false));
});

describe('validateScoreInput', () => {
  test('0 is valid',   () => expect(validateScoreInput(0)).toBe(true));
  test('10 is valid',  () => expect(validateScoreInput(10)).toBe(true));
  test('99 is valid',  () => expect(validateScoreInput(99)).toBe(true));
  test('-1 is invalid',() => expect(validateScoreInput(-1)).toBe(false));
  test('100 is invalid',()=> expect(validateScoreInput(100)).toBe(false));
  test('1.5 is invalid',()=> expect(validateScoreInput(1.5)).toBe(false));
});

describe('goalDifference', () => {
  test('positive for wins',   () => expect(goalDifference(3, 1)).toBe(2));
  test('zero for draws',      () => expect(goalDifference(1, 1)).toBe(0));
  test('negative for losses', () => expect(goalDifference(0, 2)).toBe(-2));
});
