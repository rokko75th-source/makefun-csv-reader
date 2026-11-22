[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/rokko75th-source/makefun-csv-reader/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/rokko75th-source/makefun-csv-reader/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

# makefun-csv-reader

Entry for the make.fun bounty [Read broken CSV files faster, 21 November 2026](https://make.fun/bounty/csv-reader-speed-01-run-20261121):
a faster drop-in replacement for csv-reader 1.0.0 that returns identical
answers ({columns, rows, errors}) on every case, ranked by CPU time.

- `solve.js` — dependency-free ES module exporting `run(input)`
- `main.ts` — harness entry point (Node 22, reads /input/cases.json, writes /output/answers.json)

Run: `node main.ts` with the harness (reads /input/cases.json, writes /output/answers.json).
