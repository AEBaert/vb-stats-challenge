import assert from 'node:assert/strict';

import { Rating } from 'ts-trueskill';

import { type Competition, type Match, type Pool, type Team } from '@/model/model';
import { createStats, getWinProbability } from '@/model/model-helpers';
import { addTeamMatch } from '@/model/model-process';
import { getPoolAdvancementProbabilities } from '@/model/model-qualification';

const teams = ['A', 'B', 'C'].map(
  (id) =>
    ({
      id,
      gstats: [{ rating: new Rating() }],
      dstats: [],
    }) as unknown as Team,
);

const buildMatch = (a: number, b: number): Match =>
  ({ teamA: teams[a], teamB: teams[b] }) as Match;

const pool = {
  teams,
  matchs: [buildMatch(0, 1), buildMatch(0, 2), buildMatch(1, 2)],
} as Pool;

const estimate = getPoolAdvancementProbabilities(pool, 1, 2);
assert.ok(estimate);
console.log('Neutral TrueSkill match probability:', getWinProbability(teams[0], teams[1], 1));
console.log('Neutral-pool forecast:', JSON.stringify(estimate));

const approximately = (actual: number, expected: number, message: string): void => {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-5, `${message}: actual=${actual}, expected=${expected}`);
};

estimate.first.forEach((probability) => approximately(probability, 1 / 3, 'Equal first-place chances'));
estimate.qualified.forEach((probability) => approximately(probability, 2 / 3, 'Equal qualifying chances'));
approximately(estimate.first.reduce((sum, value) => sum + value, 0), 1, 'First-place probabilities sum');
approximately(estimate.qualified.reduce((sum, value) => sum + value, 0), 2, 'Qualifying probabilities sum');

const oneQualifier = getPoolAdvancementProbabilities(pool, 1, 1);
assert.ok(oneQualifier);
oneQualifier.qualified.forEach((probability, index) =>
  approximately(probability, oneQualifier.first[index], 'One qualifier equals first-place probability'),
);

const cup = { entity: 'CDF', category: 'M18M' } as Competition;
const playedMatch = {
  teamA: teams[0],
  teamB: teams[1],
  winner: teams[0],
  setA: 2,
  setB: 0,
  score: [
    { scoreA: 25, scoreB: 19 },
    { scoreA: 25, scoreB: 20 },
  ],
} as Match;
const winnerStats = createStats(new Rating());
const loserStats = createStats(new Rating());
addTeamMatch(cup, teams[0], winnerStats, playedMatch);
addTeamMatch(cup, teams[1], loserStats, playedMatch);
assert.equal(winnerStats.points, 2);
assert.equal(loserStats.points, 1);

const forfeitStats = createStats(new Rating());
addTeamMatch(cup, teams[1], forfeitStats, { ...playedMatch, penalizedTeamIds: [teams[1].id] });
assert.equal(forfeitStats.points, 0);

const championship = { entity: 'LICA', category: 'PMA' } as Competition;
const otherStats = createStats(new Rating());
addTeamMatch(championship, teams[0], otherStats, playedMatch);
assert.equal(otherStats.points, 3);

console.log('M18 qualification scenarios and competition points: OK');
