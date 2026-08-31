import { describe, it, expect } from 'vitest'
import { QUESTIONS } from '../src/data/questions.js'
import { FACETS, DIMENSIONS } from '../src/data/facets.js'

const PER_DIMENSION = { interests: 30, values: 18, aptitudes: 12, context: 12 }
const facetOf = Object.fromEntries(FACETS.map(f => [f.key, f]))

describe('question bank', () => {
  it('has exactly 72 items', () => { expect(QUESTIONS).toHaveLength(72) })

  it('has unique ids', () => {
    expect(new Set(QUESTIONS.map(q => q.id)).size).toBe(72)
  })

  it('maps every item to a real facet', () => {
    for (const q of QUESTIONS) expect(facetOf[q.facet]).toBeDefined()
  })

  it('distributes items across dimensions as specified', () => {
    for (const d of DIMENSIONS) {
      const n = QUESTIONS.filter(q => facetOf[q.facet].dimension === d).length
      expect(n).toBe(PER_DIMENSION[d])
    }
  })

  it('gives each facet its per-dimension share', () => {
    const share = { interests: 5, values: 3, aptitudes: 2, context: 2 }
    for (const f of FACETS) {
      const n = QUESTIONS.filter(q => q.facet === f.key).length
      expect(n, `facet ${f.key}`).toBe(share[f.dimension])
    }
  })

  it('reverse-keys at least one item per facet', () => {
    for (const f of FACETS) {
      const reversed = QUESTIONS.filter(q => q.facet === f.key && q.dir === -1)
      expect(reversed.length, `facet ${f.key} needs a reverse-keyed item`).toBeGreaterThanOrEqual(1)
    }
  })

  it('uses only +1 and -1 directions', () => {
    for (const q of QUESTIONS) expect([1, -1]).toContain(q.dir)
  })

  it('writes items as first-person statements, not questions', () => {
    for (const q of QUESTIONS) {
      expect(q.text.endsWith('?'), `item ${q.id} must be a statement`).toBe(false)
      expect(q.text.length).toBeGreaterThan(20)
    }
  })

  it('never places two items from the same facet side by side', () => {
    for (let i = 1; i < QUESTIONS.length; i++) {
      expect(
        QUESTIONS[i].facet,
        `${QUESTIONS[i - 1].id} and ${QUESTIONS[i].id} are adjacent and share a facet`,
      ).not.toBe(QUESTIONS[i - 1].facet)
    }
  })
})
