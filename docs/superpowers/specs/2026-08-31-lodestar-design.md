# Lodestar — Design Specification

**Date:** 2026-08-31
**Status:** Approved (design), pending implementation plan
**Repo:** https://github.com/AeternusArchon/lodestar (private)

---

## 1. Purpose

Lodestar helps one person — its owner — answer "what career should I pursue?" when
they have no working hypothesis to start from.

It is a static, offline, single-page web application. The user answers 72 questions
in roughly 12 minutes and receives a ranked shortlist of **the five best-fitting
industries** — six or seven when near-tie grouping (section 3.6) merges ranks — each
with a computed fit score, a plain-English explanation of which answers produced that
ranking, concrete job titles inside it, and a first concrete move to test the fit.

### Honest scope

No assessment instrument can determine what a person should be. O*NET's own Interest
Profiler manual states that interests are "one of many factors" in career success and
recommends pairing interest results with ability and work-values data. Congruence-to-
satisfaction effects in the Holland literature are real but modest, not strongly
predictive.

Lodestar therefore reports a **self-report snapshot**, not an aptitude measurement and
not a prediction of success or income. Its output is an evidence-backed shortlist to
investigate. The interface states this plainly at the top of the results, once, without
hedging the rest of the copy into uselessness.

Two consequences of that honesty are built into the engine rather than the copy, and
are specified in sections 3.6 and 3.7: **near-ties are surfaced, not silently broken**,
and **flat profiles are named as flat** rather than forced into false precision.

### Non-goals

- Not a product. No accounts, no signup, no multi-user support, no analytics.
- No server, no database, no API keys, no per-run cost.
- No occupation-level output. Someone with no direction cannot act on 900+ O*NET
  occupation codes; they can act on 22 industries.
- No AI-generated results narrative. Explanations are computed from the scoring math,
  so they are reproducible and cannot hallucinate a justification.

---

## 2. Architecture

Static SPA. Vite + React + Tailwind. Vitest for the engine. No runtime dependencies
beyond React.

```
lodestar/
  index.html
  package.json
  vite.config.js
  tailwind.config.js
  ATTRIBUTION.md                   O*NET CC BY 4.0 notice (see section 6)
  docs/superpowers/specs/          spec + implementation plan
  data-build/                      one-off derivation scripts, not shipped
    derive-industry-vectors.mjs
  src/
    main.jsx
    App.jsx                        stage machine: intro -> test -> results
    data/
      facets.js                    24 facet definitions, grouped by dimension
      questions.js                 72 items, each -> one facet, with direction
      industries.js                22 industry profiles, generated then hand-tuned
    engine/
      score.js                     answers -> facet scores (0-100)
      match.js                     facet scores -> ranked industry fits
      explain.js                   fit -> top contributing facets and their items
      profile.js                   flat-profile and near-tie detection
      weights.js                   dimension weighting (owner-authored)
    components/
      Intro.jsx
      Question.jsx
      InstrumentRail.jsx           progress + live constellation
      Constellation.jsx            the signature star plot
      Results.jsx
      ProfileReadout.jsx           all 24 facets as tracked-mono readouts
      IndustryCard.jsx
    styles/tokens.css              design tokens as CSS custom properties
  tests/
    score.test.js  match.test.js  explain.test.js  profile.test.js
```

### Boundaries

`src/engine/` is pure functions. It imports nothing from React, the DOM, or
`src/components/`. Every function takes data and returns data. This is what makes the
scoring independently testable, and the scoring is the one subsystem where a silent bug
yields a confident wrong answer rather than a visible crash.

`src/data/` is inert. No logic, no imports from engine or components.

`src/components/` may import from `engine/` and `data/`. Nothing imports from
`components/` except `App.jsx`.

`data-build/` runs once at authoring time to derive industry vectors from the O*NET
bulk database. It is never imported by the app and never runs in the browser.

### State and persistence

All state lives in `App.jsx` and is passed down. In-progress answers and the last
completed result are written to `localStorage` under a versioned key
(`lodestar.v1.session`) so a refresh does not lose 12 minutes of work. Every read is
wrapped in try/catch and the app renders correctly when storage is unavailable or
empty. No other persistence.

---

## 3. The instrument

### 3.1 Four dimensions, 24 facets

| Dimension | Facets | Items | Items/facet |
|---|---|---|---|
| Interests (RIASEC) | realistic, investigative, artistic, social, enterprising, conventional | 30 | 5 |
| Values | autonomy, impact, income, stability, mastery, recognition | 18 | 3 |
| Aptitudes (self-rated) | analytical, verbal, spatial, interpersonal, organizational, creative | 12 | 2 |
| Context | peopleFacing, structurePref, pace, physicality, riskTolerance, scheduleFlex | 12 | 2 |
| **Total** | **24 facets** | **72** | |

Five items per RIASEC scale matches the O*NET **Mini-IP** (30 items, 5/scale), the
current mobile-optimized official short form. The O*NET Short Form uses 10/scale over
60 items; at 30 items for interests alone we would have no budget left for the other
three dimensions inside a 12-minute session. Five per scale is a documented, defensible
floor rather than an arbitrary one.

Aptitudes carry the fewest items because they are self-rated and therefore the least
reliable construct here — they inform the ranking but must not dominate it.

The Values dimension deliberately uses **independent Likert items, not O*NET's ipsative
card sort.** The O*NET Work Importance Locator forces exactly four cards into each of
five columns, which produces genuine trade-off data but cannot be mixed with Likert
scales on a shared vector without distorting the geometry — ipsative scores are
constrained to a constant sum and are not comparable across dimensions. The cost is
that a user may rate every value "very important"; section 3.6's mean-centering and
flat-profile detection absorb that.

### 3.2 Item format

Every item is a single statement answered on a 5-point agreement scale. Each item maps
to exactly one facet and carries a direction of `+1` or `-1`.

```js
{ id: 'INV-03', facet: 'investigative', dir: 1,
  text: 'I enjoy figuring out why something broke, even when nobody asked me to.' }
```

At least one item per facet is reverse-keyed (`dir: -1`) to interrupt straight-lining.

### 3.3 Scoring

1. Raw response `r` is 1..5. Signed response `s = dir === 1 ? r : 6 - r`.
2. Facet raw = mean of its items' signed responses, in [1, 5].
3. Facet score = `(raw - 1) / 4 * 100`, in [0, 100].
4. User profile = a 24-dimensional vector of facet scores.

### 3.4 Matching

Each of the 22 industries carries a target vector over the same 24 facets on the same
0-100 scale.

Fit is **weighted cosine similarity** between the user vector and the industry vector,
where the weight applied to each facet comes from its dimension's weight in
`weights.js`.

```
fit(u, t) = Σ wᵢ·ûᵢ·t̂ᵢ  /  sqrt(Σ wᵢ·ûᵢ²) · sqrt(Σ wᵢ·t̂ᵢ²)
```

Both vectors are mean-centered *within each dimension* (`û`, `t̂`) before comparison.

Cosine over Euclidean distance is deliberate. Cosine compares the *shape* of a profile,
not its magnitude. A user who rates everything 4-5 and one who rates everything 2-3
receive the same ranking when their relative peaks match — which is correct, because
response style is not career-relevant information. Mean-centering within each dimension
extends the same protection to a user who is uniformly enthusiastic about, say, all six
values.

Reported fit is the cosine mapped from [-1, 1] to [0, 100].

### 3.5 Explanation

Explanations are computed, never generated.

The contribution of facet `i` to a given industry is `wᵢ·ûᵢ·t̂ᵢ` — the term that facet
contributes to the fit numerator. Facets are ranked by contribution; the top three are
the explanation.

For each, `explain.js` returns the facet, its score, the industry's target, and the two
items the user answered most strongly on that facet. The UI renders this through fixed
templates, so identical answers always produce identical words.

A fourth line reports the strongest *negative* contributor when one exists, so results
are honest about what does not fit rather than only flattering.

### 3.6 Flat profiles and near-ties

O*NET publishes no canonical algorithmic tie-break. Its Interest Profiler explicitly
defines a **"flat profile"** state and offers one-interest-at-a-time exploration instead
of forcing a three-letter code; the Work Importance Locator instructs that values within
5 points be resolved by the person, not the instrument. Lodestar follows that precedent
rather than inventing false precision.

`profile.js` implements two checks:

- **Flat dimension.** If a dimension's facet range (max − min) is under 15 points, that
  dimension is flat. The results name it — "your interests came out unusually even, so
  the ranking below leans on your values and context instead" — and the UI de-emphasizes
  that dimension's contribution in the explanations.
- **Near-tie.** Industries whose fit scores fall within 3 points of each other **on the
  reported 0-100 scale** are presented as a tied group at a shared rank, not as an
  ordered 1 and 2. The copy says they are tied and invites the user to choose which to
  investigate first. Grouping is applied after ranking and before truncation to five, so
  a tie spanning the cutoff shows all its members rather than severing the group.

If *every* dimension is flat, the app says so and declines to rank, offering the facet
readout and an explore-one-at-a-time path instead. A result that says "this instrument
did not find a signal in your answers" is more useful than a confident ranking built on
noise.

### 3.7 The 22 industries

Chosen to be recognizable to someone with no career vocabulary while covering all 20
top-level NAICS sectors. Cross-checked against the 16 Career Clusters framework and
Advance CTE's 2024 14-cluster revision.

| # | Industry | # | Industry |
|---|---|---|---|
| 1 | Healthcare & Medicine | 12 | Public Safety & Protective Services |
| 2 | Education & Teaching | 13 | Social Services & Counseling |
| 3 | Technology & Software | 14 | Construction & Skilled Trades |
| 4 | Engineering | 15 | Manufacturing & Production |
| 5 | Science & Research | 16 | Agriculture & Natural Resources |
| 6 | Finance, Banking & Insurance | 17 | Energy, Utilities & Environment |
| 7 | Business, Consulting & Administration | 18 | Transportation, Logistics & Supply Chain |
| 8 | Marketing, Advertising & Media | 19 | Retail & Sales |
| 9 | Arts, Design & Entertainment | 20 | Hospitality, Travel & Food Service |
| 10 | Law & Legal Services | 21 | Real Estate & Property |
| 11 | Government & Public Administration | 22 | Personal Services & Wellness |

Each entry carries: a 24-facet target vector, a one-sentence description, three
representative job titles spanning entry to senior, and one **first move** — a concrete,
low-cost action that tests the fit within two weeks (a specific certification, a
shadowing ask, a small project, a conversation to have).

**Entrepreneurship is deliberately absent as a 23rd industry.** Running your own thing
is a *mode of working* available inside all 22, not a sector. It is surfaced instead as
a cross-cutting note triggered by high `autonomy`, high `riskTolerance`, and high
`enterprising` scores: "in any of these, the self-employed path fits your profile."

### 3.8 Deriving the industry vectors

The 16 RIASEC and Work Values facets are **derived, not invented.** `data-build/derive-industry-vectors.mjs` runs once against the O*NET bulk database:

1. Map each industry to its representative SOC occupation codes via the BLS
   Industry-Occupation Matrix. O*NET is occupation-centric and carries no native
   SOC-to-NAICS industry mapping, so this join is external and must be recorded.
2. For each industry, aggregate the O*NET `Interests` (six RIASEC scores) and
   `Work Values` (six TWA dimensions) rows across its occupations, weighted by
   employment.
3. Rescale to 0-100 and map O*NET's six work values onto Lodestar's six:
   Achievement→mastery, Independence→autonomy, Recognition→recognition,
   Relationships→impact, Support→stability, Working Conditions→income.

The remaining 12 facets (aptitudes, context) have no O*NET equivalent and are
hand-authored, then reviewed against the derived 12 for internal consistency.

The mapping in step 3 is an interpretation, not an identity — O*NET's "Relationships"
covers coworker relations and service to others, which is narrower than Lodestar's
"impact." Each mapping decision is recorded as a comment in the derivation script so a
future reader can disagree with it specifically.

### 3.9 Dimension weighting — owner-authored

`src/engine/weights.js` exports the relative weight of the four dimensions. This is a
genuine judgment call with real consequences for what the app recommends, and it belongs
to the owner rather than the implementer.

The file is scaffolded with the signature, the constraint (weights sum to 1), and the
trade-offs as comments; the body is left for the owner to author. Roughly six lines.

The trade-off, for the record: equal weighting is defensible and safe. **Weighting
Values above Interests is the position worth considering** — people rarely leave jobs
because the subject matter stopped being interesting; they leave because the autonomy,
stability, or income did not match what they needed. **Weighting Aptitudes highly is the
position to avoid**, because those scores are self-reported, and a person with no career
direction is precisely the person least able to rate their own aptitudes against a
professional baseline.

Until it is authored the engine will not run. This is intentional. The tests assert the
constraint, never a particular choice.

---

## 4. Interface

### 4.1 Direction

The emotional truth of this subject is uncertainty, not celebration. The design reads as
a navigation instrument, not a personality quiz. Restraint everywhere except the
constellation.

### 4.2 Tokens

| Token | Value | Role |
|---|---|---|
| `--ink` | `#131A2B` | ground |
| `--bone` | `#F2EFE6` | primary type |
| `--brass` | `#E8B84B` | the lodestar accent; the single warm point |
| `--slate` | `#5B8C9E` | data, secondary marks |
| `--haze` | `#8A93A8` | labels, de-emphasized type |
| `--rust` | `#C1543A` | low end of scales and negative contributors only |

Type: **Bricolage Grotesque** display (variable width and weight, tight tracking) ·
**Source Serif 4** body · **IBM Plex Mono** for instrument readouts and facet labels in
tracked caps. All three from Google Fonts, each with a real fallback stack.

### 4.3 Layout

- **Intro** — what this is, how long it takes, and the honest-scope statement.
- **Test** — one item per viewport, no scrolling mid-test. A fixed instrument rail holds
  the item counter and the live constellation. Keyboard: `1`–`5` answer, arrows navigate.
- **Results** — constellation full-bleed at the top, the honest-scope note, any flat-
  profile or near-tie notice, then the ranked industry cards, then the 24-facet readout.

### 4.4 Signature element — the constellation

The 24-facet profile renders as a star plot: 24 rays from a center, one per facet,
grouped into four arcs by dimension, each ray's point set at that facet's score. Points
join into a closed figure; unanswered facets sit at the origin.

It draws itself as the user answers, live in the rail, so the shape of the person
emerges progressively across the twelve minutes. At results it goes full-bleed with the
four dimension arcs labeled in tracked mono.

It earns its place twice over: it is the lodestar metaphor made literal, and it is
functional — progress indicator and self-recognition in one object. It is the only
element permitted to be elaborate.

### 4.5 Quality floor

Responsive to 375px. Visible keyboard focus on every interactive element. Full keyboard
operation of the test. `prefers-reduced-motion` honored — the constellation snaps rather
than animates. Radio groups are real fieldsets with legends. Color never carries meaning
alone; the rust and brass ends of every scale are also labeled.

---

## 5. Testing

Vitest against `src/engine/`, which is pure and therefore fully testable.

- **score.js** — direction reversal produces the mirrored score; an all-3 response set
  yields 50 on every facet; boundary responses yield exactly 0 and 100; incomplete
  answer sets are rejected rather than scored as zeros.
- **match.js** — a user vector identical to a target ranks that industry first;
  response-style invariance (a uniformly shifted user vector leaves the ranking
  unchanged); weights that do not sum to 1 are rejected.
- **explain.js** — returned contributors are genuinely the largest terms in the fit
  numerator; every returned facet resolves to real items the user answered.
- **profile.js** — a synthetic flat profile is detected as flat; fits within 3 points
  group into one rank; an all-flat profile declines to rank.

The ranking is not asserted against expected career outcomes. That would be asserting
the validity of the instrument, which no unit test can establish.

---

## 6. Attribution and licensing

Industry vectors are derived from the **O*NET bulk database**, released under
**CC BY 4.0**, which explicitly permits redistribution of raw and derived data with
attribution. `ATTRIBUTION.md` and a results-page footer carry:

> This product includes information from the O*NET Database by the U.S. Department of
> Labor, Employment and Training Administration. Used under the CC BY 4.0 license.
> O*NET® is a trademark of USDOL/ETA. Lodestar has modified this information; O*NET has
> not approved, endorsed, or tested these modifications.

The bulk database is used, **not the O*NET Web Services API** — the API operates under a
separate, non-transferable license that does not grant redistribution rights to an app's
users. The BLS Industry-Occupation Matrix used for the SOC-to-industry join is US
Government public domain.

---

## 7. Implementation roles

| Role | Model | Scope |
|---|---|---|
| Research Analyst | Sonnet | RIASEC/O*NET grounding, industry taxonomy — **complete** |
| Assessment Architect | Opus | The 72 items and 24 facet definitions; calibration |
| Scoring Engineer | Opus | `score.js`, `match.js`, `explain.js`, `profile.js` + tests |
| Industry Curator | Sonnet | Derivation script, 22 profiles, titles, first moves |
| UI Implementation | Sonnet | Components against the tokens in section 4 |
| Copy & Voice | Fable | Item wording, results copy, explanation templates |
| Adversarial Reviewer | Opus | Scoring math and accessibility, skeptical pass |

Opus is assigned where a silent error produces confident wrong output. Sonnet is
assigned high-volume work against an already-decided specification. Fable is assigned
the writing, because 72 items that read naturally and do not lead the respondent is a
craft problem rather than a reasoning one.

---

## 8. Deployment

Out of scope for the first implementation. The app is a static build; when wanted,
`wrangler pages deploy dist` publishes it, matching existing tooling on this machine.

---

## Sources

- O*NET Interest Profiler Manual — https://www.onetcenter.org/dl_files/IP_Manual.pdf
- O*NET IP Short Form psychometrics — https://www.onetcenter.org/dl_files/IPSF_Psychometric.pdf
- O*NET Work Importance Locator User's Guide — https://www.onetcenter.org/dl_files/WIL_zips/WIL-UG-deskp.pdf
- O*NET Database and CC BY 4.0 license — https://www.onetcenter.org/database.html · https://www.onetcenter.org/license_db.html
- O*NET Web Services license — https://services.onetcenter.org/help/license
- Advance CTE National Career Clusters Framework — https://careertech.org/what-we-do/initiatives/national-career-clusters-framework/
- Census NAICS guidance — https://www.census.gov/programs-surveys/economic-census/year/2022/guidance/understanding-naics.html
