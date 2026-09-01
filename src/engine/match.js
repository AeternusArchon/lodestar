import { INDUSTRIES } from '../data/industries.js'
import { FACETS, DIMENSIONS } from '../data/facets.js'
import { WEIGHTS, assertWeightsValid } from './weights.js'

/**
 * Subtract each dimension's own mean from its six facets.
 *
 * This is what makes the match read a profile's *shape* rather than its overall
 * elevation. A respondent who marks every value "very important" carries no
 * information in the raw numbers; centring removes the constant and keeps only
 * the relative ordering, which is the part that discriminates.
 */
export function centerByDimension(vector) {
  const out = {}
  for (const d of DIMENSIONS) {
    const keys = FACETS.filter(f => f.dimension === d).map(f => f.key)
    const mean = keys.reduce((a, k) => a + vector[k], 0) / keys.length
    for (const k of keys) out[k] = vector[k] - mean
  }
  return out
}

const weightOf = (facetKey, weights) =>
  weights[FACETS.find(f => f.key === facetKey).dimension]

export function matchIndustries(profile, weights = WEIGHTS) {
  assertWeightsValid(weights)
  const u = centerByDimension(profile)

  return INDUSTRIES
    .map(industry => {
      const t = centerByDimension(industry.vector)
      let numerator = 0, uNorm = 0, tNorm = 0
      const contributions = {}

      for (const facet of FACETS) {
        const w = weightOf(facet.key, weights)
        const term = w * u[facet.key] * t[facet.key]
        contributions[facet.key] = term
        numerator += term
        uNorm += w * u[facet.key] ** 2
        tNorm += w * t[facet.key] ** 2
      }

      const denom = Math.sqrt(uNorm) * Math.sqrt(tNorm)
      const cosine = denom === 0 ? 0 : numerator / denom
      // Clamp to [0, 100]: floating-point sqrt(x)*sqrt(x) does not always exactly
      // reconstruct x, so a near-parallel pair (notably u === t, a self-match) can
      // push cosine fractionally past +-1 and fit fractionally past its documented
      // 0-100 bounds. Do not remove this as redundant — it is load-bearing for
      // exact self-matches, and downstream consumers (e.g. a percentage-width bar)
      // rely on the bound actually holding.
      const fit = Math.min(100, Math.max(0, ((cosine + 1) / 2) * 100))
      return {
        key: industry.key,
        name: industry.name,
        fit,
        contributions,
      }
    })
    .sort((a, b) => b.fit - a.fit)
}
