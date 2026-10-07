import { describe, it, expect } from 'vitest'
import { nearMisses, bestShiftFor, SHIFT, NEAR_MISS_COUNT } from '../src/engine/nearmiss.js'
import { scoreAnswers } from '../src/engine/score.js'
import { matchIndustries, centerByDimension, fitOf } from '../src/engine/match.js'
import { summarise } from '../src/engine/profile.js'
import { QUESTIONS } from '../src/data/questions.js'
import { INDUSTRIES } from '../src/data/industries.js'
import { FACETS } from '../src/data/facets.js'

const varied = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, (i % 5) + 1]))
const profile = scoreAnswers(varied)
const ranked = matchIndustries(profile)
const summary = summarise(profile, ranked)

describe('bestShiftFor', () => {
  it('moves exactly one facet by exactly SHIFT points', () => {
    const s = bestShiftFor(profile, ranked[7].key)
    expect(Math.abs(s.to - s.from)).toBeCloseTo(SHIFT, 6)
    expect(FACETS.some(f => f.key === s.facet)).toBe(true)
  })

  it('never lowers the fit — the shift it picks is the most helpful one', () => {
    for (const industry of INDUSTRIES) {
      const s = bestShiftFor(profile, industry.key)
      expect(s.newFit, industry.key).toBeGreaterThanOrEqual(s.fit)
    }
  })

  it('reports a newFit that matches re-running the match on the shifted profile', () => {
    const s = bestShiftFor(profile, ranked[6].key)
    const shifted = { ...profile, [s.facet]: s.to }
    const industry = INDUSTRIES.find(i => i.key === ranked[6].key)
    const check = fitOf(centerByDimension(shifted), centerByDimension(industry.vector)).fit
    expect(s.newFit).toBeCloseTo(check, 9)
  })
})

describe('nearMisses', () => {
  it('returns the next industries after the shortlist, none of them carded', () => {
    const misses = nearMisses(profile, ranked, summary.shortlist)
    expect(misses).toHaveLength(NEAR_MISS_COUNT)
    const carded = new Set(summary.shortlist.map(e => e.key))
    for (const m of misses) expect(carded.has(m.key)).toBe(false)
  })

  it('reports the gap to the lowest carded fit and whether the shift closes it', () => {
    const misses = nearMisses(profile, ranked, summary.shortlist)
    const threshold = Math.min(...summary.shortlist.map(e => e.fit))
    for (const m of misses) {
      expect(m.gap).toBeCloseTo(threshold - m.fit, 9)
      expect(m.reaches).toBe(m.shift.newFit >= threshold)
    }
  })

  it('returns nothing when there is no shortlist to miss', () => {
    expect(nearMisses(profile, ranked, [])).toEqual([])
  })
})
