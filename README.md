# vb-stats — Volleyball Stats

A React + TypeScript + Vite PWA that explores French youth volleyball (FFVB) competition statistics:
pool standings, TrueSkill ratings, win probabilities, and team relationship graphs.

This fork adds support for the **Challenge de France M18 masculin** while keeping the Coupe de France available.

Original project: [gillesdandrea/vb-stats](https://github.com/gillesdandrea/vb-stats)

Challenge fork: [AEBaert/vb-stats-challenge](https://github.com/AEBaert/vb-stats-challenge)

## Getting started

```shell
pnpm install
pnpm dev
```

Competition data lives as CSV files in `public/data/` and is parsed in the browser, so no backend is
needed.

## Common commands

| Command                       | What it does                                  |
| ----------------------------- | --------------------------------------------- |
| `pnpm dev`                    | Vite dev server                               |
| `pnpm build`                  | TypeScript check + production build           |
| `pnpm lint` / `pnpm lint:fix` | Prettier, ESLint and Stylelint                |
| `pnpm deploy`                 | Publish `dist/` to GitHub Pages               |
| `pnpm cdf-scrap`              | Scrape fresh FFVB results into `public/data/` |
| `pnpm cdf-update`             | Scrape → build → deploy                       |

## Documentation

- [AGENTS.md](AGENTS.md) — architecture, code organization and conventions
- [README-SHEETS.md](README-SHEETS.md) — match sheet (player statistics) workflow
- [docs/](docs/) — technical documentation
- [docs/rating-methodology.md](docs/rating-methodology.md) — original vb-stats TrueSkill methodology and fork deviations


## Credits

Based on `vb-stats` by Gilles d'Andrea, distributed under the MIT License. FFVolley remains the source of competition results.
