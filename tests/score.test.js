import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { scoreAnswers } from '../src/engine/score.js'
import { QUESTIONS } from '../src/data/questions.js'
import { FACETS } from '../src/data/facets.js'

const answerAll = v => Object.fromEntries(QUESTIONS.map(q => [q.id, v]))

describe('scoreAnswers', () => {
  it('returns all 24 facets', () => {
    const out = scoreAnswers(answerAll(3))
    expect(Object.keys(out).sort()).toEqual(FACETS.map(f => f.key).sort())
  })

  it('maps a uniform midpoint response to 50 everywhere', () => {
    const out = scoreAnswers(answerAll(3))
    for (const f of FACETS) expect(out[f.key]).toBeCloseTo(50, 10)
  })

  it('produces exact boundaries for uniform extremes', () => {
    // With at least one reverse-keyed item per facet, uniform 1s and 5s do not
    // reach the boundary. Score each facet's items in its own keyed direction.
    const extreme = Object.fromEntries(QUESTIONS.map(q => [q.id, q.dir === 1 ? 5 : 1]))
    const out = scoreAnswers(extreme)
    for (const f of FACETS) expect(out[f.key]).toBeCloseTo(100, 10)

    const opposite = Object.fromEntries(QUESTIONS.map(q => [q.id, q.dir === 1 ? 1 : 5]))
    const low = scoreAnswers(opposite)
    for (const f of FACETS) expect(low[f.key]).toBeCloseTo(0, 10)
  })

  it('mirrors reverse-keyed items', () => {
    const reversed = QUESTIONS.find(q => q.dir === -1)
    const base = answerAll(3)
    const out = scoreAnswers({ ...base, [reversed.id]: 5 })
    const mirror = scoreAnswers({ ...base, [reversed.id]: 1 })
    expect(out[reversed.facet]).toBeLessThan(50)
    expect(mirror[reversed.facet]).toBeGreaterThan(50)
    expect(out[reversed.facet] + mirror[reversed.facet]).toBeCloseTo(100, 10)
  })

  it('rejects an incomplete answer set rather than scoring blanks as zero', () => {
    const partial = answerAll(3)
    delete partial[QUESTIONS[0].id]
    expect(() => scoreAnswers(partial)).toThrow(/unanswered/i)
  })

  it('rejects out-of-range responses', () => {
    expect(() => scoreAnswers({ ...answerAll(3), [QUESTIONS[0].id]: 0 })).toThrow(/range/i)
    expect(() => scoreAnswers({ ...answerAll(3), [QUESTIONS[0].id]: 6 })).toThrow(/range/i)
  })
})

describe('engine purity', () => {
  it('never imports React or the DOM', () => {
    for (const file of readdirSync('src/engine')) {
      const src = readFileSync(`src/engine/${file}`, 'utf8')
      expect(src, file).not.toMatch(/from\s+['"]react/)
      expect(src, file).not.toMatch(/\b(document|window)\./)
      expect(src, file).not.toMatch(/from\s+['"]\.\.\/components/)
    }
  })
})
