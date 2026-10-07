import { describe, it, expect } from 'vitest'
import {
  assessQuality, straightLining, reverseContradictions, pace,
  STRAIGHTLINE_SHARE, STRAIGHTLINE_RUN, CONTRADICTION_COUNT, RUSHED_MEDIAN_MS,
} from '../src/engine/quality.js'
import { QUESTIONS } from '../src/data/questions.js'

const uniform = v => Object.fromEntries(QUESTIONS.map(q => [q.id, v]))
const varied = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, (i % 5) + 1]))
// Every item answered in its keyed direction at full strength: a maximally
// consistent respondent, with no contradictions by construction.
const consistent = Object.fromEntries(QUESTIONS.map(q => [q.id, q.dir === 1 ? 5 : 1]))
// Every item agreed with regardless of direction: every reverse pair contradicts.
const agreeAll = uniform(5)

describe('straightLining', () => {
  it('reports share 1 and a full-length run on a uniform answer set', () => {
    const out = straightLining(uniform(3))
    expect(out.share).toBe(1)
    expect(out.longestRun).toBe(QUESTIONS.length)
    expect(out.mode).toBe(3)
  })

  it('reports a low share and short runs on a cycling answer set', () => {
    const out = straightLining(varied)
    expect(out.share).toBeLessThan(0.25)
    expect(out.longestRun).toBe(1)
  })
})

describe('reverseContradictions', () => {
  it('finds none when every item is answered in its keyed direction', () => {
    expect(reverseContradictions(consistent)).toHaveLength(0)
  })

  it('finds one per forward/reverse pair when everything is agreed with', () => {
    const pairs = reverseContradictions(agreeAll)
    expect(pairs.length).toBeGreaterThanOrEqual(24)
    for (const p of pairs) expect(p.values).toEqual([5, 5])
  })

  it('does not count a neutral 3 against either pole', () => {
    expect(reverseContradictions(uniform(3))).toHaveLength(0)
  })
})

describe('pace', () => {
  it('returns null when fewer than half the items are timed', () => {
    const timings = Object.fromEntries(QUESTIONS.slice(0, 10).map(q => [q.id, 500]))
    expect(pace(timings)).toBeNull()
  })

  it('reports the median when enough items are timed', () => {
    const timings = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, i < 36 ? 1000 : 5000]))
    expect(pace(timings).medianMs).toBe(3000)
    expect(pace(timings).timedItems).toBe(QUESTIONS.length)
  })
})

describe('assessQuality', () => {
  it('raises no flags on a varied, consistent, unhurried run', () => {
    const timings = Object.fromEntries(QUESTIONS.map(q => [q.id, 6000]))
    expect(assessQuality(consistent, timings).flags).toEqual([])
  })

  it('flags straight-lining by share', () => {
    const { flags } = assessQuality(uniform(3))
    expect(flags.map(f => f.code)).toContain('straightline-share')
  })

  it('flags straight-lining by run when the overall share is fine', () => {
    // Twelve 4s in a row, then cycle: share stays under 0.7 but the run trips.
    const answers = Object.fromEntries(QUESTIONS.map((q, i) =>
      [q.id, i < STRAIGHTLINE_RUN ? 4 : ((i % 5) + 1)]))
    const { flags, stats } = assessQuality(answers)
    expect(stats.straightLining.share).toBeLessThan(STRAIGHTLINE_SHARE)
    expect(flags.map(f => f.code)).toContain('straightline-run')
  })

  it('flags contradictions when enough reverse pairs disagree with themselves', () => {
    const { flags, stats } = assessQuality(agreeAll)
    expect(stats.contradictions.length).toBeGreaterThanOrEqual(CONTRADICTION_COUNT)
    expect(flags.map(f => f.code)).toContain('contradictions')
  })

  it('flags a rushed run and ignores timing when there is not enough of it', () => {
    const fast = Object.fromEntries(QUESTIONS.map(q => [q.id, RUSHED_MEDIAN_MS - 500]))
    expect(assessQuality(consistent, fast).flags.map(f => f.code)).toContain('rushed')
    expect(assessQuality(consistent, {}).flags.map(f => f.code)).not.toContain('rushed')
  })

  it('writes every flag with a code and a plain-language message', () => {
    for (const f of assessQuality(agreeAll).flags) {
      expect(typeof f.code).toBe('string')
      expect(f.message.length).toBeGreaterThan(20)
    }
  })
})
