import { type ChangeEventHandler, useMemo } from 'react';

import { CalendarOutlined, EnvironmentOutlined, HomeOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Progress, Row, Space, Tag, Typography } from 'antd';
import Search from 'antd/es/input/Search';
import cx from 'classnames';

import { type Competition, type Pool, type Team } from '@/model/model';
import { filterTeam, getPoolProbabilities, poolId2Name } from '@/model/model-helpers';

import './CompetitionDraw.scss';

interface Props {
  competition: Competition;
  day: number;
  tokens: string[];
  setTokens: (tokens: string[]) => void;
  className?: string | string[];
}

const formatDate = (value: string): string => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

const formatTime = (value: string): string => (value && value !== '00:00' ? value.slice(0, 5) : 'à suivre');

const previousPlaceLabel = (team: Team, day: number): string | null => {
  const place = team.ranking.pools[day - 1];
  if (!place) return null;
  return place === 1 ? '1er au tour précédent' : `${place}e au tour précédent`;
};

const DrawPool = ({ pool, day }: { pool: Pool; day: number }) => {
  const [probabilities] = getPoolProbabilities(pool, day);
  const firstMatch = pool.matchs[0];
  const host = pool.teams[0];

  return (
    <Card
      className="vb-draw-card"
      title={
        <div className="vb-draw-card-title">
          <span>Poule {poolId2Name(pool.name)}</span>
          <Space size={4} wrap>
            {firstMatch?.date ? <Tag icon={<CalendarOutlined />}>{formatDate(firstMatch.date)}</Tag> : null}
            {firstMatch?.venue ? <Tag icon={<EnvironmentOutlined />}>{firstMatch.venue}</Tag> : null}
          </Space>
        </div>
      }
    >
      <div className="vb-draw-teams">
        {pool.teams.map((team, index) => {
          const previousPlace = previousPlaceLabel(team, day);
          const probability = Math.round(100 * probabilities[index]);

          return (
            <div className="vb-draw-team" key={team.id}>
              <div className="vb-draw-team-header">
                <Typography.Text strong={team === host}>{team.name}</Typography.Text>
                <Space size={4} wrap>
                  {team === host ? <Tag icon={<HomeOutlined />}>receveur</Tag> : null}
                  {previousPlace ? <Tag>{previousPlace}</Tag> : null}
                </Space>
              </div>
              <div className="vb-draw-probability">
                <Typography.Text type="secondary">chance de finir 1er</Typography.Text>
                <Progress percent={probability} size="small" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="vb-draw-matches">
        {pool.matchs.map((match) => (
          <div className="vb-draw-match" key={match.id}>
            <span className="vb-draw-time">{formatTime(match.time)}</span>
            <span>{match.teamA.name}</span>
            <span className="vb-draw-separator">–</span>
            <span>{match.teamB.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

const CompetitionDraw = ({ competition, day, tokens, setTokens, className }: Props) => {
  const cday = competition.days[day];

  const handleSearch: ChangeEventHandler<HTMLInputElement> = (event) => {
    setTokens(
      event.target.value
        .toLocaleLowerCase()
        .split(' ')
        .filter((token) => token),
    );
  };

  const pools = useMemo(() => {
    if (!cday) return [];
    return Array.from(cday.pools.values()).filter((pool) => pool.teams.some((team) => filterTeam(team, tokens)));
  }, [cday, tokens]);

  if (!cday || cday.pools.size === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const allPools = Array.from(cday.pools.values());
  const firstMatch = allPools[0]?.matchs[0];
  const teamCount = new Set(allPools.flatMap((pool) => pool.teams.map((team) => team.id))).size;

  return (
    <div className={cx('vb-draw', className)}>
      <Card className="vb-draw-summary">
        <div>
          <Typography.Title level={3}>
            Tirage du {firstMatch?.date ? formatDate(firstMatch.date) : `tour J${day}`}
          </Typography.Title>
          <Typography.Text type="secondary">
            Challenge de France M18 masculin · {allPools.length} poules · {teamCount} équipes
          </Typography.Text>
        </div>
        <Search
          defaultValue={tokens.join(' ')}
          placeholder="Filtrer une équipe..."
          allowClear
          onChange={handleSearch}
        />
      </Card>

      <Row gutter={[16, 16]}>
        {pools.map((pool) => (
          <Col xs={24} lg={12} xxl={8} key={pool.name}>
            <DrawPool pool={pool} day={day} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default CompetitionDraw;
