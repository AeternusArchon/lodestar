import { describe, it, expect } from 'vitest'
import { flatDimensions, isWhollyFlat, groupNearTies, summarise, SHORTLIST_CAP } from '../src/engine/profile.js'
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
    expect(out.alsoTied).toHaveLength(0)
  })

  it('flags a wholly flat profile', () => {
    expect(summarise(flat(50), ranked([60, 55, 50])).whollyFlat).toBe(true)
  })
})

// Before the cap, summarise added whole tie groups until the shortlist reached
// five with no truncation inside a group. Over 2,000 synthetic respondents that
// produced eight or more full cards 27% of the time, with a maximum of 14 —
// against spec §1's promise of five, "six or seven when near-tie grouping
// merges ranks".
describe('the shortlist cap', () => {
  // Four clear leaders, then a ten-way tie the fifth slot opens the door to:
  // 4 + 10 = 14 entries under the old behaviour.
  const runaway = ranked([90, 80, 70, 60, ...Array(10).fill(50)])

  it('never cards more than seven industries', () => {
    expect(SHORTLIST_CAP).toBe(7)
    expect(summarise(flat(50), runaway).shortlist).toHaveLength(7)
  })

  it('names the overflow inline instead of dropping it', () => {
    const out = summarise(flat(50), runaway)
    expect(out.alsoTied).toHaveLength(7)
    // Nothing is lost: carded plus named accounts for every entry the old
    // whole-group logic would have shown.
    const seen = [...out.shortlist, ...out.alsoTied].map(r => r.key)
    expect(new Set(seen).size).toBe(14)
    expect(out.shortlist.some(r => out.alsoTied.includes(r))).toBe(false)
  })

  it('draws the overflow only from a tie group that is also carded', () => {
    const out = summarise(flat(50), runaway)
    const groupOf = key => out.groups.find(g => g.members.some(m => m.key === key))
    for (const entry of out.alsoTied) {
      const group = groupOf(entry.key)
      expect(group.members.length).toBeGreaterThan(1)
      // At least one member of the same tie group has a card, which is what
      // makes "also within a point of these" a true sentence.
      expect(out.shortlist.some(r => group.members.includes(r))).toBe(true)
    }
  })

  it('leaves an uncapped shortlist untouched', () => {
    const out = summarise(flat(50), ranked([90, 80, 70, 60, 50, 20]))
    expect(out.shortlist).toHaveLength(5)
    expect(out.alsoTied).toHaveLength(0)
  })
})
