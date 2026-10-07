import { QUESTIONS } from '../data/questions.js'
import { FACETS } from '../data/facets.js'

/**
 * How much to trust each facet's number.
 *
 * The item bank loads 5 items on each interest, 3 on each value, and only 2
 * on each aptitude and context facet (see questions.js). A two-item facet is
 * a coin toss with a second coin: one answer read differently moves the score
 * 25 points. Yet the readout prints 48 and 52 in the same mono type, and a
 * reader will see a difference where there is only noise. This module gives
 * every facet a precision level from its item count, and a `spread` from how
 * far apart the person's own answers on that facet landed once reverse-keyed
 * items are flipped — two items that disagree with each other are a
 * reason to trust the mean even less.
 *
 * Levels (by item count):
 *   firm   5 items — the interests, built on the RIASEC short form
 *   fair   3 items — the values
 *   rough  2 items — the aptitudes and context
 */
export const LEVEL_BY_ITEMS = { 5: 'firm', 3: 'fair', 2: 'rough' }
/** Signed-answer spread (on the 1-5 scale) at or above which items disagree. */
export const DISAGREE_SPREAD = 2

function signed(q, answers) {
  const r = answers[q.id]
  return q.dir === 1 ? r : 6 - r
}

/**
 * Returns Record<facetKey, { items, level, spread, disagree }>.
 * Items without an answer are skipped, so this works mid-test too.
 */
export function facetPrecision(answers) {
  const out = {}
  for (const facet of FACETS) {
    const items = QUESTIONS.filter(q => q.facet === facet.key && answers[q.id] !== undefined)
    const values = items.map(q => signed(q, answers))
    const spread = values.length > 1 ? Math.max(...values) - Math.min(...values) : 0
    const total = QUESTIONS.filter(q => q.facet === facet.key).length
    out[facet.key] = {
      items: total,
      answered: items.length,
      level: LEVEL_BY_ITEMS[total] ?? (total >= 5 ? 'firm' : total >= 3 ? 'fair' : 'rough'),
      spread,
      disagree: spread >= DISAGREE_SPREAD,
    }
  }
  return out
}

export const LEVEL_LABEL = {
  firm: 'Firm — five statements',
  fair: 'Fair — three statements',
  rough: 'Rough — two statements',
}
