import { describe, it, expect } from 'vitest'
import { toMarkdown } from '../src/engine/format.js'
import { scoreAnswers } from '../src/engine/score.js'
import { matchIndustries } from '../src/engine/match.js'
import { summarise } from '../src/engine/profile.js'
import { explainMatch } from '../src/engine/explain.js'
import { QUESTIONS } from '../src/data/questions.js'
import { INDUSTRIES } from '../src/data/industries.js'
import { FACETS } from '../src/data/facets.js'

const varied = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, (i % 5) + 1]))
const byKey = Object.fromEntries(INDUSTRIES.map(i => [i.key, i]))

function build(answers) {
  const profile = scoreAnswers(answers)
  const ranked = matchIndustries(profile)
  const summary = summarise(profile, ranked)
  const cards = summary.shortlist.map((entry, i) => ({
    match: { ...byKey[entry.key], fit: entry.fit },
    reasons: explainMatch(entry, profile, answers, { flat: summary.flat }),
    rank: i + 1,
    tied: false,
  }))
  return { profile, summary, cards }
}

describe('toMarkdown', () => {
  it('is deterministic for a fixed date', () => {
    const results = { ...build(varied), date: '2026-10-07' }
    expect(toMarkdown(results)).toBe(toMarkdown(results))
  })

  it('includes every facet label and score', () => {
    const results = build(varied)
    const md = toMarkdown({ ...results, date: '2026-10-07' })
    for (const f of FACETS) {
      expect(md).toContain(`- ${f.label}: ${Math.round(results.profile[f.key])}`)
    }
  })

  it('lists every shortlisted industry with its fit and first move', () => {
    const results = build(varied)
    const md = toMarkdown(results)
    for (const c of results.cards) {
      expect(md).toContain(`${c.match.name} (${Math.round(c.match.fit)}% fit)`)
      expect(md).toContain(c.match.firstMove)
    }
  })

  it('carries the honest-scope line, the estimate label, and the O*NET attribution', () => {
    const md = toMarkdown(build(varied))
    expect(md).toMatch(/not a verdict/i)
    expect(md).toMatch(/editorial estimate/i)
    expect(md).toMatch(/O\*NET 30\.3/)
  })

  it('writes quality flags at the top when present', () => {
    const md = toMarkdown({ ...build(varied), flags: [{ code: 'x', message: 'Looked rushed.' }] })
    expect(md.indexOf('Treat this run as a draft')).toBeLessThan(md.indexOf('## Shortlist'))
    expect(md).toContain('- Looked rushed.')
  })

  it('uses a caller-supplied strings object and labels, falling back to English for the rest', () => {
    const results = build(varied)
    const md = toMarkdown({
      ...results,
      date: '2026-10-07',
      strings: { heading: 'Resultados — {date}', shortlist: 'Lista corta', fit: '{name} ({fit}% de ajuste)', profile: 'Perfil' },
      facetLabels: { realistic: 'Realista' },
      dimensionLabels: { interests: 'Intereses' },
      ordinal: n => `${n}.º`,
    })
    expect(md).toMatch(/^# Resultados — 2026-10-07/)
    expect(md).toContain('## Lista corta')
    expect(md).toContain('## Perfil')
    expect(md).toContain('### 1.º — ')
    expect(md).toContain(`(${Math.round(results.cards[0].match.fit)}% de ajuste)`)
    expect(md).toContain(`- Realista: ${Math.round(results.profile.realistic)}`)
    expect(md).toContain('**Intereses**')
    // Not overridden, so still English.
    expect(md).toContain('**Values**')
    expect(md).toMatch(/not a verdict/)
    expect(md).not.toContain('Lodestar results')
  })

  it('says so instead of ranking on a wholly flat profile', () => {
    const uniform = Object.fromEntries(QUESTIONS.map(q => [q.id, 3]))
    const profile = scoreAnswers(uniform)
    const summary = summarise(profile, matchIndustries(profile))
    const md = toMarkdown({ profile, summary, cards: [] })
    expect(md).toMatch(/too even to rank/)
    expect(md).not.toMatch(/% fit\)/)
  })
})
