import { describe, it, expect } from 'vitest'
import { matchIndustries, centerByDimension } from '../src/engine/match.js'
import { INDUSTRIES } from '../src/data/industries.js'
import { FACETS } from '../src/data/facets.js'

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
})
