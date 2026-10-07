import { DIMENSIONS, facetsByDimension } from '../data/facets.js'
import { facetPrecision, LEVEL_LABEL } from '../engine/precision.js'

const DIMENSION_LABEL = {
  interests: 'Interests',
  values: 'Values',
  aptitudes: 'Aptitudes',
  context: 'Context',
}

/**
 * One facet's row: label, mono score, a bar, the facet's blurb, and how much
 * to trust the number.
 *
 * The bar's colour (brass above 50, rust below) is decorative reinforcement
 * only — the score is printed as text right next to it, and the bar itself
 * carries an aria-label repeating the number, so nothing here depends on
 * colour or bar length alone to convey the value.
 *
 * The precision line is new. Two-item facets (every aptitude and context
 * facet) print in the same mono type as five-item ones, and a reader will
 * see a difference between 48 and 52 where there is only one answer's worth
 * of noise. So each row says how many statements fed it, and — when the
 * person's own answers on that facet pulled apart after reverse-keying —
 * says that too, since a mean of two items that disagree is barely a
 * measurement at all.
 */
function FacetRow({ facet, score, precision }) {
  const rounded = Math.round(score)
  const pct = Math.min(100, Math.max(0, rounded))
  const high = rounded >= 50
  const rough = precision.level === 'rough'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-base text-bone">{facet.label}</span>
        <span className="font-mono text-sm text-haze">
          {rounded}
          {rough && <span className="ml-1 text-xs" title="Rough estimate — two statements">~</span>}
        </span>
      </div>
      <div
        role="img"
        aria-label={`${facet.label}: ${rounded} out of 100${rough ? ', rough estimate' : ''}`}
        className="h-1.5 w-full rounded-full bg-haze/15 overflow-hidden"
      >
        <div
          className={high ? 'h-full bg-brass' : 'h-full bg-rust'}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/*
        Fix round 1, Finding 1: the blurb is a claim about the person, and
        every facets.js blurb is written for the HIGH pole only — rendering
        it unconditionally told a low scorer the opposite of what they
        answered. Select the pole from this person's own score, same
        threshold the bar colour already uses, so the two never disagree.
      */}
      <p className="font-body text-sm leading-snug text-haze">{high ? facet.blurb : facet.blurbLow}</p>
      <p className="font-mono text-xs text-haze/80">
        {LEVEL_LABEL[precision.level]}
        {precision.disagree && ' · your answers on this one pulled in different directions, so trust it less'}
      </p>
    </div>
  )
}

/**
 * The full 24-facet readout, grouped into the four dimensions in the same
 * fixed order the constellation and the question set use. Each dimension
 * block carries an id so the results screen's anchor nav can jump to it.
 */
export default function ProfileReadout({ profile, answers = {} }) {
  const precision = facetPrecision(answers)

  return (
    <section id="profile" aria-label="Full profile readout" className="w-full max-w-2xl flex flex-col gap-8 scroll-mt-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl text-bone">Your full profile</h2>
        <p className="font-mono text-xs text-haze leading-relaxed">
          A <span className="text-bone">~</span> marks a rough estimate: that
          facet rests on two statements, so a difference of a few points means
          nothing. Interests rest on five statements each and are the firmest
          numbers here.
        </p>
      </div>
      {DIMENSIONS.map(dimension => (
        <div key={dimension} id={`profile-${dimension}`} className="flex flex-col gap-4 scroll-mt-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-slate">
            {DIMENSION_LABEL[dimension]}
          </h3>
          <div className="flex flex-col gap-5">
            {facetsByDimension(dimension).map(facet => (
              <FacetRow
                key={facet.key}
                facet={facet}
                score={profile[facet.key]}
                precision={precision[facet.key]}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
