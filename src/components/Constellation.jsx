import { FACETS, DIMENSIONS } from '../data/facets.js'

const DIMENSION_COLOR = {
  interests: 'var(--brass)',
  values: 'var(--bone)',
  aptitudes: 'var(--slate)',
  context: 'var(--haze)',
}

/**
 * 24 rays from a shared centre, ordered by dimension so each dimension owns a
 * quarter-turn arc. Radius encodes the facet score; unanswered facets sit at the
 * origin, which is what makes the figure grow as the test is taken.
 */
export function pointsFor(profile, answeredFacets, size) {
  const max = size / 2
  return FACETS.map((facet, i) => {
    const angle = (i / FACETS.length) * Math.PI * 2 - Math.PI / 2
    const score = answeredFacets.has(facet.key) ? profile[facet.key] ?? 0 : 0
    const r = (score / 100) * max
    return { facet: facet.key, dimension: facet.dimension, angle,
             x: Math.cos(angle) * r, y: Math.sin(angle) * r }
  })
}

export default function Constellation({ profile, answeredFacets, size = 320, labelled = false }) {
  const pts = pointsFor(profile, answeredFacets, size)
  const half = size / 2
  const path = pts.map(p => `${(p.x + half).toFixed(2)},${(p.y + half).toFixed(2)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" role="img"
         aria-describedby="constellation-desc">
      <title>Your profile across 24 facets</title>
      <desc id="constellation-desc">
        A 24-point star plot. Each ray is one facet; the further the point from the
        centre, the higher that facet scored. The full numeric readout follows below.
      </desc>

      {[0.25, 0.5, 0.75, 1].map(r => (
        <circle key={r} cx={half} cy={half} r={half * r}
                fill="none" stroke="var(--haze)" strokeOpacity="0.18" />
      ))}

      {pts.map(p => (
        <line key={p.facet} x1={half} y1={half}
              x2={half + Math.cos(p.angle) * half} y2={half + Math.sin(p.angle) * half}
              stroke="var(--haze)" strokeOpacity="0.12" />
      ))}

      <polygon points={path} fill="var(--brass)" fillOpacity="0.14"
               stroke="var(--brass)" strokeWidth="1.5"
               style={{ transition: 'all 400ms ease-out' }} />

      {pts.map(p => (
        <circle key={p.facet} cx={p.x + half} cy={p.y + half} r="2.5"
                fill={DIMENSION_COLOR[p.dimension]} />
      ))}

      {labelled && DIMENSIONS.map((d, i) => {
        const a = ((i * 6 + 2.5) / 24) * Math.PI * 2 - Math.PI / 2
        return (
          <text key={d} x={half + Math.cos(a) * (half * 0.86)} y={half + Math.sin(a) * (half * 0.86)}
                textAnchor="middle" className="font-mono uppercase"
                fontSize="9" letterSpacing="1.6" fill="var(--haze)">{d}</text>
        )
      })}
    </svg>
  )
}
