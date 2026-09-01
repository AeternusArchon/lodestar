import { describe, it, expect } from 'vitest'
import { explainMatch } from '../src/engine/explain.js'
import { matchIndustries } from '../src/engine/match.js'
import { scoreAnswers } from '../src/engine/score.js'
import { QUESTIONS } from '../src/data/questions.js'
import { facetsByDimension } from '../src/data/facets.js'
import { INDUSTRIES } from '../src/data/industries.js'

const answers = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, (i % 5) + 1]))
const profile = scoreAnswers(answers)
const [top] = matchIndustries(profile)

describe('explainMatch', () => {
  it('returns the three largest positive contributors', () => {
    const { positives } = explainMatch(top, profile, answers)
    expect(positives).toHaveLength(3)
    // Top three of the strictly positive contributions, not top three overall:
    // these render under "Why this fits", so a facet that pulled the fit down
    // is never eligible however highly it ranks among the leftovers.
    const all = Object.entries(top.contributions)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
    expect(positives.map(p => p.facet)).toEqual(all.slice(0, 3).map(([k]) => k))
  })

  it('resolves every reason to real items the user answered', () => {
    const { positives } = explainMatch(top, profile, answers)
    for (const reason of positives) {
      expect(reason.items.length).toBeGreaterThan(0)
      for (const item of reason.items) {
        expect(QUESTIONS.find(q => q.id === item.id).facet).toBe(reason.facet)
        expect(item.response).toBe(answers[item.id])
      }
    }
  })

  it('reports the strongest negative contributor', () => {
    const { negative } = explainMatch(top, profile, answers)
    const min = Math.min(...Object.values(top.contributions))
    if (min < 0) expect(negative.contribution).toBeCloseTo(min, 10)
    else expect(negative).toBeNull()
  })

  it('excludes facets from flat dimensions', () => {
    const { positives } = explainMatch(top, profile, answers, { flat: ['interests'] })
    const interestKeys = facetsByDimension('interests').map(f => f.key)
    for (const p of positives) expect(interestKeys).not.toContain(p.facet)
  })

  // The flag is read off the industry's own authoredFacets, not recomputed
  // from the Values dimension: scheduleFlex is a Context facet that O*NET
  // cannot measure on a usable scale and industries.js authors by hand, so a
  // dimension-derived flag would present an editorial estimate as measured
  // data. Assert against the industry's own list, so this test tracks the
  // provenance rather than restating a hard-coded guess about it.
  it('marks authored facets so the UI can label them', () => {
    const industry = INDUSTRIES.find(i => i.key === top.key)
    const { positives, negative } = explainMatch(top, profile, answers)
    for (const p of [...positives, negative].filter(Boolean)) {
      expect(p.authored, p.facet).toBe(industry.authoredFacets.includes(p.facet))
    }
  })

  // Spec §3.8 correction 4: scheduleFlex is a CONTEXT facet with no usable
  // O*NET source, authored by hand in industries.js. Any reason built on it
  // must carry the editorial-estimate flag, exactly as a Values reason does —
  // which is only true because explain.js reads authoredFacets rather than
  // recomputing the set from the Values dimension.
  //
  // The shared `answers` fixture is no use here: it happens to score
  // scheduleFlex at almost exactly the respondent's own context-dimension
  // mean, so the centred value is ~0 and the facet contributes nothing to any
  // of the 22 industries. This fixture instead pins schedule freedom to the
  // top of the scale and every other context facet to the bottom, which
  // guarantees scheduleFlex is the dominant context contributor somewhere.
  it('treats scheduleFlex as authored, not as derived data', () => {
    const wantsFreedom = { ...answers, 'SCH-01': 5, 'SCH-02': 1 }
    for (const id of ['PPL-01', 'STR-01', 'PAC-01', 'PHY-01', 'RSK-01']) wantsFreedom[id] = 1
    for (const id of ['PPL-02', 'STR-02', 'PAC-02', 'PHY-02', 'RSK-02']) wantsFreedom[id] = 5

    const p = scoreAnswers(wantsFreedom)
    expect(p.scheduleFlex).toBe(100)

    const valueKeys = facetsByDimension('values').map(f => f.key)
    expect(valueKeys, 'scheduleFlex is a Context facet, not a Values one')
      .not.toContain('scheduleFlex')

    let seen = 0
    for (const match of matchIndustries(p)) {
      const { positives, negative } = explainMatch(match, p, wantsFreedom,
        { flat: ['interests', 'values', 'aptitudes'] })
      for (const reason of [...positives, negative].filter(Boolean)) {
        if (reason.facet !== 'scheduleFlex') continue
        seen++
        expect(reason.authored, match.key).toBe(true)
      }
    }
    // Without this the loop above could pass vacuously.
    expect(seen).toBeGreaterThan(0)
  })

  it('never reports a negative contribution as a reason this fits', () => {
    for (const match of matchIndustries(profile)) {
      const { positives } = explainMatch(match, profile, answers)
      for (const p of positives) expect(p.contribution, `${match.key}/${p.facet}`).toBeGreaterThan(0)
    }
  })
})
