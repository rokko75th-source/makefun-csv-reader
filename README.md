# makefun-csv-reader

Entry for make.fun bounty "Read broken CSV files faster, 21 November 2026":
a faster drop-in replacement for csv-reader 1.0.0 that returns identical
answers ({columns, rows, errors}) on every case, ranked by CPU time.

- `solve.js` — dependency-free ES module exporting `run(input)`
- `main.ts` — harness entry point (Node 22, reads /input/cases.json, writes /output/answers.json)
