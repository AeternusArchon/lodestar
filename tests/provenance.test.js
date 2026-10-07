import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { INDUSTRIES } from '../src/data/industries.js'
import { DERIVED_SOURCE, AUTHORED_RATIONALE } from '../src/data/provenance.js'
import { FACETS } from '../src/data/facets.js'

describe('provenance', () => {
  it('records a source for all 24 facets on every industry', () => {
    for (const ind of INDUSTRIES) {
      expect(Object.keys(ind.provenance).sort(), ind.key).toEqual(FACETS.map(f => f.key).sort())
    }
  })

  it('marks the seven authored facets authored and the rest derived', () => {
    const ind = INDUSTRIES[0]
    for (const f of FACETS) {
      const expected = ind.authoredFacets.includes(f.key) ? 'authored' : 'derived'
      expect(ind.provenance[f.key].kind, f.key).toBe(expected)
    }
  })

  it('keeps DERIVED_SOURCE in lockstep with the derivation script', () => {
    const script = readFileSync('data-build/derive-industry-vectors.mjs', 'utf8')
    const fromScript = Object.fromEntries(
      [...script.matchAll(/^\s{2}(\w+):\s+\{ scale: '(\w+)', els: \[([^\]]+)\],\s+file: '([^']+)'/gm)]
        .map(m => [m[1], { scale: m[2], els: m[3].replace(/[\s']/g, '').split(','), file: m[4] }]))
    expect(Object.keys(fromScript).sort()).toEqual(Object.keys(DERIVED_SOURCE).sort())
    for (const [k, v] of Object.entries(fromScript)) {
      expect(DERIVED_SOURCE[k].scale, k).toBe(v.scale)
      expect(DERIVED_SOURCE[k].els, k).toEqual(v.els)
      expect(DERIVED_SOURCE[k].file, k).toBe(v.file)
    }
  })

  it('gives every derived facet a plain-language description and every authored one a rationale', () => {
    for (const v of Object.values(DERIVED_SOURCE)) expect(v.what.length).toBeGreaterThan(10)
    for (const k of INDUSTRIES[0].authoredFacets) expect(AUTHORED_RATIONALE[k].length).toBeGreaterThan(10)
  })

  it('carries the per-industry schedule-freedom note as data, not just a comment', () => {
    for (const ind of INDUSTRIES) {
      expect(typeof ind.provenance.scheduleFlex.note, ind.key).toBe('string')
      expect(ind.provenance.scheduleFlex.note.length, ind.key).toBeGreaterThan(10)
    }
  })

  it('reports one rater and no gap when no second rating exists', () => {
    // The shipped rater2 file is an empty slot; every industry is single-rated.
    for (const ind of INDUSTRIES) {
      expect(ind.provenance.autonomy.raters, ind.key).toBe(1)
      expect(ind.provenance.autonomy.gap, ind.key).toBeNull()
    }
  })
})

describe('second rater blending', () => {
  it('averages the two raters and records the gap when a second rating is present', async () => {
    vi.resetModules()
    vi.doMock('../src/data/authored-values-rater2.json', () => ({
      default: { meta: {}, values: { 'technology-software': { autonomy: 52, impact: 70 } } },
    }))
    const { INDUSTRIES: blended } = await import('../src/data/industries.js')
    const tech = blended.find(i => i.key === 'technology-software')
    // rater1 autonomy for tech is 72; blended with 52 gives 62.
    expect(tech.vector.autonomy).toBe(62)
    expect(tech.provenance.autonomy).toMatchObject({ raters: 2, rater1: 72, rater2: 52, gap: 20 })
    // A facet the second rater did not score keeps the single figure.
    expect(tech.provenance.income).toMatchObject({ raters: 1, rater2: null })
    expect(tech.vector.income).toBe(85)
    // Other industries are untouched.
    const law = blended.find(i => i.key === 'law-legal-services')
    expect(law.provenance.autonomy.raters).toBe(1)
    vi.doUnmock('../src/data/authored-values-rater2.json')
    vi.resetModules()
  })
})
