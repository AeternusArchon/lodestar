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
})
