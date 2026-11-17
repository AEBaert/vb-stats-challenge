#!/usr/bin/env -S node --no-warnings --loader ts-node/esm

import { PromisePool } from '@supercharge/promise-pool';

import { type Division, type Entity, fetchFFVBResults } from './vb-utils';

const competitions = {
  CDF: {
    seasons: [2027],
    divisions: ['M13M', 'M15M', 'M18M', 'M21M', 'M13F', 'M15F', 'M18F', 'M21F'],
  },
  CHALLENGE: {
    // Challenge de France M18 appears in FFVolley archives from 2024/2025.
    seasons: [2025, 2026, 2027],
    divisions: ['M18M'],
  },
};

(async () => {
  const results = Object.entries(competitions).flatMap(([entity, config]) => {
    return config.seasons.flatMap((season) =>
      config.divisions.map((division) => {
        return { season, entity, division };
      }),
    );
  });

  await PromisePool.withConcurrency(4)
    .for(results)
    .process(async ({ season, entity, division }) => {
      await fetchFFVBResults({ season, entity: entity as Entity, division: division as Division });
    });
})();
