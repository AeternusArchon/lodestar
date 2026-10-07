import { FACETS } from '../data/facets.js'

/**
 * Comparing one run against another.
 *
 * A single self-report run cannot tell signal from mood. Two runs can: the
 * facets that land in the same place a month apart are the ones worth
 * trusting, and the ones that swing twenty points are the ones to discount
 * however confidently either run printed them. This module is the pure half
 * of that — given two profiles and two shortlists, say what held and what
 * moved. Storage (localStorage, in App.jsx) and rendering (Results.jsx) live
 * elsewhere; nothing here touches the DOM.
 */

/** A facet that moved less than this between runs is called stable. */
export const STABLE_DELTA = 10
/** A facet that moved at least this much is called a big mover. */
export const BIG_MOVE_DELTA = 20
/** How many completed runs to keep. Oldest are dropped first. */
export const MAX_RUNS = 10

/**
 * Per-facet deltas (current minus previous), plus the three partitions the
 * UI cares about: stable, moved (>= STABLE_DELTA), and big movers.
 */
export function diffProfiles(current, previous) {
  const deltas = FACETS.map(f => ({
    key: f.key,
    label: f.label,
    dimension: f.dimension,
    from: previous[f.key],
    to: current[f.key],
    delta: current[f.key] - previous[f.key],
  }))
  const stable = deltas.filter(d => Math.abs(d.delta) < STABLE_DELTA)
  const moved = deltas.filter(d => Math.abs(d.delta) >= STABLE_DELTA)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  const big = moved.filter(d => Math.abs(d.delta) >= BIG_MOVE_DELTA)
  return { deltas, stable, moved, big }
}

/**
 * Shortlists are arrays of industry keys in rank order. Reports which stayed,
 * which are new this time, and which dropped off.
 */
export function diffShortlists(current, previous) {
  const prev = new Set(previous)
  const cur = new Set(current)
  return {
    kept: current.filter(k => prev.has(k)),
    added: current.filter(k => !prev.has(k)),
    dropped: previous.filter(k => !cur.has(k)),
  }
}

/**
 * Append a completed run to a history array, newest last, capped at
 * MAX_RUNS. Pure: returns a new array. A run is { id, date, profile,
 * shortlist }. Re-appending an id already present replaces it rather than
 * duplicating — a results screen re-rendered after a reload must not count
 * as a second run.
 */
export function appendRun(runs, run) {
  const without = (runs ?? []).filter(r => r.id !== run.id)
  return [...without, run].slice(-MAX_RUNS)
}

/** The most recent run that is not `excludeId`, or null. */
export function previousRun(runs, excludeId) {
  const candidates = (runs ?? []).filter(r => r.id !== excludeId)
  return candidates.length ? candidates[candidates.length - 1] : null
}

/**
 * A stored history must be an array of runs whose profiles carry a finite
 * number for every facet. Anything else is dropped entry by entry; a
 * half-trusted history is worse than none.
 */
export function sanitiseRuns(value) {
  if (!Array.isArray(value)) return []
  return value.filter(r =>
    r && typeof r === 'object' &&
    typeof r.id === 'string' &&
    typeof r.date === 'string' &&
    r.profile && typeof r.profile === 'object' &&
    FACETS.every(f => Number.isFinite(r.profile[f.key])) &&
    Array.isArray(r.shortlist) && r.shortlist.every(k => typeof k === 'string')
  ).slice(-MAX_RUNS)
}
