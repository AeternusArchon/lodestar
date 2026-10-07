import { FACETS, DIMENSIONS, facetsByDimension } from '../data/facets.js'

/**
 * Results as plain Markdown, for the clipboard.
 *
 * Until now the only way to keep a result was a screenshot. A text version
 * can be pasted into a note, a message, or the next run's comparison, and it
 * is also the honest record: the same numbers the screen shows, in the same
 * order, with the same labels on what is estimated. Deterministic — same
 * input, same text — and no DOM.
 */

const DIMENSION_LABEL = {
  interests: 'Interests', values: 'Values', aptitudes: 'Aptitudes', context: 'Context',
}
const ordinalSuffix = n => {
  const v = n % 100
  return ['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'
}
const r = n => Math.round(n)

/**
 * @param {object} results
 * @param {Record<string, number>} results.profile
 * @param {{ flat: string[], whollyFlat: boolean, alsoTied: {key: string}[] }} results.summary
 * @param {{ match, reasons, rank, tied }[]} results.cards   as Results.jsx builds them
 * @param {{ code, message }[]} [results.flags]              response-quality flags
 * @param {string} [results.date]                            ISO date, defaults to today
 * @param {Record<string, string>} [results.industryNames]   key -> name, for alsoTied
 */
export function toMarkdown({ profile, summary, cards, flags = [], date, industryNames = {} }) {
  const lines = []
  const day = date ?? new Date().toISOString().slice(0, 10)

  lines.push(`# Lodestar results — ${day}`, '')
  lines.push('A self-report snapshot, not a verdict. A shortlist to investigate, built from how you answered.', '')

  if (flags.length) {
    lines.push('## Treat this run as a draft', '')
    for (const f of flags) lines.push(`- ${f.message}`)
    lines.push('')
  }

  if (summary.whollyFlat) {
    lines.push('## Shortlist', '', 'No ranking: every dimension came back too even to rank on.', '')
  } else {
    lines.push('## Shortlist', '')
    for (const c of cards) {
      const rank = c.tied ? `Tied for ${c.rank}${ordinalSuffix(c.rank)}` : `${c.rank}${ordinalSuffix(c.rank)}`
      lines.push(`### ${rank} — ${c.match.name} (${r(c.match.fit)}% fit)`, '')
      lines.push(c.match.blurb, '')
      lines.push('Why this fits:')
      for (const reason of c.reasons.positives) {
        const est = reason.authored ? ' _(industry number is an editorial estimate)_' : ''
        lines.push(`- **${reason.label}** — you ${r(reason.score)}, field ${r(reason.target)}.${est}`)
      }
      if (c.reasons.negative) {
        const n = c.reasons.negative
        lines.push(`- Weighs against it: **${n.label}** — you ${r(n.score)}, field ${r(n.target)}.`)
      }
      lines.push('', 'Titles: ' + c.match.titles.map(t => `${t.title} (${t.level})`).join('; '), '')
      lines.push(`First move: ${c.match.firstMove}`, '')
    }
    if (summary.alsoTied?.length) {
      lines.push('Also within a point of the last cards: ' +
        summary.alsoTied.map(e => industryNames[e.key] ?? e.key).join(', ') + '.', '')
    }
    if (summary.flat.length) {
      lines.push(`Flat dimensions (too even to use): ${summary.flat.map(d => DIMENSION_LABEL[d]).join(', ')}.`, '')
    }
  }

  lines.push('## Full profile (0-100)', '')
  for (const d of DIMENSIONS) {
    lines.push(`**${DIMENSION_LABEL[d]}**`)
    for (const f of facetsByDimension(d)) lines.push(`- ${f.label}: ${r(profile[f.key])}`)
    lines.push('')
  }

  lines.push('---', '',
    'Industry vectors derived in part from the O*NET 30.3 Database (USDOL/ETA, CC BY 4.0). ' +
    'Lodestar has modified this information; O*NET has not approved, endorsed, or tested these modifications. ' +
    'Values and schedule-freedom figures per industry are Lodestar editorial estimates.')

  return lines.join('\n')
}

/** Used by tests to check every facet made it into the export. */
export const EXPORTED_FACET_COUNT = FACETS.length
