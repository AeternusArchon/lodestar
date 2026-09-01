import { FACETS, DIMENSIONS } from '../data/facets.js'

/** A dimension whose six facets span less than this carries no usable signal. */
export const FLAT_RANGE_THRESHOLD = 15
/** Fits closer than this are reported as tied rather than ordered. */
export const TIE_THRESHOLD = 3
const SHORTLIST_SIZE = 5

/**
 * The hard ceiling on how many industries get a full card.
 *
 * Whole tie groups are taken until the shortlist reaches SHORTLIST_SIZE, so a
 * tie spanning the cutoff shows all its members rather than being severed
 * mid-group (spec §3.6). Without a ceiling that had no upper bound: over 2,000
 * synthetic respondents the shortlist came out at 5 thirty per cent of the
 * time, 6 twenty-four, 7 nineteen, and eight or more twenty-seven, with a
 * maximum of fourteen. Spec §1 promises "the five best-fitting industries —
 * six or seven when near-tie grouping merges ranks", and fourteen full cards,
 * each with four reasons, three titles and a first move, is precisely the
 * overwhelm this product exists to prevent.
 *
 * Anything past the ceiling is returned as `alsoTied` rather than dropped.
 * Truncating a tie group without saying so would contradict §3.6's near-tie
 * honesty rule as squarely as ordering a tie would — the caller names those
 * industries inline instead of giving them cards.
 */
export const SHORTLIST_CAP = 7

export function flatDimensions(profile) {
  return DIMENSIONS.filter(d => {
    const values = FACETS.filter(f => f.dimension === d).map(f => profile[f.key])
    return Math.max(...values) - Math.min(...values) < FLAT_RANGE_THRESHOLD
  })
}

export function isWhollyFlat(profile) {
  return flatDimensions(profile).length === DIMENSIONS.length
}

export function groupNearTies(ranked) {
  const groups = []
  for (const entry of ranked) {
    const current = groups[groups.length - 1]
    if (current && current.members[0].fit - entry.fit <= TIE_THRESHOLD) {
      current.members.push(entry)
    } else {
      groups.push({ rank: groups.length + 1, members: [entry] })
    }
  }
  return groups
}

export function summarise(profile, ranked) {
  const groups = groupNearTies(ranked)

  // Take whole groups until we have at least five entries, so a tie spanning the
  // cutoff shows all its members rather than being severed mid-group.
  const selected = []
  for (const group of groups) {
    if (selected.length >= SHORTLIST_SIZE) break
    selected.push(...group.members)
  }

  // Then cap the carded set. Any overflow is necessarily the tail of the last
  // group added — the loop above only continues while the running length is
  // under five, so the first four positions can never come from it — which is
  // what makes it truthful for the caller to introduce these as tied with the
  // cards above rather than as a separate, weaker tier.
  return {
    flat: flatDimensions(profile),
    whollyFlat: isWhollyFlat(profile),
    groups,
    shortlist: selected.slice(0, SHORTLIST_CAP),
    alsoTied: selected.slice(SHORTLIST_CAP),
  }
}
