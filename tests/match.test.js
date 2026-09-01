import { describe, it, expect } from 'vitest'
import { matchIndustries, centerByDimension } from '../src/engine/match.js'
import { INDUSTRIES } from '../src/data/industries.js'
import { FACETS } from '../src/data/facets.js'
import { WEIGHTS } from '../src/engine/weights.js'

const flat = v => Object.fromEntries(FACETS.map(f => [f.key, v]))

describe('centerByDimension', () => {
  it('makes each dimension sum to zero', () => {
    const centered = centerByDimension(INDUSTRIES[0].vector)
    for (const d of ['interests', 'values', 'aptitudes', 'context']) {
      const sum = FACETS.filter(f => f.dimension === d)
        .reduce((a, f) => a + centered[f.key], 0)
      expect(sum).toBeCloseTo(0, 8)
    }
  })
})

describe('matchIndustries', () => {
  it('ranks every industry exactly once, descending', () => {
    const out = matchIndustries(INDUSTRIES[3].vector)
    expect(out).toHaveLength(22)
    expect(new Set(out.map(r => r.key)).size).toBe(22)
    for (let i = 1; i < out.length; i++) expect(out[i - 1].fit).toBeGreaterThanOrEqual(out[i].fit)
  })

  it('ranks an industry first when the profile is its own vector', () => {
    for (const target of INDUSTRIES) {
      expect(matchIndustries(target.vector)[0].key, target.key).toBe(target.key)
    }
  })

  it('is invariant to a uniform additive shift in the profile', () => {
    const base = INDUSTRIES[5].vector
    const shifted = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.min(100, v + 7)]))
    expect(matchIndustries(shifted).map(r => r.key)).toEqual(matchIndustries(base).map(r => r.key))
  })

  it('reports fit on a 0-100 scale', () => {
    for (const r of matchIndustries(INDUSTRIES[0].vector)) {
      expect(r.fit).toBeGreaterThanOrEqual(0)
      expect(r.fit).toBeLessThanOrEqual(100)
    }
  })

  it('returns a contribution for every facet', () => {
    const [top] = matchIndustries(INDUSTRIES[0].vector)
    expect(Object.keys(top.contributions).sort()).toEqual(FACETS.map(f => f.key).sort())
  })

  it('rejects weights that do not sum to 1', () => {
    expect(() => matchIndustries(flat(50), { interests: 1, values: 1, aptitudes: 1, context: 1 }))
      .toThrow(/sum to 1/)
  })

  it('never reports fit above 100, even on a self-match', () => {
    // Regression for: sqrt(x) * sqrt(x) does not always exactly reconstruct x,
    // so an unclamped self-match cosine can land fractionally above 1 (observed
    // in this environment: fit = 100.00000000000003 for
    // agriculture-natural-resources matched against itself). The same
    // reconstruction error can also land fractionally *below* 1 for other
    // industries (observed: 99.99999999999999 for marketing-advertising-media)
    // — that side is still within the documented 0-100 bound on its own, so it
    // is asserted as <= 100 here rather than forced to exactly 100.
    for (const target of INDUSTRIES) {
      const [top] = matchIndustries(target.vector)
      expect(top.fit).toBeLessThanOrEqual(100)
    }
  })

  it('clamps a floating-point self-match overshoot to exactly 100', () => {
    // Which industry's self-match overshoots is floating-point-noise dependent
    // (it varies by JS engine/version, not by a logic bug — see the prior test's
    // comment), so this recomputes the pre-clamp cosine/fit the same way
    // matchIndustries does internally to find whichever industry (or industries)
    // overshoot in the environment actually running this test, then asserts the
    // real engine output clamps each of them down to exactly 100. If no industry
    // overshoots here, the length check below fails loudly rather than passing
    // vacuously.
    const overshootKeys = INDUSTRIES.filter(industry => {
      const u = centerByDimension(industry.vector)
      let numerator = 0, norm = 0
      for (const facet of FACETS) {
        const w = WEIGHTS[facet.dimension]
        numerator += w * u[facet.key] * u[facet.key]
        norm += w * u[facet.key] ** 2
      }
      const rawFit = ((numerator / (Math.sqrt(norm) * Math.sqrt(norm)) + 1) / 2) * 100
      return rawFit > 100
    }).map(i => i.key)

    expect(overshootKeys.length).toBeGreaterThan(0)

    for (const key of overshootKeys) {
      const industry = INDUSTRIES.find(i => i.key === key)
      const [top] = matchIndustries(industry.vector)
      expect(top.key).toBe(key)
      expect(top.fit).toBe(100)
    }
  })
})
