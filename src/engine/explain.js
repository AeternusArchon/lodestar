import { FACETS, facetsByDimension } from '../data/facets.js'
import { QUESTIONS } from '../data/questions.js'
import { INDUSTRIES } from '../data/industries.js'

const facetOf = Object.fromEntries(FACETS.map(f => [f.key, f]))
const VALUE_KEYS = new Set(facetsByDimension('values').map(f => f.key))
const ITEMS_PER_REASON = 2

/** The two items this respondent answered most strongly on a given facet. */
function drivingItems(facetKey, answers) {
  return QUESTIONS
    .filter(q => q.facet === facetKey)
    .map(q => ({ id: q.id, text: q.text, response: answers[q.id],
                 strength: Math.abs((q.dir === 1 ? answers[q.id] : 6 - answers[q.id]) - 3) }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, ITEMS_PER_REASON)
    .map(({ id, text, response }) => ({ id, text, response }))
}

function toReason(facetKey, contribution, profile, industry, answers) {
  const facet = facetOf[facetKey]
  return {
    facet: facetKey,
    label: facet.label,
    blurb: facet.blurb,
    score: profile[facetKey],
    target: industry.vector[facetKey],
    contribution,
    items: drivingItems(facetKey, answers),
    authored: VALUE_KEYS.has(facetKey),
  }
}

export function explainMatch(match, profile, answers, { flat = [] } = {}) {
  const industry = INDUSTRIES.find(i => i.key === match.key)
  const usable = Object.entries(match.contributions)
    .filter(([key]) => !flat.includes(facetOf[key].dimension))
    .sort((a, b) => b[1] - a[1])

  const positives = usable.slice(0, 3)
    .map(([key, c]) => toReason(key, c, profile, industry, answers))

  const worst = usable[usable.length - 1]
  const negative = worst && worst[1] < 0
    ? toReason(worst[0], worst[1], profile, industry, answers)
    : null

  return { positives, negative }
}
