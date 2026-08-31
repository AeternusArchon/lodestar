import { describe, it, expect } from 'vitest'
import { explainMatch } from '../src/engine/explain.js'
import { matchIndustries } from '../src/engine/match.js'
import { scoreAnswers } from '../src/engine/score.js'
import { QUESTIONS } from '../src/data/questions.js'
import { facetsByDimension } from '../src/data/facets.js'

const answers = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, (i % 5) + 1]))
const profile = scoreAnswers(answers)
const [top] = matchIndustries(profile)

describe('explainMatch', () => {
  it('returns the three largest positive contributors', () => {
    const { positives } = explainMatch(top, profile, answers)
    expect(positives).toHaveLength(3)
    const all = Object.entries(top.contributions).sort((a, b) => b[1] - a[1])
    expect(positives.map(p => p.facet)).toEqual(all.slice(0, 3).map(([k]) => k))
  })

  it('resolves every reason to real items the user answered', () => {
    const { positives } = explainMatch(top, profile, answers)
    for (const reason of positives) {
      expect(reason.items.length).toBeGreaterThan(0)
      for (const item of reason.items) {
        expect(QUESTIONS.find(q => q.id === item.id).facet).toBe(reason.facet)
        expect(item.response).toBe(answers[item.id])
      }
    }
  })

  it('reports the strongest negative contributor', () => {
    const { negative } = explainMatch(top, profile, answers)
    const min = Math.min(...Object.values(top.contributions))
    if (min < 0) expect(negative.contribution).toBeCloseTo(min, 10)
    else expect(negative).toBeNull()
  })

  it('excludes facets from flat dimensions', () => {
    const { positives } = explainMatch(top, profile, answers, { flat: ['interests'] })
    const interestKeys = facetsByDimension('interests').map(f => f.key)
    for (const p of positives) expect(interestKeys).not.toContain(p.facet)
  })

  it('marks authored facets so the UI can label them', () => {
    const { positives } = explainMatch(top, profile, answers)
    const valueKeys = facetsByDimension('values').map(f => f.key)
    for (const p of positives) expect(p.authored).toBe(valueKeys.includes(p.facet))
  })
})
