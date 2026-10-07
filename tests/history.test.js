import { describe, it, expect } from 'vitest'
import {
  diffProfiles, diffShortlists, appendRun, previousRun, sanitiseRuns,
  STABLE_DELTA, BIG_MOVE_DELTA, MAX_RUNS,
} from '../src/engine/history.js'
import { FACETS } from '../src/data/facets.js'

const flat = v => Object.fromEntries(FACETS.map(f => [f.key, v]))
const run = (id, profile = flat(50), shortlist = ['a', 'b']) => ({ id, date: '2026-10-07', profile, shortlist })

describe('diffProfiles', () => {
  it('calls every facet stable when nothing moved', () => {
    const d = diffProfiles(flat(50), flat(50))
    expect(d.stable).toHaveLength(FACETS.length)
    expect(d.moved).toHaveLength(0)
    expect(d.big).toHaveLength(0)
  })

  it('separates stable, moved, and big movers by the documented thresholds', () => {
    const prev = flat(50)
    const cur = { ...prev, realistic: 50 + STABLE_DELTA, income: 50 + BIG_MOVE_DELTA, pace: 50 - 5 }
    const d = diffProfiles(cur, prev)
    expect(d.moved.map(m => m.key).sort()).toEqual(['income', 'realistic'])
    expect(d.big.map(m => m.key)).toEqual(['income'])
    expect(d.stable.map(s => s.key)).toContain('pace')
  })

  it('orders movers by absolute size and signs the delta as current minus previous', () => {
    const prev = flat(50)
    const cur = { ...prev, realistic: 80, income: 25 }
    const d = diffProfiles(cur, prev)
    expect(d.moved[0].key).toBe('realistic')
    expect(d.moved[0].delta).toBe(30)
    expect(d.moved[1].delta).toBe(-25)
  })
})

describe('diffShortlists', () => {
  it('reports kept, added, and dropped keys', () => {
    const d = diffShortlists(['a', 'c', 'd'], ['a', 'b'])
    expect(d.kept).toEqual(['a'])
    expect(d.added).toEqual(['c', 'd'])
    expect(d.dropped).toEqual(['b'])
  })
})

describe('appendRun / previousRun', () => {
  it('appends newest last and caps the history', () => {
    let runs = []
    for (let i = 0; i < MAX_RUNS + 3; i++) runs = appendRun(runs, run(`r${i}`))
    expect(runs).toHaveLength(MAX_RUNS)
    expect(runs[runs.length - 1].id).toBe(`r${MAX_RUNS + 2}`)
    expect(runs[0].id).toBe('r3')
  })

  it('replaces a run with the same id instead of duplicating it', () => {
    let runs = appendRun([], run('same', flat(10)))
    runs = appendRun(runs, run('same', flat(90)))
    expect(runs).toHaveLength(1)
    expect(runs[0].profile.realistic).toBe(90)
  })

  it('returns the most recent run other than the current one', () => {
    const runs = [run('a'), run('b'), run('c')]
    expect(previousRun(runs, 'c').id).toBe('b')
    expect(previousRun(runs, 'zzz').id).toBe('c')
    expect(previousRun([run('only')], 'only')).toBeNull()
    expect(previousRun(null, 'x')).toBeNull()
  })
})

describe('sanitiseRuns', () => {
  it('drops anything that is not a complete, well-typed run', () => {
    const good = run('ok')
    const bad = [
      null, 'string', { id: 1 }, { ...good, profile: { realistic: 5 } },
      { ...good, profile: { ...good.profile, income: 'high' } },
      { ...good, shortlist: 'a' },
    ]
    expect(sanitiseRuns([good, ...bad])).toEqual([good])
    expect(sanitiseRuns('nope')).toEqual([])
    expect(sanitiseRuns(undefined)).toEqual([])
  })
})
