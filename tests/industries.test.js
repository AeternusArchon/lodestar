import { describe, it, expect } from 'vitest'
import { INDUSTRIES } from '../src/data/industries.js'
import { FACETS, facetsByDimension } from '../src/data/facets.js'

const ALL = FACETS.map(f => f.key)
const VALUE_KEYS = facetsByDimension('values').map(f => f.key)

describe('industries', () => {
  it('defines exactly 22 industries with unique keys', () => {
    expect(INDUSTRIES).toHaveLength(22)
    expect(new Set(INDUSTRIES.map(i => i.key)).size).toBe(22)
  })

  it('gives every industry a complete 24-facet vector in range', () => {
    for (const ind of INDUSTRIES) {
      expect(Object.keys(ind.vector).sort(), ind.key).toEqual([...ALL].sort())
      for (const [k, v] of Object.entries(ind.vector)) {
        expect(v, `${ind.key}.${k}`).toBeGreaterThanOrEqual(0)
        expect(v, `${ind.key}.${k}`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('marks exactly the six Values facets as authored', () => {
    for (const ind of INDUSTRIES) {
      expect([...ind.authoredFacets].sort(), ind.key).toEqual([...VALUE_KEYS].sort())
    }
  })

  it('gives three job titles spanning entry to senior', () => {
    for (const ind of INDUSTRIES) {
      expect(ind.titles, ind.key).toHaveLength(3)
      expect(ind.titles.map(t => t.level).sort()).toEqual(['entry', 'mid', 'senior'])
    }
  })

  it('gives every industry a concrete first move', () => {
    for (const ind of INDUSTRIES) {
      expect(ind.firstMove.length, ind.key).toBeGreaterThan(40)
    }
  })

  it('does not produce 22 identical vectors', () => {
    const signatures = new Set(INDUSTRIES.map(i => JSON.stringify(i.vector)))
    expect(signatures.size).toBe(22)
  })
})
