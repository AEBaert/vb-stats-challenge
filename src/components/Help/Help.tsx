import { presetDarkPalettes } from '@ant-design/colors';
import { Progress } from 'antd';
import cx from 'classnames';

import { type Competition, getCompetitionLabel, type Pool } from '@/model/model';
import { getDayRanking, getPoolProbabilities } from '@/model/model-helpers';

import './Help.scss';

import vbStatsLogo from '/vb-stats-logo.svg';

const NA = '_';

interface Props {
  competition: Competition;
  day: number;
  singleDay: boolean;
  qualified: boolean;
  className?: string | string[];
}

interface Stats {
  predicted: number;
  unpredicted: number;
  outsiders: number;
  right: number; // predicted match count
  total: number; // predictable match count
}

const updateStats = ({
  competition,
  pool,
  day,
  stats,
}: {
  competition: Competition;
  pool: Pool;
  day: number;
  stats: Stats;
}): Stats => {
  const [_probabilities, orders] = getPoolProbabilities(pool, day);
  pool.teams.forEach((team, index) => {
    const rank = orders[index];
    const dayRanking = getDayRanking(competition, team, day);
    // const eliminated = dayRanking === 3;
    const predicted = rank === 1 && dayRanking === 1;
    const unpredicted = rank === 1 && dayRanking === 3;
    const outsider = rank === 3 && dayRanking === 1;
    if (predicted) stats.predicted++;
    if (unpredicted) stats.unpredicted++;
    if (outsider) stats.outsiders++;
  });
  pool.matchs.forEach((match) => {
    if (match.predicted === true) stats.right++;
    if (match.predicted !== undefined) stats.total++;
  });
  return stats;
};

const Help = ({ competition, day, singleDay: _singleDay, qualified: _qualified, className: _className }: Props) => {
  const chartSize = 70;
  const { blue, green, gold, red } = presetDarkPalettes;
  const cday = competition.days[day];
  const pools = Array.from(cday.pools.values());
  const stats: Stats = {
    predicted: 0,
    unpredicted: 0,
    outsiders: 0,
    right: 0,
    total: 0,
  };
  pools.forEach((pool: Pool) => updateStats({ competition, pool, day, stats }));

  return (
    <div className="vb-info-card">
      <div className="vb-info-header">
        <img src={vbStatsLogo} className="vb-stats-icon" alt="vb-stats logo" />
        <h2>
          VB Stats - {`${getCompetitionLabel(competition.entity)} ${competition.category} ${competition.season.substring(competition.season.length - 4)}`}
        </h2>
        <div className={cx('vb-info-scroll', { 'vb-info-unplayed': day > competition.lastDay })}>
          <p>
            Bienvenue dans la page de statistiques du {getCompetitionLabel(competition.entity)} Volley-Ball {competition.category}{' '}
            {competition.season}.
          </p>
          <p>
            Chaque équipe est évaluée suivant le système{' '}
            <a href="https://www.microsoft.com/en-us/research/project/trueskill-ranking-system/">TrueSkill™</a> donnant
            une note (<i>rating</i>) qui évolue à chaque match en fonction des sets gagnés ou perdus. Ce <i>rating</i>{' '}
            permet d&apos;estimer la probabilité de victoire pour chaque match et la probabilité pour chaque équipe de
            terminer premier de sa poule.
          </p>
          {competition.season === '2026/2027' && competition.category === 'M18M' ? (
            <p>
              Les cercles <strong>1er</strong> indiquent la chance estimée de terminer premier de poule selon le
              modèle original. Les cercles <strong>Qualif.</strong>, affichés pour les tours où deux équipes sur
              trois se qualifient, estiment la chance de finir parmi les deux premières. Ils combinent les
              probabilités TrueSkill des trois matchs avec 64 scénarios possibles de scores en sets (2-0, 2-1,
              1-2, 0-2). Les scores en sets sont estimés à partir des probabilités de match, et les égalités
              encore indécidables au ratio de points sont réparties équitablement : ce sont des prévisions,
              pas des probabilités officielles.
            </p>
          ) : null}
          {competition.entity === 'CHALLENGE' ? (
            <p>
              Pour le Challenge M18M, le <i>rating</i> suit la même équipe sur la saison : une équipe entrant au T1
              Challenge conserve son état après le T1 Coupe, et une équipe entrant au T2 conserve son état après le T2
              Coupe. Les règles de mise à jour TrueSkill restent celles du projet original. En revanche, les points,
              classements, victoires, sets et points marqués/encaissés affichés pour le Challenge utilisent uniquement
              les matchs du Challenge. Au J2 uniquement, le classement global place d&apos;abord les premiers de
              poule, puis les deuxièmes, puis les troisièmes ; à place égale, le rating TrueSkill départage les
              équipes. À partir du J3, le classement global standard est de nouveau utilisé.
            </p>
          ) : null}
          {competition.category.startsWith('M18') && (competition.entity === 'CDF' || competition.entity === 'CHALLENGE') ? (
            <p>
              Barème officiel M18 : 2 points par victoire, 1 point par défaite jouée et 0 en cas de
              forfait ou de pénalité. À égalité, le ratio de sets précède celui des points.
            </p>
          ) : null}
          <p>
            La barre de recherche permet de filtrer les équipes par noms, départements ou régions. Par exemple,{' '}
            <i>&quot;cannes 84 occit&quot;</i> affichera toutes les poules contenant l&apos;équipe de Cannes, celles du
            Vaucluse (84) et celles d&apos;Occitanie.
          </p>
          <p>
            La barre de menu permet aussi d&apos;afficher, le classement (<i>Board</i>), le graphe des matchs (
            <i>Graph</i>) mais aussi de changer de journée, de catégorie ou de saison.
          </p>
          <p>
            Toutes les données utilisées proviennent du site de la{' '}
            <a href="http://www.ffvb.org/index.php?lvlid=124&dsgtypid=38&artid=1095&pos=2">FFVolley</a>.
          </p>
          <p>
            Ce site est une adaptation du projet original{' '}
            <a href="https://github.com/gillesdandrea/vb-stats">vb-stats</a> développé par Gilles Dandrea. Le code
            source original et la méthodologie de calcul sont conservés et adaptés ici au Challenge de France M18M.
            Le code de cette adaptation est disponible sur{' '}
            <a href="https://github.com/AEBaert/vb-stats-challenge">GitHub</a>.
          </p>
          <p>
            Enfin, les statistiques ci-dessous vous disent combien de fois TrueSkill™ a raison (
            <i style={{ color: green[6] }}>Favorite wins</i>), quand il se trompe et qu&apos;un favori est éliminé (
            <i style={{ color: red[5] }}>Favorite out</i>) ou que celui qu&apos;il estimait perdant sort vainqueur (
            <i style={{ color: gold[6] }}>Outsider wins</i>) ainsi que les matchs prédits (
            <i style={{ color: blue[5] }}>Predictions</i>) 😉
          </p>
          <h3>Références</h3>
          <div className="vb-reference">
            C. Stewart, M. Mazel, B. Sadler (2022).{' '}
            <a href="https://scholar.smu.edu/cgi/viewcontent.cgi?article=1227&context=datasciencereview">
              Application of Probabilistic Ranking Systems on Women&apos;s Junior Division Beach Volleyball.
              <i>SMU Data Science Review, Vol. 6, No. 2.</i>
            </a>
          </div>
          <div className="vb-reference">
            T. Minka, R. Cleven, Y. Zaykov (2018).{' '}
            <a href="https://www.microsoft.com/en-us/research/uploads/prod/2018/03/trueskill2.pdf">
              TrueSkill 2: An improved Bayesian skill rating system
            </a>
          </div>
          <div className="vb-reference">
            J. Moser (2010).{' '}
            <a href="https://www.moserware.com/2010/03/computing-your-skill.html">Computing Your skill.</a>
          </div>
        </div>
      </div>
      <div className="vb-info-charts-panel">
        <div className="vb-info-chart">
          <Progress
            type="dashboard"
            percent={(100 * stats.predicted) / pools.length}
            format={(percent) => (stats.total ? `${percent?.toFixed(0)}%` : NA)}
            size={chartSize}
            strokeColor={green[6]}
            strokeWidth={8}
          />
          <div>Favorite wins</div>
        </div>
        <div className="vb-info-chart">
          <Progress
            type="dashboard"
            percent={(100 * stats.outsiders) / pools.length}
            format={(percent) => (stats.total ? `${percent?.toFixed(0)}%` : NA)}
            size={chartSize}
            strokeColor={gold[6]}
            strokeWidth={8}
          />
          <div>Outsider wins</div>
        </div>
        <div className="vb-info-chart">
          <Progress
            type="dashboard"
            percent={(100 * stats.unpredicted) / pools.length}
            format={(percent) => (stats.total ? `${percent?.toFixed(0)}%` : NA)}
            size={chartSize}
            strokeColor={red[5]}
            strokeWidth={8}
          />
          <div>Favorite out</div>
        </div>
        <div className="vb-info-chart">
          <Progress
            type="dashboard"
            percent={(100 * stats.right) / stats.total}
            format={(percent) => (stats.total ? `${percent?.toFixed(0)}%` : NA)}
            size={chartSize}
            strokeColor={blue[5]}
            strokeWidth={8}
          />
          <div>Predictions</div>
        </div>
      </div>
    </div>
  );
};

export default Help;
