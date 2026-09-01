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

/**
 * Fix round 1, Finding 1 (Critical): the weighted cosine in match.js centers
 * each dimension on its own mean, so a facet where BOTH the respondent and
 * the industry sit below their dimension's mean multiplies two negatives
 * into a positive contribution — "neither of us cares about this" is real
 * signal, not noise. But every facets.js blurb was written for the HIGH pole
 * only, so that genuine low-low match rendered a sentence asserting the
 * opposite of what the respondent actually answered (a 0-of-100 "Risk
 * tolerance" reason quoting the respondent's own risk-averse answers,
 * directly under a sentence telling them they like to gamble). The blurb is
 * always a claim about the PERSON, not the industry, so it must be chosen
 * from the respondent's own score — never the industry's, and never the
 * sign of the contribution itself, which conflates two different questions
 * (which pole is this person? vs. did this facet help or hurt the fit?).
 */
function blurbFor(facet, score) {
  return score >= 50 ? facet.blurb : facet.blurbLow
}

function toReason(facetKey, contribution, profile, industry, answers) {
  const facet = facetOf[facetKey]
  const score = profile[facetKey]
  return {
    facet: facetKey,
    label: facet.label,
    blurb: blurbFor(facet, score),
    score,
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
