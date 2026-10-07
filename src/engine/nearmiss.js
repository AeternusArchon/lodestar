import { INDUSTRIES } from '../data/industries.js'
import { FACETS } from '../data/facets.js'
import { WEIGHTS } from './weights.js'
import { centerByDimension, fitOf } from './match.js'

/**
 * "What would change this?" for the industries just below the shortlist.
 *
 * A ranked list says where you landed. It does not say how far away the next
 * option was, or what one honest change in self-view would have put it on
 * the list. The contributions match.js already computes make that answerable
 * without any new modelling: take an industry that just missed, move ONE
 * facet of the profile by a fixed amount in the helpful direction, re-run the
 * same cosine, and report the facet that closes the most of the gap. That
 * turns a verdict into a map — "you are a 15-point shift on Impact away from
 * Social Services" is something a person can test against themselves.
 *
 * The shift is fixed, not fitted: a facet is nudged by SHIFT points and
 * that's it. Searching for the minimum shift that exactly reaches the
 * threshold would print "11.3 points on Pace", which is false precision
 * about a two-item facet. Fifteen is roughly one scale step on a five-item
 * facet and half a step on a two-item one — the size of an ordinary
 * change of mind.
 */
export const SHIFT = 15
export const NEAR_MISS_COUNT = 3

const INDUSTRY_BY_KEY = Object.fromEntries(INDUSTRIES.map(i => [i.key, i]))

function clamp(v) { return Math.max(0, Math.min(100, v)) }

/**
 * For one industry, the single-facet shift of SHIFT points that raises its
 * fit the most. Returns { facet, label, direction, from, to, fit, newFit }.
 */
export function bestShiftFor(profile, industryKey, weights = WEIGHTS) {
  const industry = INDUSTRY_BY_KEY[industryKey]
  const target = centerByDimension(industry.vector)
  const base = fitOf(centerByDimension(profile), target, weights).fit

  let best = null
  for (const facet of FACETS) {
    for (const direction of [1, -1]) {
      const shifted = { ...profile, [facet.key]: clamp(profile[facet.key] + direction * SHIFT) }
      if (shifted[facet.key] === profile[facet.key]) continue // already at the bound
      const newFit = fitOf(centerByDimension(shifted), target, weights).fit
      if (!best || newFit > best.newFit) {
        best = {
          facet: facet.key,
          label: facet.label,
          direction,
          from: profile[facet.key],
          to: shifted[facet.key],
          fit: base,
          newFit,
        }
      }
    }
  }
  return best
}

/**
 * The next NEAR_MISS_COUNT industries after the shortlist, each with the
 * shift that helps it most and whether that shift would have reached the
 * lowest fit currently on the shortlist. `ranked` and `shortlist` are the
 * outputs of matchIndustries and summarise respectively.
 */
export function nearMisses(profile, ranked, shortlist, weights = WEIGHTS) {
  if (shortlist.length === 0) return []
  const carded = new Set(shortlist.map(e => e.key))
  const threshold = Math.min(...shortlist.map(e => e.fit))

  return ranked
    .filter(e => !carded.has(e.key))
    .slice(0, NEAR_MISS_COUNT)
    .map(entry => {
      const shift = bestShiftFor(profile, entry.key, weights)
      return {
        key: entry.key,
        name: entry.name,
        fit: entry.fit,
        gap: threshold - entry.fit,
        shift,
        reaches: shift ? shift.newFit >= threshold : false,
      }
    })
}
