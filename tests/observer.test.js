import { describe, it, expect } from 'vitest'
import { encodeAnswers, decodeAnswers, compareWithObserver, sanitiseObservers, CODE_LENGTH, AGREE_DELTA } from '../src/engine/observer.js'
import { scoreAnswers } from '../src/engine/score.js'
import { QUESTIONS } from '../src/data/questions.js'
import { FACETS } from '../src/data/facets.js'

const varied = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, (i % 5) + 1]))
const uniform = v => Object.fromEntries(QUESTIONS.map(q => [q.id, v]))

describe('encode / decode', () => {
  it('round-trips every answer set tried, in 28 URL-safe characters', () => {
    for (const answers of [varied, uniform(1), uniform(5), uniform(3)]) {
      const code = encodeAnswers(answers)
      expect(code).toHaveLength(CODE_LENGTH)
      expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
      expect(decodeAnswers(code)).toEqual(answers)
    }
  })

  it('round-trips random answer sets', () => {
    for (let trial = 0; trial < 50; trial++) {
      const answers = Object.fromEntries(QUESTIONS.map(q => [q.id, 1 + Math.floor(Math.random() * 5)]))
      expect(decodeAnswers(encodeAnswers(answers))).toEqual(answers)
    }
  })

  it('rejects garbage, wrong length, and incomplete input', () => {
    expect(decodeAnswers('nope')).toBeNull()
    expect(decodeAnswers('!'.repeat(CODE_LENGTH))).toBeNull()
    expect(decodeAnswers(null)).toBeNull()
    expect(() => encodeAnswers({})).toThrow()
    expect(() => encodeAnswers({ ...varied, [QUESTIONS[0].id]: 9 })).toThrow()
  })
})

describe('compareWithObserver', () => {
  it('reports full agreement when the observer answers identically', () => {
    const out = compareWithObserver(scoreAnswers(varied), varied)
    expect(out.agree).toHaveLength(FACETS.length)
    expect(out.differ).toHaveLength(0)
  })

  it('sorts differences by size and signs them observer minus self', () => {
    const self = scoreAnswers(uniform(3))
    const out = compareWithObserver(self, uniform(5))
    expect(out.differ.length).toBeGreaterThan(0)
    for (let i = 1; i < out.differ.length; i++) {
      expect(Math.abs(out.differ[i - 1].delta)).toBeGreaterThanOrEqual(Math.abs(out.differ[i].delta))
    }
    for (const r of out.rows) expect(r.delta).toBeCloseTo(r.observer - r.self, 9)
    for (const r of out.agree) expect(Math.abs(r.delta)).toBeLessThan(AGREE_DELTA)
  })
})

describe('sanitiseObservers', () => {
  it('keeps only entries with a name and a decodable code, last five', () => {
    const good = { name: 'Ana', code: encodeAnswers(varied) }
    const out = sanitiseObservers([good, { name: 'x', code: 'bad' }, null, { code: good.code }, 'str'])
    expect(out).toEqual([good])
    expect(sanitiseObservers(Array(8).fill(good))).toHaveLength(5)
    expect(sanitiseObservers('nope')).toEqual([])
  })
})
