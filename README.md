# Lodestar

Lodestar is a static, offline career-fit assessment. A person answers 72
self-report items, those score into a 24-facet profile, and the profile is
matched against 22 industry vectors by dimension-weighted cosine similarity
to produce a ranked shortlist.

## Honest scope

No assessment can determine what someone should be. Lodestar reports a
self-report snapshot, not an aptitude measurement and not a prediction of
success or income — the output is a shortlist to investigate, not a verdict.
The results screen says this plainly, once, at the top, without hedging the
rest of the copy into uselessness. Near-ties are surfaced rather than
silently broken, and a flat profile is named as flat rather than forced into
false precision. See the spec's "Honest scope" section (linked below) for the
full reasoning.

## Running it

```bash
npm install
npm run dev
```

Run the test suite:

```bash
npm test
```

Build for production:

```bash
npm run build
```

`dist/` is a static bundle — no server, no database, no API keys, and it can
be hosted anywhere that serves static files.

## Regenerating the industry vectors

`src/data/industry-vectors.json` is checked in, so the app builds without
needing the O*NET source data. To regenerate it — for example after editing
`data-build/soc-by-industry.json` — see `data-build/README.md`. In short: the
13 MB O*NET 30.3 bulk database is not checked in (it isn't ours to
redistribute in raw form), so you fetch it once locally, then run
`node data-build/derive-industry-vectors.mjs`.

## Changing the dimension weighting

`src/engine/weights.js` is the one knob worth revisiting. It controls how
much each of the four dimensions — values, interests, context, aptitudes —
counts toward the final industry ranking, and ships at:

- values: 0.35
- interests: 0.30
- context: 0.20
- aptitudes: 0.15

The file carries the full reasoning for these defaults as comments. Change
them freely; the only hard rule is that the four weights sum to 1.0. The
tests assert only that constraint, never a particular choice of weights, so
changing the values will not break the suite.

## Attribution

Industry vectors are derived in part from the O*NET 30.3 database. See
[`ATTRIBUTION.md`](./ATTRIBUTION.md) for the full notice and for what is
derived from O*NET versus authored by Lodestar.

## Spec

The full design specification is at
[`docs/superpowers/specs/2026-08-31-lodestar-design.md`](./docs/superpowers/specs/2026-08-31-lodestar-design.md).
