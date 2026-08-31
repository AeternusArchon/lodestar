import { describe, it, expect } from 'vitest'
import { DIMENSIONS, FACETS, facetsByDimension } from '../src/data/facets.js'
import { WEIGHTS, assertWeightsValid } from '../src/engine/weights.js'

describe('facets', () => {
  it('defines exactly 24 facets', () => { expect(FACETS).toHaveLength(24) })

  it('has six facets in each of four dimensions', () => {
    expect(DIMENSIONS).toEqual(['interests', 'values', 'aptitudes', 'context'])
    for (const d of DIMENSIONS) expect(facetsByDimension(d)).toHaveLength(6)
  })

  it('has unique keys and no facet outside a known dimension', () => {
    const keys = FACETS.map(f => f.key)
    expect(new Set(keys).size).toBe(24)
    for (const f of FACETS) expect(DIMENSIONS).toContain(f.dimension)
  })

  // Spelled out as a literal on purpose. Eleven later tasks import these exact
  // key strings, and Task 10's star plot consumes FACETS positionally, so a typo
  // or a reorder must fail here rather than silently downstream. Deriving this
  // list from FACETS would make the assertion tautological and guard nothing.
  it('keeps the exact 24 keys in the fixed dimension order', () => {
    expect(FACETS.map(f => f.key)).toEqual([
      'realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional',
      'autonomy', 'impact', 'income', 'stability', 'mastery', 'recognition',
      'analytical', 'verbal', 'spatial', 'interpersonal', 'organizational', 'creative',
      'peopleFacing', 'structurePref', 'pace', 'physicality', 'riskTolerance', 'scheduleFlex',
    ])
  })

  it('gives every facet a human label and a blurb', () => {
    for (const f of FACETS) {
      expect(f.label.length).toBeGreaterThan(0)
      expect(f.blurb.length).toBeGreaterThan(10)
    }
  })
})

describe('weights', () => {
  it('sums to 1', () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
    expect(Math.abs(total - 1)).toBeLessThan(1e-9)
  })

  it('covers exactly the four dimensions', () => {
    expect(Object.keys(WEIGHTS).sort()).toEqual([...DIMENSIONS].sort())
  })

  it('rejects weights that do not sum to 1', () => {
    expect(() => assertWeightsValid({ interests: 0.5, values: 0.2, aptitudes: 0.2, context: 0.2 }))
      .toThrow(/sum to 1/)
  })

  it('rejects unknown dimension keys', () => {
    expect(() => assertWeightsValid({ interests: 1 })).toThrow(/dimension/)
  })
})
