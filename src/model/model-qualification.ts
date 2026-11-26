import { getWinProbability } from './model-helpers';
import { type Competition, type Pool } from './model';

interface SetScoreOutcome {
  readonly setsA: number;
  readonly setsB: number;
  readonly probability: number;
}

interface PoolStanding {
  wins: number;
  setsWon: number;
  setsLost: number;
}

export interface PoolAdvancementProbabilities {
  readonly first: readonly number[];
  readonly qualified: readonly number[];
}

// Confirmed two qualifiers per three-team pool for the published 2026/27 M18M rounds.
// Do not extrapolate to later rounds (some rounds may qualify only one team).
export const getM18QualifiedCount = (competition: Competition, day: number): number | undefined => {
  if (competition.season !== '2026/2027' || competition.category !== 'M18M') return undefined;
  if (competition.entity === 'CDF' && day >= 1 && day <= 4) return 2;
  if (competition.entity === 'CHALLENGE' && day >= 1 && day <= 3) return 2;
  return undefined;
};

// Under an independent-sets approximation, P(win a best-of-three match)
// is p²(3-2p). Invert this function so that the resulting four match
// score probabilities preserve the TrueSkill match-win probability.
const getSetWinProbability = (matchWinProbability: number): number => {
  const target = Math.max(0, Math.min(1, matchWinProbability));
  let low = 0;
  let high = 1;
  for (let i = 0; i < 40; i++) {
    const middle = (low + high) / 2;
    if (middle * middle * (3 - 2 * middle) < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
};

const getMatchScoreOutcomes = (matchWinProbability: number): readonly SetScoreOutcome[] => {
  const p = getSetWinProbability(matchWinProbability);
  const q = 1 - p;
  return [
    { setsA: 2, setsB: 0, probability: p * p },
    { setsA: 2, setsB: 1, probability: 2 * p * p * q },
    { setsA: 1, setsB: 2, probability: 2 * p * q * q },
    { setsA: 0, setsB: 2, probability: q * q },
  ];
};

const compareStandings = (a: PoolStanding, b: PoolStanding): number => {
  if (a.wins !== b.wins) return a.wins - b.wins;
  const ratioA = a.setsLost === 0 ? Infinity : a.setsWon / a.setsLost;
  const ratioB = b.setsLost === 0 ? Infinity : b.setsWon / b.setsLost;
  return ratioA === ratioB ? 0 : ratioA > ratioB ? 1 : -1;
};

const rankShare = (standings: readonly PoolStanding[], teamIndex: number, availablePlaces: number): number => {
  const team = standings[teamIndex];
  const ahead = standings.filter((other) => compareStandings(other, team) > 0).length;
  const tied = standings.filter((other) => compareStandings(other, team) === 0).length;
  return Math.min(1, Math.max(0, availablePlaces - ahead) / tied);
};

/**
 * Enumerates the 4³ possible match set scores in a three-team pool.
 *
 * TrueSkill supplies match-win probabilities, not set scores. Set scores are
 * approximated using an independent-sets model calibrated to each match's
 * TrueSkill probability. Standings use the M18 rules: 2 points per win,
 * 1 per defeat, then set ratio. Unresolved ties requiring the unknown
 * points ratio are shared equally rather than assigned fabricated scores.
 * This is an estimate of qualification, not an official ranking forecast.
 */
export const getPoolAdvancementProbabilities = (
  pool: Pool,
  day: number,
  qualifyingPlaces: number,
): PoolAdvancementProbabilities | undefined => {
  if (pool.teams.length !== 3 || pool.matchs.length !== 3 || qualifyingPlaces < 1 || qualifyingPlaces > 3) {
    return undefined;
  }

  const fixtures = pool.matchs.map((match) => ({
    a: pool.teams.indexOf(match.teamA),
    b: pool.teams.indexOf(match.teamB),
    outcomes: getMatchScoreOutcomes(getWinProbability(match.teamA, match.teamB, day)),
  }));
  if (fixtures.some((fixture) => fixture.a < 0 || fixture.b < 0 || fixture.a === fixture.b)) return undefined;

  const first = [0, 0, 0];
  const qualified = [0, 0, 0];
  for (const firstOutcome of fixtures[0].outcomes) {
    for (const secondOutcome of fixtures[1].outcomes) {
      for (const thirdOutcome of fixtures[2].outcomes) {
        const outcomes = [firstOutcome, secondOutcome, thirdOutcome];
        const weight = outcomes.reduce((acc, outcome) => acc * outcome.probability, 1);
        if (weight === 0) continue;

        const standings: PoolStanding[] = [
          { wins: 0, setsWon: 0, setsLost: 0 },
          { wins: 0, setsWon: 0, setsLost: 0 },
          { wins: 0, setsWon: 0, setsLost: 0 },
        ];
        fixtures.forEach((fixture, index) => {
          const outcome = outcomes[index];
          const a = standings[fixture.a];
          const b = standings[fixture.b];
          a.setsWon += outcome.setsA;
          a.setsLost += outcome.setsB;
          b.setsWon += outcome.setsB;
          b.setsLost += outcome.setsA;
          if (outcome.setsA > outcome.setsB) a.wins++;
          else b.wins++;
        });
        for (let index = 0; index < 3; index++) {
          first[index] += weight * rankShare(standings, index, 1);
          qualified[index] += weight * rankShare(standings, index, qualifyingPlaces);
        }
      }
    }
  }
  return { first, qualified };
};
