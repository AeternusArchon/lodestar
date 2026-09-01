import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Constellation from '../src/components/Constellation.jsx'
import { FACETS } from '../src/data/facets.js'
import { pointsFor } from '../src/components/Constellation.jsx'

const full = Object.fromEntries(FACETS.map(f => [f.key, 50]))
const allKeys = new Set(FACETS.map(f => f.key))

describe('pointsFor', () => {
  it('returns one point per facet', () => {
    expect(pointsFor(full, allKeys, 100)).toHaveLength(24)
  })

  it('places unanswered facets at the origin', () => {
    const [p] = pointsFor(full, new Set(), 100)
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(0, 6)
  })

  it('scales radius with the facet score', () => {
    const near = pointsFor({ ...full, realistic: 10 }, allKeys, 100)[0]
    const far = pointsFor({ ...full, realistic: 90 }, allKeys, 100)[0]
    expect(Math.hypot(far.x, far.y)).toBeGreaterThan(Math.hypot(near.x, near.y))
  })
})

describe('<Constellation>', () => {
  it('renders an accessible svg', () => {
    const html = renderToStaticMarkup(
      <Constellation profile={full} answeredFacets={allKeys} size={300} />
    )
    expect(html).toContain('<svg')
    expect(html).toMatch(/role="img"/)
    expect(html).toMatch(/<title>/)
  })

  // Task 11's instrument rail renders <Constellation size={180}> without passing
  // `labelled`, so it defaults to false — that is the state a viewer looks at
  // for the whole test, and colour must not be the only way to tell the four
  // dimensions apart there. The boundary marks are the non-colour cue, so they
  // must render with labelled left at its default (false), not just when true.
  it('renders a non-colour boundary mark for each of the four dimensions even when unlabelled', () => {
    const html = renderToStaticMarkup(
      <Constellation profile={full} answeredFacets={allKeys} size={300} labelled={false} />
    )
    const marks = html.match(/data-role="dimension-boundary"/g) || []
    expect(marks).toHaveLength(4)
  })

  it('describes the four-arc structure and dimension order for screen readers', () => {
    const html = renderToStaticMarkup(
      <Constellation profile={full} answeredFacets={allKeys} size={300} />
    )
    const descMatch = html.match(/<desc[^>]*>([\s\S]*?)<\/desc>/)
    expect(descMatch).not.toBeNull()
    const desc = descMatch[1]
    expect(desc).toMatch(/four/i)
    for (const dimension of ['interests', 'values', 'aptitudes', 'context']) {
      expect(desc).toContain(dimension)
    }
  })
})
