import { DIMENSIONS } from '../data/facets.js'

/**
 * How much each dimension counts toward the final industry ranking.
 *
 * Recommended default, and the reasoning:
 *   values    0.35  People rarely quit because the subject matter stopped being
 *                   interesting. They quit because the autonomy, stability, or
 *                   income did not match what they needed.
 *   interests 0.30  The best-validated construct here, but it predicts enjoyment
 *                   of a task, not tolerance of a career.
 *   context   0.20  The daily physical and social reality. Cheap to measure and
 *                   surprisingly decisive.
 *   aptitudes 0.15  Deliberately lowest. These are self-rated, and a person with
 *                   no career direction is the person least able to rate their own
 *                   aptitudes against a professional baseline.
 *
 * Change these freely — the only hard rule is that they sum to 1.
 */
export const WEIGHTS = {
  interests: 0.30,
  values: 0.35,
  aptitudes: 0.15,
  context: 0.20,
}

export function assertWeightsValid(w) {
  const keys = Object.keys(w).sort()
  const expected = [...DIMENSIONS].sort()
  if (keys.length !== expected.length || keys.some((k, i) => k !== expected[i])) {
    throw new Error(`weights must cover exactly the four dimension keys, got: ${keys.join(', ')}`)
  }
  const total = Object.values(w).reduce((a, b) => a + b, 0)
  if (Math.abs(total - 1) > 1e-9) {
    throw new Error(`dimension weights must sum to 1, got ${total}`)
  }
}

assertWeightsValid(WEIGHTS)
