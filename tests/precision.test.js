import { describe, it, expect } from 'vitest'
import { facetPrecision, LEVEL_LABEL, DISAGREE_SPREAD } from '../src/engine/precision.js'
import { QUESTIONS } from '../src/data/questions.js'
import { FACETS, facetsByDimension } from '../src/data/facets.js'

const consistent = Object.fromEntries(QUESTIONS.map(q => [q.id, q.dir === 1 ? 5 : 1]))

describe('facetPrecision', () => {
  it('returns an entry for all 24 facets', () => {
    const p = facetPrecision(consistent)
    expect(Object.keys(p)).toHaveLength(FACETS.length)
  })

  it('grades interests firm, values fair, aptitudes and context rough', () => {
    const p = facetPrecision(consistent)
    for (const f of facetsByDimension('interests')) expect(p[f.key].level).toBe('firm')
    for (const f of facetsByDimension('values')) expect(p[f.key].level).toBe('fair')
    for (const f of facetsByDimension('aptitudes')) expect(p[f.key].level).toBe('rough')
    for (const f of facetsByDimension('context')) expect(p[f.key].level).toBe('rough')
  })

  it('reports zero spread when every item on a facet agrees after flipping', () => {
    const p = facetPrecision(consistent)
    for (const f of FACETS) {
      expect(p[f.key].spread).toBe(0)
      expect(p[f.key].disagree).toBe(false)
    }
  })

  it('flags disagreement when a facet\'s own items pull apart', () => {
    // On a two-item facet, answer the +1 item 5 and the -1 item 5 too: signed
    // values are 5 and 1, spread 4.
    const facet = facetsByDimension('context')[0]
    const items = QUESTIONS.filter(q => q.facet === facet.key)
    const answers = { ...consistent }
    for (const q of items) answers[q.id] = 5
    const p = facetPrecision(answers)
    expect(p[facet.key].spread).toBeGreaterThanOrEqual(DISAGREE_SPREAD)
    expect(p[facet.key].disagree).toBe(true)
  })

  it('needs a wider spread to call a five-item facet in disagreement', () => {
    const facet = facetsByDimension('interests')[0]
    const items = QUESTIONS.filter(q => q.facet === facet.key)
    // signed values 3,3,3,3,5: spread 2, ordinary variation on five items
    const answers = { ...consistent }
    items.forEach((q, i) => { answers[q.id] = q.dir === 1 ? (i === 0 ? 5 : 3) : (i === 0 ? 1 : 3) })
    expect(facetPrecision(answers)[facet.key].spread).toBe(2)
    expect(facetPrecision(answers)[facet.key].disagree).toBe(false)
    // widen to spread 3
    const q1 = items[1]
    answers[q1.id] = q1.dir === 1 ? 2 : 4
    expect(facetPrecision(answers)[facet.key].spread).toBe(3)
    expect(facetPrecision(answers)[facet.key].disagree).toBe(true)
  })

  it('works on a partial answer set', () => {
    const partial = { [QUESTIONS[0].id]: 4 }
    const p = facetPrecision(partial)
    expect(p[QUESTIONS[0].facet].answered).toBe(1)
    expect(p[QUESTIONS[0].facet].spread).toBe(0)
  })

  it('has a label for every level', () => {
    for (const level of ['firm', 'fair', 'rough']) expect(LEVEL_LABEL[level]).toBeTruthy()
  })
})
