import { describe, it, expect } from 'vitest'
import { flatDimensions, isWhollyFlat, groupNearTies, summarise } from '../src/engine/profile.js'
import { FACETS } from '../src/data/facets.js'

const flat = v => Object.fromEntries(FACETS.map(f => [f.key, v]))
const ranked = fits => fits.map((fit, i) => ({ key: `i${i}`, name: `I${i}`, fit, contributions: {} }))

describe('flat detection', () => {
  it('calls a uniform profile flat in all four dimensions', () => {
    expect(flatDimensions(flat(50))).toHaveLength(4)
    expect(isWhollyFlat(flat(50))).toBe(true)
  })

  it('does not call a spread dimension flat', () => {
    const p = flat(50)
    p.realistic = 10; p.investigative = 90
    expect(flatDimensions(p)).not.toContain('interests')
    expect(isWhollyFlat(p)).toBe(false)
  })

  it('uses a 15-point range threshold', () => {
    const narrow = flat(50); narrow.realistic = 44   // range 6
    expect(flatDimensions(narrow)).toContain('interests')
    const wide = flat(50); wide.realistic = 30       // range 20
    expect(flatDimensions(wide)).not.toContain('interests')
  })
})

describe('near-tie grouping', () => {
  it('groups fits within 3 points at a shared rank', () => {
    const groups = groupNearTies(ranked([80, 78.5, 60]))
    expect(groups[0].members).toHaveLength(2)
    expect(groups[0].rank).toBe(1)
    expect(groups[1].members).toHaveLength(1)
    expect(groups[1].rank).toBe(2)
  })

  it('does not group fits more than 3 points apart', () => {
    expect(groupNearTies(ranked([80, 70, 60]))).toHaveLength(3)
  })
})

describe('summarise', () => {
  it('keeps a tie group intact when it straddles the top-five cutoff', () => {
    const out = summarise(flat(50), ranked([90, 80, 70, 60, 50, 49, 20]))
    expect(out.shortlist.length).toBeGreaterThanOrEqual(6)
    expect(out.shortlist.map(r => r.fit)).toContain(49)
  })

  it('flags a wholly flat profile', () => {
    expect(summarise(flat(50), ranked([60, 55, 50])).whollyFlat).toBe(true)
  })
})
