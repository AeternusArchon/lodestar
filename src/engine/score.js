import { QUESTIONS } from '../data/questions.js'
import { FACETS } from '../data/facets.js'

/**
 * Convert a complete answer set into a 24-facet profile.
 *
 * Each response is 1..5. Reverse-keyed items (dir === -1) are flipped to 6 - r so
 * that a high facet score always means "more of this facet", never "agreed more".
 * The facet mean is then rescaled from 1..5 onto 0..100 exactly once, here.
 */
export function scoreAnswers(answers) {
  const missing = QUESTIONS.filter(q => answers[q.id] === undefined).map(q => q.id)
  if (missing.length > 0) {
    throw new Error(`cannot score: ${missing.length} unanswered item(s): ${missing.slice(0, 5).join(', ')}`)
  }

  for (const q of QUESTIONS) {
    const r = answers[q.id]
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      throw new Error(`response for ${q.id} out of range 1..5: ${r}`)
    }
  }

  const profile = {}
  for (const facet of FACETS) {
    const items = QUESTIONS.filter(q => q.facet === facet.key)
    const signed = items.map(q => (q.dir === 1 ? answers[q.id] : 6 - answers[q.id]))
    const mean = signed.reduce((a, b) => a + b, 0) / signed.length
    profile[facet.key] = ((mean - 1) / 4) * 100
  }
  return profile
}
