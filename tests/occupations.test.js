import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { OCCUPATIONS, OCCUPATION_FACETS, rankOccupations, subsetFit, hasVectors } from '../src/engine/occupations.js'
import { INDUSTRIES } from '../src/data/industries.js'
import { FACETS } from '../src/data/facets.js'

const flat = v => Object.fromEntries(FACETS.map(f => [f.key, v]))

describe('occupations roster', () => {
  it('covers every industry with at least one occupation', () => {
    for (const i of INDUSTRIES) {
      expect(OCCUPATIONS[i.key]?.length, i.key).toBeGreaterThan(0)
    }
  })

  it('matches data-build/soc-by-industry.json exactly', () => {
    const src = JSON.parse(readFileSync('data-build/soc-by-industry.json', 'utf8'))
    for (const [key, list] of Object.entries(src)) {
      expect(OCCUPATIONS[key].map(o => o.soc)).toEqual(list.map(o => o.soc))
      expect(OCCUPATIONS[key].map(o => o.title)).toEqual(list.map(o => o.title))
    }
  })

  it('declares the 17 derived facet keys, all of which exist in FACETS', () => {
    expect(OCCUPATION_FACETS).toHaveLength(17)
    const keys = new Set(FACETS.map(f => f.key))
    for (const k of OCCUPATION_FACETS) expect(keys.has(k), k).toBe(true)
    // The seven authored facets must not be claimed as derived.
    for (const k of ['autonomy', 'impact', 'income', 'stability', 'mastery', 'recognition', 'scheduleFlex']) {
      expect(OCCUPATION_FACETS).not.toContain(k)
    }
  })

  it('keeps the derivation MAP in lockstep with the industry script', () => {
    const industryScript = readFileSync('data-build/derive-industry-vectors.mjs', 'utf8')
    const occScript = readFileSync('data-build/derive-occupation-vectors.mjs', 'utf8')
    const pick = s => [...s.matchAll(/^\s{2}(\w+):\s+\{ scale: '(\w+)', els: \[([^\]]+)\]/gm)]
      .map(m => `${m[1]}|${m[2]}|${m[3].replace(/\s/g, '')}`)
    expect(pick(occScript)).toEqual(pick(industryScript))
  })
})

describe('rankOccupations', () => {
  it('returns an unranked roster when vectors are absent', () => {
    const key = INDUSTRIES.find(i => !hasVectors(i.key))?.key
    if (!key) return // vectors have been generated locally; nothing to test here
    const out = rankOccupations(key, flat(50))
    expect(out.ranked).toBe(false)
    expect(out.occupations.every(o => o.fit === null)).toBe(true)
  })

  it('ranks descending with fits on 0-100 when vectors are present', () => {
    const key = INDUSTRIES.find(i => hasVectors(i.key))?.key
    if (!key) return // roster-only build
    const out = rankOccupations(key, flat(50))
    expect(out.ranked).toBe(true)
    for (let i = 1; i < out.occupations.length; i++) {
      expect(out.occupations[i - 1].fit).toBeGreaterThanOrEqual(out.occupations[i].fit)
    }
    for (const o of out.occupations) expect(o.fit).toBeGreaterThanOrEqual(0)
  })
})

describe('subsetFit', () => {
  it('scores a vector against itself at 100 and ignores facets outside the subset', () => {
    const v = Object.fromEntries(FACETS.map((f, i) => [f.key, (i * 37) % 100]))
    const keys = OCCUPATION_FACETS
    expect(subsetFit(v, v, keys)).toBeCloseTo(100, 6)
    const perturbed = { ...v, income: 0, autonomy: 100 } // not in subset
    expect(subsetFit(perturbed, v, keys)).toBeCloseTo(100, 6)
  })
})
