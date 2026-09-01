import { describe, it, expect } from 'vitest'
import { INDUSTRIES } from '../src/data/industries.js'
import { FACETS, facetsByDimension } from '../src/data/facets.js'
import derived from '../src/data/industry-vectors.json'

const ALL = FACETS.map(f => f.key)
const VALUE_KEYS = facetsByDimension('values').map(f => f.key)
// Seven, not six: scheduleFlex is a Context facet with no usable O*NET source
// (spec §3.8, correction 4), authored by hand alongside the six Values facets.
const AUTHORED_KEYS = [...VALUE_KEYS, 'scheduleFlex']

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

  it('marks exactly the six Values facets and scheduleFlex as authored', () => {
    for (const ind of INDUSTRIES) {
      expect([...ind.authoredFacets].sort(), ind.key).toEqual([...AUTHORED_KEYS].sort())
      expect(ind.authoredFacets, ind.key).toContain('scheduleFlex')
    }
  })

  it('derives seventeen facets and authors seven', () => {
    const derivedKeys = Object.keys(derived.industries[INDUSTRIES[0].key])
    expect(derivedKeys).toHaveLength(17)
    expect(derivedKeys).not.toContain('scheduleFlex')
    expect(derivedKeys.length + INDUSTRIES[0].authoredFacets.length).toBe(FACETS.length)
    for (const key of Object.keys(derived.industries)) {
      expect(Object.keys(derived.industries[key]), key).toHaveLength(17)
    }
  })

  // The facet was removed from the element map because 4.C.3.a.4 measured
  // decision discretion, not schedule freedom, and produced an ordering that
  // put public safety 3rd of 22. The authored replacement has to actually fix
  // that, and it has to discriminate: the rejected mapping spanned 24.5 points,
  // which spec §3.8 already records as too compressed to carry signal.
  it('authors scheduleFlex with a face-valid ordering and a usable spread', () => {
    const of = key => INDUSTRIES.find(i => i.key === key).vector.scheduleFlex
    const all = INDUSTRIES.map(i => i.vector.scheduleFlex)
    expect(Math.max(...all) - Math.min(...all)).toBeGreaterThan(54)

    const shiftBound = ['public-safety-protective', 'healthcare-medicine',
      'manufacturing-production', 'hospitality-travel-food', 'education-teaching']
    const selfDirected = ['technology-software', 'arts-design-entertainment',
      'real-estate-property']
    for (const low of shiftBound) {
      for (const high of selfDirected) {
        expect(of(low), `${low} vs ${high}`).toBeLessThan(of(high))
      }
    }
    // The specific inversions the reviewer used to falsify the derived mapping.
    expect(of('education-teaching')).toBeLessThan(of('construction-skilled-trades'))
    expect(of('arts-design-entertainment')).toBeGreaterThan(of('public-safety-protective'))
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

  // Spec §3.7's table row 20 reads "Hospitality, Travel & Food Service".
  it('names industries as the spec names them', () => {
    expect(INDUSTRIES.find(i => i.key === 'hospitality-travel-food').name)
      .toBe('Hospitality, Travel & Food Service')
  })

  it('does not produce 22 identical vectors', () => {
    const signatures = new Set(INDUSTRIES.map(i => JSON.stringify(i.vector)))
    expect(signatures.size).toBe(22)
  })
})
