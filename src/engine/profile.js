import { FACETS, DIMENSIONS } from '../data/facets.js'

/** A dimension whose six facets span less than this carries no usable signal. */
export const FLAT_RANGE_THRESHOLD = 15
/** Fits closer than this are reported as tied rather than ordered. */
export const TIE_THRESHOLD = 3
const SHORTLIST_SIZE = 5

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
  const shortlist = []
  for (const group of groups) {
    if (shortlist.length >= SHORTLIST_SIZE) break
    shortlist.push(...group.members)
  }

  return {
    flat: flatDimensions(profile),
    whollyFlat: isWhollyFlat(profile),
    groups,
    shortlist,
  }
}
