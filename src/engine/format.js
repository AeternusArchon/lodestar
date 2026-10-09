import { FACETS, DIMENSIONS, facetsByDimension } from '../data/facets.js'

/**
 * Results as plain Markdown, for the clipboard.
 *
 * Until now the only way to keep a result was a screenshot. A text version
 * can be pasted into a note, a message, or the next run's comparison, and it
 * is also the honest record: the same numbers the screen shows, in the same
 * order, with the same labels on what is estimated. Deterministic — same
 * input, same text — and no DOM.
 *
 * Localisation stays outside the engine: the sentences below are the English
 * defaults, and a caller that has a locale passes its own `strings` (the
 * results screen builds them from the `export.*` keys), plus facet and
 * dimension labels. Anything a caller leaves out falls back to English, so
 * the engine never needs to know which languages exist.
 */

const DEFAULT_DIMENSION_LABELS = {
  interests: 'Interests', values: 'Values', aptitudes: 'Aptitudes', context: 'Context',
}

/** `{name}` placeholders, filled the same way the UI's t() fills them. */
export const DEFAULT_STRINGS = {
  heading: 'Lodestar results — {date}',
  scope: 'A self-report snapshot, not a verdict. A shortlist to investigate, built from how you answered.',
  draft: 'Treat this run as a draft',
  shortlist: 'Shortlist',
  noRanking: 'No ranking: every dimension came back too even to rank on.',
  tied: 'Tied for {rank}',
  fit: '{name} ({fit}% fit)',
  why: 'Why this fits:',
  you: 'you {score}, field {target}.',
  estimate: '(industry number is an editorial estimate)',
  against: 'Weighs against it: ',
  titles: 'Titles: ',
  firstMove: 'First move: ',
  alsoTied: 'Also within a point of the last cards: {names}.',
  flat: 'Flat dimensions (too even to use): {dims}.',
  profile: 'Full profile (0-100)',
  attribution:
    'Industry vectors derived in part from the O*NET 30.3 Database (USDOL/ETA, CC BY 4.0). ' +
    'Lodestar has modified this information; O*NET has not approved, endorsed, or tested these modifications. ' +
    'Values and schedule-freedom figures per industry are Lodestar editorial estimates.',
  // Title seniority, keyed by industries.js `level`. Identity in English.
  levels: { entry: 'entry', mid: 'mid', senior: 'senior' },
}

function englishOrdinal(n) {
  const v = n % 100
  const suffix = ['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'
  return `${n}${suffix}`
}

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k])))
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
 * @param {Partial<typeof DEFAULT_STRINGS>} [results.strings] sentences, defaulting to English
 * @param {Record<string, string>} [results.facetLabels]     facet key -> label
 * @param {Record<string, string>} [results.dimensionLabels] dimension -> label
 * @param {(n: number) => string} [results.ordinal]          rank -> "1st", "1.º", …
 */
export function toMarkdown({
  profile, summary, cards, flags = [], date, industryNames = {},
  strings = {}, facetLabels = {}, dimensionLabels = {}, ordinal = englishOrdinal,
}) {
  const s = { ...DEFAULT_STRINGS, ...strings, levels: { ...DEFAULT_STRINGS.levels, ...strings.levels } }
  const dimLabel = d => dimensionLabels[d] ?? DEFAULT_DIMENSION_LABELS[d]
  const facetLabel = (key, fallback) => facetLabels[key] ?? fallback
  const lines = []
  const day = date ?? new Date().toISOString().slice(0, 10)

  lines.push(`# ${fill(s.heading, { date: day })}`, '')
  lines.push(s.scope, '')

  if (flags.length) {
    lines.push(`## ${s.draft}`, '')
    for (const f of flags) lines.push(`- ${f.message}`)
    lines.push('')
  }

  if (summary.whollyFlat) {
    lines.push(`## ${s.shortlist}`, '', s.noRanking, '')
  } else {
    lines.push(`## ${s.shortlist}`, '')
    for (const c of cards) {
      const rank = c.tied ? fill(s.tied, { rank: ordinal(c.rank) }) : ordinal(c.rank)
      lines.push(`### ${rank} — ${fill(s.fit, { name: c.match.name, fit: r(c.match.fit) })}`, '')
      lines.push(c.match.blurb, '')
      lines.push(s.why)
      for (const reason of c.reasons.positives) {
        const est = reason.authored ? ` _${s.estimate}_` : ''
        const label = facetLabel(reason.facet, reason.label)
        lines.push(`- **${label}** — ${fill(s.you, { score: r(reason.score), target: r(reason.target) })}${est}`)
      }
      if (c.reasons.negative) {
        const n = c.reasons.negative
        const label = facetLabel(n.facet, n.label)
        lines.push(`- ${s.against}**${label}** — ${fill(s.you, { score: r(n.score), target: r(n.target) })}`)
      }
      lines.push('', s.titles + c.match.titles.map(t => `${t.title} (${s.levels[t.level] ?? t.level})`).join('; '), '')
      lines.push(`${s.firstMove}${c.match.firstMove}`, '')
    }
    if (summary.alsoTied?.length) {
      lines.push(fill(s.alsoTied, { names: summary.alsoTied.map(e => industryNames[e.key] ?? e.key).join(', ') }), '')
    }
    if (summary.flat.length) {
      lines.push(fill(s.flat, { dims: summary.flat.map(dimLabel).join(', ') }), '')
    }
  }

  lines.push(`## ${s.profile}`, '')
  for (const d of DIMENSIONS) {
    lines.push(`**${dimLabel(d)}**`)
    for (const f of facetsByDimension(d)) lines.push(`- ${facetLabel(f.key, f.label)}: ${r(profile[f.key])}`)
    lines.push('')
  }

  lines.push('---', '', s.attribution)

  return lines.join('\n')
}

/** Used by tests to check every facet made it into the export. */
export const EXPORTED_FACET_COUNT = FACETS.length
