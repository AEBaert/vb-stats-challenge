import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import Papa from 'papaparse';
import type { Rating } from 'ts-trueskill';

import { createMetaStats, metaAddMatch, metaToString } from '@/model/meta';
import { type Competition, type Entity, getResourceName, type MatchRow } from '@/model/model';
import { createCompetition, getGlobalTeamStats } from '@/model/model-helpers';
import { processCompetition } from '@/model/model-process';

const useCompetition = (season: number, entity: Entity, category: string): UseQueryResult<Competition, Error> => {
  const resource = getResourceName(season, entity, category);
  return useQuery<Competition, Error>({
    queryKey: [resource, season, entity, category],
    queryFn: async () => {
      const now = Date.now();

      const request = await axios.get(import.meta.env.BASE_URL + '/data/' + resource);
      const { data } = Papa.parse<MatchRow>(request.data, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
      });

      let initialRatings: Map<string, Rating> | undefined;
      // Fork-specific Challenge seeding; this is not part of the original vb-stats rating model.
      // See docs/rating-methodology.md before changing or relying on this behaviour.
      if (entity === 'CHALLENGE') {
        const cdfResource = getResourceName(season, 'CDF', category);
        const cdfRequest = await axios.get(import.meta.env.BASE_URL + '/data/' + cdfResource);
        const { data: cdfData } = Papa.parse<MatchRow>(cdfRequest.data, {
          header: true,
          delimiter: ';',
          skipEmptyLines: true,
        });
        const cdfCompetition = createCompetition('CDF Seed', `${season - 1}/${season}`, 'CDF', category);
        if (cdfData.length > 0) processCompetition(cdfCompetition, [cdfData]);

        const firstChallengeDay = new Map<string, number>();
        data.forEach((row) => {
          const day = Number(row.Jo);
          if (!Number.isFinite(day) || day <= 0 || day === 99) return;
          [row.EQA_no, row.EQB_no].forEach((teamId) => {
            if (!teamId) return;
            const previous = firstChallengeDay.get(teamId);
            if (previous === undefined || day < previous) firstChallengeDay.set(teamId, day);
          });
        });

        initialRatings = new Map<string, Rating>();
        firstChallengeDay.forEach((challengeDay, teamId) => {
          const cdfTeam = cdfCompetition.teams.get(teamId);
          if (!cdfTeam || cdfTeam.lastDay <= 0) return;
          const cdfDay = Math.min(challengeDay, cdfTeam.lastDay);
          initialRatings?.set(teamId, getGlobalTeamStats(cdfTeam, cdfDay).rating);
        });
      }

      const competition = createCompetition(
        'Volley-Ball Stats',
        `${season - 1}/${season}`,
        entity,
        category,
        initialRatings,
      );
      try {
        data.length > 0 && processCompetition(competition, [data]);
      } catch (e) {
        console.error(e);
        throw e;
      }
      console.log(
        `${competition.name} ${competition.season} ${competition.category}:Processed ${competition.matchs.length} matchs on ${competition.lastDay}/${competition.dayCount} day(s).`,
      );

      const meta = createMetaStats();
      competition.matchs.forEach((match) => metaAddMatch(meta, match));
      console.log(metaToString(meta));

      console.log('Processed in', Date.now() - now, 'ms.');
      return competition;
    },
    staleTime: Infinity,
  });
};

export default useCompetition;
