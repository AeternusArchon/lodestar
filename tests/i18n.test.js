import { describe, it, expect } from 'vitest'
import en from '../src/i18n/en.js'
import es from '../src/i18n/es.js'
import { QUESTIONS } from '../src/data/questions.js'
import { FACETS } from '../src/data/facets.js'
import { INDUSTRIES } from '../src/data/industries.js'
import { EXPLANATIONS } from '../src/data/explanations.js'

/** Every UI leaf in a locale (the four data sections are checked separately). */
const DATA_SECTIONS = new Set(['items', 'explanations', 'facets', 'industries'])

function leaves(obj, prefix = '') {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (!prefix && DATA_SECTIONS.has(k)) continue
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...leaves(v, path))
    else out.push([path, v])
  }
  return out
}

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

const placeholders = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()

describe('es.js mirrors en.js', () => {
  const enLeaves = leaves(en)

  it('defines every English UI key as a string', () => {
    const missing = enLeaves.filter(([path]) => typeof get(es, path) !== 'string').map(([p]) => p)
    expect(missing).toEqual([])
  })

  it('has no UI keys English lacks', () => {
    const extra = leaves(es).filter(([path]) => typeof get(en, path) !== 'string').map(([p]) => p)
    expect(extra).toEqual([])
  })

  it('uses the same placeholders in every string', () => {
    const bad = enLeaves
      .filter(([path, v]) => typeof v === 'string' && typeof get(es, path) === 'string')
      .filter(([path, v]) => placeholders(v).join() !== placeholders(get(es, path)).join())
      .map(([p]) => p)
    expect(bad).toEqual([])
  })

  it('translates all 72 items and explanations, keyed by the real ids', () => {
    const ids = QUESTIONS.map(q => q.id).sort()
    expect(Object.keys(es.items).sort()).toEqual(ids)
    expect(Object.keys(es.explanations).sort()).toEqual(ids)
    for (const id of ids) {
      expect(typeof es.items[id], id).toBe('string')
      expect(es.items[id].length, id).toBeGreaterThan(0)
      expect(typeof es.explanations[id], id).toBe('string')
      expect(es.explanations[id].length, id).toBeGreaterThan(0)
    }
  })

  it('translates all 24 facets with label, blurb and blurbLow', () => {
    expect(Object.keys(es.facets).sort()).toEqual(FACETS.map(f => f.key).sort())
    for (const f of FACETS) {
      for (const field of ['label', 'blurb', 'blurbLow']) {
        expect(typeof es.facets[f.key][field], `${f.key}.${field}`).toBe('string')
        expect(es.facets[f.key][field].length).toBeGreaterThan(0)
      }
    }
  })

  it('translates all 22 industries with name, blurb, three titles and firstMove', () => {
    expect(INDUSTRIES).toHaveLength(22)
    expect(Object.keys(es.industries).sort()).toEqual(INDUSTRIES.map(i => i.key).sort())
    for (const i of INDUSTRIES) {
      const tr = es.industries[i.key]
      for (const field of ['name', 'blurb', 'firstMove']) {
        expect(typeof tr[field], `${i.key}.${field}`).toBe('string')
        expect(tr[field].length).toBeGreaterThan(0)
      }
      expect(tr.titles, i.key).toHaveLength(3)
      tr.titles.forEach(title => expect(typeof title).toBe('string'))
    }
  })
})

describe('explanations', () => {
  it('has an entry for every question id', () => {
    for (const q of QUESTIONS) expect(typeof EXPLANATIONS[q.id], q.id).toBe('string')
  })

  // The note rewords the statement; naming the facet it feeds would let a
  // reader answer the label instead of the sentence (see explanations.js).
  it('never names a facet label or key as a whole word', () => {
    const terms = [...new Set(FACETS.flatMap(f => [f.label, f.key]))]
    const hits = []
    for (const [id, text] of Object.entries(EXPLANATIONS)) {
      for (const term of terms) {
        const re = new RegExp(`(^|[^\\p{L}])${term}($|[^\\p{L}])`, 'iu')
        if (re.test(text)) hits.push(`${id}: "${term}"`)
      }
    }
    expect(hits).toEqual([])
  })
})
