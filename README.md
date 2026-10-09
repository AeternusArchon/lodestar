# Lodestar

**Live:** https://aeternusarchon.github.io/lodestar/

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
be hosted anywhere that serves static files. Every push to `main` runs the
suite and, if it passes, publishes `dist/` to GitHub Pages
(`.github/workflows/pages.yml`).

## What the results screen does beyond ranking

- **Response-quality check.** Straight-lining, contradictory answers on
  reverse-keyed pairs, and a median under two seconds per statement each
  raise a flag. The ranking is still shown, under a "treat this run as a
  draft" banner. See `src/engine/quality.js` for the thresholds.
- **Precision per facet.** Interests rest on five statements, values on three,
  aptitudes and context on two. The readout labels each, and marks two-item
  facets with `~` so a 48 and a 52 are not read as different.
- **Comparison with your previous run.** Completed runs are kept in
  `localStorage` (`lodestar.v1.runs`, last ten). The next run shows which
  facets held within ten points and which moved.
- **What would change this.** For the three industries just under the
  shortlist, the single facet that, shifted fifteen points, would help each
  most, and whether that would have been enough.
- **Occupations inside each field.** Each card lists the O*NET occupations
  its numbers are averaged from. With per-occupation vectors generated (see
  below), they are ranked against the profile on the seventeen measured
  facets.
- **Provenance drawer.** Every card can show where each of its 24 numbers
  came from: the O*NET element for the seventeen derived facets, the question
  the author answered for the seven authored ones, and how many raters.
- **Export.** Copy the results as Markdown, or print to paper or PDF with an
  ink-on-bone print stylesheet.
- **Compare two fields.** Pick any two shortlisted industries and see, facet
  by facet, which one each facet favours for you.
- **How others see you.** Make a link, send it to someone who knows you; they
  answer the same 72 statements as they believe you would, and send a link
  back. The results page shows where their view and yours part ways. No
  server: the answers travel in the URL.
- **Retake reminder.** One button adds a calendar event three weeks out.

## Answering well

A "How to answer" screen runs before the first statement, and every statement
has a "What does this mean?" note with a plain rewording and an everyday
example. The notes never name the trait a statement measures — the items are
written so nobody answers the label instead of the sentence, and a note that
said "this is about risk" would undo that.

## Español

The whole instrument is available in Spanish: the 72 statements, their notes,
the 24 facets, the 22 industries, and every screen. Switch with the toggle on
the intro or results page; the choice is remembered. The O*NET licence notice
stays in English, as the licence requires. Translations live in
`src/i18n/es.js`; `tests/i18n.test.js` asserts the Spanish file covers every
English key and every data record.

## Regenerating the industry vectors

`src/data/industry-vectors.json` is checked in, so the app builds without
needing the O*NET source data. To regenerate it — for example after editing
`data-build/soc-by-industry.json` — see `data-build/README.md`. In short: the
13 MB O*NET 30.3 bulk database is not checked in (it isn't ours to
redistribute in raw form), so you fetch it once locally, then run
`node data-build/derive-industry-vectors.mjs`.

## Ranking occupations inside an industry

`src/data/occupations.json` ships as a roster only. To rank occupations
against a profile, fetch the O*NET release as above, then:

```bash
node data-build/derive-occupation-vectors.mjs
```

The cards switch from a plain list to a ranked one automatically.

## Adding a second rater for the authored Values

The six Values facets per industry are one person's editorial estimate. A
second person can rate them blind against `data-build/values-rubric.md` and
write their numbers into `src/data/authored-values-rater2.json`. Each number
then becomes the mean of the two raters, and the provenance drawer reports
how far apart they were.

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
