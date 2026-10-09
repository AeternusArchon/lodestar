import { FACETS, DIMENSIONS } from '../data/facets.js'
import { useLocale } from '../i18n/index.jsx'

const DIMENSION_COLOR = {
  interests: 'var(--brass)',
  values: 'var(--bone)',
  aptitudes: 'var(--slate)',
  context: 'var(--haze)',
}

// Facets per dimension, derived rather than hardcoded so the boundary and label
// maths stay correct if FACETS or DIMENSIONS ever change size.
const PER_DIMENSION = FACETS.length / DIMENSIONS.length

// Angle (in pointsFor's coordinate space) of the seam between two consecutive
// dimension arcs, i.e. halfway between the last ray of one dimension and the
// first ray of the next. There are as many seams as dimensions.
function boundaryAngle(dimensionIndex) {
  const seamIndex = dimensionIndex * PER_DIMENSION - 0.5
  return (seamIndex / FACETS.length) * Math.PI * 2 - Math.PI / 2
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

/*
 * The plot itself always spans `size`, with the rim at radius size/2; the
 * viewBox is padded around it so the rim stroke and a facet scored 100 are
 * not shaved off at the edge of a full-bleed box, and so the labelled
 * version can set the four dimension names OUTSIDE the rim, clear of the
 * polygon, instead of on top of the data.
 */
export default function Constellation({ profile, answeredFacets, size = 320, labelled = false }) {
  const { t } = useLocale()
  const pts = pointsFor(profile, answeredFacets, size)
  const half = size / 2
  const path = pts.map(p => `${(p.x + half).toFixed(2)},${(p.y + half).toFixed(2)}`).join(' ')
  const pad = labelled ? size * 0.06 : 4
  const fontSize = size * 0.032

  return (
    <svg viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`} width="100%" height="100%" role="img"
         aria-describedby="constellation-desc">
      <title>{t('constellation.title')}</title>
      <desc id="constellation-desc">{t('constellation.desc')}</desc>

      {[0.25, 0.5, 0.75, 1].map(r => (
        <circle key={r} cx={half} cy={half} r={half * r}
                fill="none" stroke="var(--haze)" strokeOpacity="0.18" />
      ))}

      {pts.map(p => (
        <line key={p.facet} x1={half} y1={half}
              x2={half + Math.cos(p.angle) * half} y2={half + Math.sin(p.angle) * half}
              stroke="var(--haze)" strokeOpacity="0.12" />
      ))}

      {/*
        Always-rendered, non-colour cue marking where one dimension's arc ends
        and the next begins. Colour differentiates the four dimensions too
        (DIMENSION_COLOR below), but it must not be the *only* cue — this runs
        regardless of `labelled`, unlike the text labels, because Task 11 renders
        this component unlabelled in the instrument rail, which is exactly the
        state a viewer looks at for the whole twelve minutes.
      */}
      {DIMENSIONS.map((d, i) => {
        const a = boundaryAngle(i)
        const rInner = half * 0.86
        return (
          <line key={`boundary-${d}`} data-role="dimension-boundary"
                x1={half + Math.cos(a) * rInner} y1={half + Math.sin(a) * rInner}
                x2={half + Math.cos(a) * half} y2={half + Math.sin(a) * half}
                stroke="var(--haze)" strokeOpacity="0.5" strokeWidth="1.5" />
        )
      })}

      <polygon points={path} fill="var(--brass)" fillOpacity="0.14"
               stroke="var(--brass)" strokeWidth="1.5" data-role="constellation-shape"
               style={{ transition: 'all 400ms ease-out' }} />

      {pts.map(p => (
        <circle key={p.facet} cx={p.x + half} cy={p.y + half} r="2.5"
                fill={DIMENSION_COLOR[p.dimension]} data-role="constellation-dot" />
      ))}

      {labelled && DIMENSIONS.map((d, i) => {
        // Mid-angle of the dimension's arc, which lands on a diagonal. Set
        // beyond the rim, out in the square's corner where there is room, and
        // centred on that point: the rim curves away from a label there, so
        // even the longer Spanish names clear both the plot and the edge.
        const a = ((i * PER_DIMENSION + (PER_DIMENSION - 1) / 2) / FACETS.length) * Math.PI * 2 - Math.PI / 2
        const r = half * 1.13
        const x = half + Math.cos(a) * r
        const y = half + Math.sin(a) * r + (Math.sin(a) > 0 ? fontSize * 0.8 : 0)
        return (
          <text key={d} x={x} y={y}
                textAnchor="middle" className="font-mono uppercase" data-role="constellation-label"
                fontSize={fontSize} letterSpacing={size * 0.004} fill="var(--haze)">{t('dimension.' + d)}</text>
        )
      })}
    </svg>
  )
}
