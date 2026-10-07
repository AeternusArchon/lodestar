import data from '../data/occupations.json'
import { FACETS, DIMENSIONS } from '../data/facets.js'
import { WEIGHTS } from './weights.js'

/**
 * Ranking the occupations INSIDE one industry against a profile.
 *
 * Occupation vectors carry only the 17 O*NET-derived facets — there is no
 * per-occupation source for the six Values or for schedule freedom, and
 * inventing 140 x 7 editorial numbers would be worse than leaving them out.
 * So the comparison here runs over the facets both sides actually have,
 * centred within each dimension over that same subset, with the usual
 * dimension weights. It is the industry match in miniature with the Values
 * dimension removed, and the UI says so.
 *
 * When the vectors are absent (the O*NET release was not on disk when
 * occupations.json was generated), `rankOccupations` returns the roster in
 * authoring order with `fit: null` and `ranked: false`, and the UI lists the
 * occupations without pretending to order them.
 */

export const OCCUPATIONS = data.occupations
export const OCCUPATION_FACETS = data.facets ?? data.meta.facets

const dimensionOf = Object.fromEntries(FACETS.map(f => [f.key, f.dimension]))

function centerSubset(vector, keys) {
  const out = {}
  for (const d of DIMENSIONS) {
    const inDim = keys.filter(k => dimensionOf[k] === d)
    if (inDim.length === 0) continue
    const mean = inDim.reduce((a, k) => a + vector[k], 0) / inDim.length
    for (const k of inDim) out[k] = vector[k] - mean
  }
  return out
}

/** Weighted cosine over a facet subset, on 0-100. Exported for tests. */
export function subsetFit(profile, vector, keys, weights = WEIGHTS) {
  const u = centerSubset(profile, keys)
  const t = centerSubset(vector, keys)
  let num = 0, un = 0, tn = 0
  for (const k of keys) {
    const w = weights[dimensionOf[k]]
    num += w * u[k] * t[k]
    un += w * u[k] ** 2
    tn += w * t[k] ** 2
  }
  const denom = Math.sqrt(un) * Math.sqrt(tn)
  const cosine = denom === 0 ? 0 : num / denom
  return Math.min(100, Math.max(0, ((cosine + 1) / 2) * 100))
}

export function hasVectors(industryKey) {
  return (OCCUPATIONS[industryKey] ?? []).some(o => o.vector)
}

export function rankOccupations(industryKey, profile, weights = WEIGHTS) {
  const roster = OCCUPATIONS[industryKey] ?? []
  if (!hasVectors(industryKey)) {
    return { ranked: false, occupations: roster.map(o => ({ ...o, fit: null })) }
  }
  const keys = OCCUPATION_FACETS.filter(k => roster.every(o => !o.vector || Number.isFinite(o.vector[k])))
  const scored = roster
    .filter(o => o.vector)
    .map(o => ({ ...o, fit: subsetFit(profile, o.vector, keys, weights) }))
    .sort((a, b) => b.fit - a.fit)
  return { ranked: true, occupations: scored, facetsUsed: keys }
}
