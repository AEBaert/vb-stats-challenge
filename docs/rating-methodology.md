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

The Challenge support is an extension of the original project and must be kept
conceptually separate from the original rating method.

A previous fork change seeded Challenge teams with ratings obtained from Coupe
de France results. That changes the initial TrueSkill state and therefore
changes the complete subsequent rating trajectory. This is **not** the original
vb-stats methodology.

The desired design is:

- keep the Challenge TrueSkill evolution identical to the original vb-stats
  model, starting from neutral ratings;
- if a pre-Challenge prediction is displayed for Challenge J1, treat any Coupe
  information as an explicitly separate pre-Challenge predictor and do not
  inject it into the Challenge rating state.

Any future change to the rating model should be documented here before being
merged.
