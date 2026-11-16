# Rating methodology

This document records how the rating and prediction logic works in the original
`gillesdandrea/vb-stats` implementation and distinguishes that baseline from
fork-specific changes.

## References cited by the original site

The original application cites the following references in its Help panel:

1. C. Stewart, M. Mazel, B. Sadler (2022),
   *Application of Probabilistic Ranking Systems on Women's Junior Division Beach Volleyball*,
   SMU Data Science Review, Vol. 6, No. 2.
   https://scholar.smu.edu/cgi/viewcontent.cgi?article=1227&context=datasciencereview

2. T. Minka, R. Cleven, Y. Zaykov (2018),
   *TrueSkill 2: An improved Bayesian skill rating system*.
   https://www.microsoft.com/en-us/research/uploads/prod/2018/03/trueskill2.pdf

3. J. Moser (2010), *Computing Your skill*.
   https://www.moserware.com/2010/03/computing-your-skill.html

These references motivate the probabilistic rating approach. The implementation
details below are taken from the code of `gillesdandrea/vb-stats`; this document
does not assume that every implementation choice is prescribed by the papers.

## Original vb-stats rating implementation

The original site uses `ts-trueskill`:

```ts
const ts = new TrueSkill(undefined, undefined, undefined, undefined, 0);
```

The first four parameters therefore use the library defaults; the draw
probability is explicitly set to 0.

Each new team starts with a neutral rating:

```ts
const rating = new Rating();
```

### Match updating

The project currently has:

```ts
export const SET_RANKING = true;
```

With that option enabled, the rating is updated set by set, not only once per
match. For each set, the winning side and losing side are passed to TrueSkill.

A tight set (score difference <= 2) is weighted with:

```ts
const TIGHT_FACTOR = 4 / 5;
```

and the TrueSkill update is called with:

```ts
const MIN_DELTA = 0.0001;
```

These constants and this set-by-set update are part of the original
implementation and should not be changed casually.

### Win probabilities

For days after the first day, match win probability is computed directly from
the previous rating state with `ts-trueskill`'s `winProbability`.

In the original application, day 1 deliberately has no prior-information
prediction:

- a match is treated as 50% / 50%;
- a three-team pool is treated as 1/3 / 1/3 / 1/3.

From day 2 onward, probabilities are based on the ratings produced by earlier
results in the same competition.

### Pool-first probability

For a three-team pool, the original application estimates each team's chance
of finishing first by multiplying its two pairwise win probabilities, then
normalising the three resulting values so that they sum to 1.

This is the behaviour implemented in `getPoolProbabilities()`; it is an
application-specific construction built on top of TrueSkill win probabilities.

## Rankings versus ratings

The displayed competition ranking is not simply a TrueSkill ranking.

The points-based sorter uses, in order:

1. competition points,
2. set ratio,
3. point ratio,
4. TrueSkill rating only as the final tie-breaker.

So changing the rating can alter predictions and can also alter the order of
teams that remain tied after the preceding sporting criteria.

## Fork-specific Challenge handling

The Challenge support is an extension of the original project. The TrueSkill
update rules themselves are unchanged, but the fork makes one explicit modelling
choice about the **history supplied to TrueSkill**.

### Continuous seasonal rating across Coupe and Challenge

For M18M 2026/2027, teams enter the Challenge through two paths:

```text
T1 Coupe ──> T1 Challenge ──> T2 Challenge ──> T3 Challenge ──> ...
      \
       └──> T2 Coupe ───────> T2 Challenge ──> T3 Challenge ──> ...
```

There are no new Coupe-to-Challenge entrants after T2 Challenge.

The fork therefore treats the TrueSkill rating as an estimate of the underlying
strength of the **same M18M team during the same season**, rather than as a score
owned by one competition only.

Consequently:

- a team entering Challenge at T1 starts from its TrueSkill state after T1 Coupe;
- a team entering Challenge at T2 starts from its TrueSkill state after T2 Coupe;
- a team that entered Challenge at T1 and qualified for T2 reaches T2 with its
  T1 Coupe history followed by its T1 Challenge results;
- from T3 Challenge onward, no new teams enter from Coupe, so all remaining
  ratings evolve only from Challenge results.

No additional coefficient is introduced for "Coupe" versus "Challenge". The
same original vb-stats TrueSkill update is used for every set.

This is a **fork-specific modelling assumption**. It is consistent with using a
Bayesian skill state continuously for the same team, but it is not a claim made
specifically by Stewart et al. for the French Coupe/Challenge format.

### What remains competition-specific

Only the rating history is continuous. Sporting statistics remain separate:

- Challenge points and standings use Challenge matches only;
- Challenge wins/losses, sets and scored/conceded points use Challenge matches only;
- Coupe standings and Challenge standings are never merged.

The purpose of the inherited Coupe rating is only to avoid treating an incoming
team as completely unknown when prior same-season M18M results already exist.

Any future change to this modelling assumption or to the original TrueSkill
update parameters must be documented here before being merged.
