import { DIMENSIONS, facetsByDimension } from '../data/facets.js'

const DIMENSION_LABEL = {
  interests: 'Interests',
  values: 'Values',
  aptitudes: 'Aptitudes',
  context: 'Context',
}

/**
 * One facet's row: label, mono score, a bar, and the facet's blurb.
 *
 * The bar's colour (brass above 50, rust below) is decorative reinforcement
 * only — the score is printed as text right next to it, and the bar itself
 * carries an aria-label repeating the number, so nothing here depends on
 * colour or bar length alone to convey the value.
 */
function FacetRow({ facet, score }) {
  const rounded = Math.round(score)
  const pct = Math.min(100, Math.max(0, rounded))
  const high = rounded >= 50

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-base text-bone">{facet.label}</span>
        <span className="font-mono text-sm text-haze">{rounded}</span>
      </div>
      <div
        role="img"
        aria-label={`${facet.label}: ${rounded} out of 100`}
        className="h-1.5 w-full rounded-full bg-haze/15 overflow-hidden"
      >
        <div
          className={high ? 'h-full bg-brass' : 'h-full bg-rust'}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="font-body text-sm leading-snug text-haze">{facet.blurb}</p>
    </div>
  )
}

/**
 * The full 24-facet readout, grouped into the four dimensions in the same
 * fixed order the constellation and the question set use.
 */
export default function ProfileReadout({ profile }) {
  return (
    <section aria-label="Full profile readout" className="w-full max-w-2xl flex flex-col gap-8">
      <h2 className="font-display text-2xl text-bone">Your full profile</h2>
      {DIMENSIONS.map(dimension => (
        <div key={dimension} className="flex flex-col gap-4">
          <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-slate">
            {DIMENSION_LABEL[dimension]}
          </h3>
          <div className="flex flex-col gap-5">
            {facetsByDimension(dimension).map(facet => (
              <FacetRow key={facet.key} facet={facet} score={profile[facet.key]} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
