import { FACETS } from '../data/facets.js'
import { rankOccupations } from '../engine/occupations.js'

const ORDINAL_SUFFIX = ['th', 'st', 'nd', 'rd']

function ordinal(n) {
  const v = n % 100
  const suffix = ORDINAL_SUFFIX[(v - 20) % 10] || ORDINAL_SUFFIX[v] || ORDINAL_SUFFIX[0]
  return `${n}${suffix}`
}

const round = n => Math.round(n)

/**
 * The note appended to any reason built on an authored facet. Seven of the 24
 * numbers per industry are not O*NET data — the six Values facets, which O*NET
 * dropped from its database, and schedule freedom, which O*NET has no measure
 * of on a usable scale. They are Lodestar's own editorial estimate of what the
 * industry typically offers. Every reason that leans on one must say so
 * inline, right where the reader is weighing it, not in a footnote they may
 * never reach. Which facets those are is read off the industry's own
 * `authoredFacets` (see engine/explain.js), so this copy has to hold for all
 * seven — do not narrow it back to Values.
 */
const AUTHORED_NOTE =
  "This number is Lodestar's editorial estimate, not measured data — O*NET has no usable measure of this one, so we judged it ourselves."

/**
 * Turns one computed Reason into fixed, deterministic prose. Same reason in,
 * same words out, every time — nothing here paraphrases or varies per
 * industry, so the sentence a reader gets is a direct report of the numbers,
 * not a generated opinion about them.
 */
function ReasonBlock({ reason, tone }) {
  const score = round(reason.score)
  const target = round(reason.target)
  const lead = tone === 'negative'
    ? `You scored ${score} on ${reason.label}; this field typically runs ${target} here, which pulls the fit down.`
    : `You scored ${score} on ${reason.label}; this field typically runs ${target} here.`

  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-display text-base text-bone">
        {tone === 'negative' ? 'Weighs against it: ' : null}{reason.label}
      </p>
      <p className="font-body text-base leading-relaxed text-bone">{lead} {reason.blurb}</p>
      {reason.authored && (
        <p className="font-mono text-xs text-haze leading-relaxed">{AUTHORED_NOTE}</p>
      )}
      {reason.items.length > 0 && (
        <ul className="flex flex-col gap-1 pl-4 list-disc marker:text-haze">
          {reason.items.map(item => (
            <li key={item.id} className="font-body text-sm text-haze leading-snug">
              &ldquo;{item.text}&rdquo; — you answered {item.response} of 5.
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * One ranked industry, as an <article> so the results screen reads as a list
 * of independent items to a screen reader. `rank`/`tied` describe this card's
 * position among near-ties (see profile.js's TIE_THRESHOLD) — when tied is
 * true, two or more cards report the same rank rather than an arbitrary order
 * inside a fit range too close to call.
 */
/**
 * The provenance drawer. Every one of the 24 numbers this card's fit was
 * computed from, with where it came from: an O*NET element by name for the
 * seventeen derived facets, and the question the author answered — plus how
 * many people answered it — for the seven authored ones. The reasoning has
 * lived in code comments since the start; this is the first time the person
 * being asked to trust the numbers can see it. Closed by default: it is
 * reference material, not the result.
 */
function ProvenanceDrawer({ match }) {
  const authored = FACETS.filter(f => match.provenance[f.key].kind === 'authored')
  const derived = FACETS.filter(f => match.provenance[f.key].kind === 'derived')
  const twoRater = authored.filter(f => match.provenance[f.key].raters === 2)

  return (
    <details className="group border-t border-haze/20 pt-4">
      <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.2em] text-slate hover:text-brass list-none flex items-center gap-2">
        <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">▸</span>
        Where these numbers come from
      </summary>
      <div className="mt-4 flex flex-col gap-5 font-body text-sm leading-relaxed text-haze">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate">
            Judged by Lodestar — {authored.length} of 24
            {twoRater.length > 0
              ? `, ${twoRater.length} rated by two people`
              : ', one rater so far'}
          </p>
          <ul className="flex flex-col gap-2">
            {authored.map(f => {
              const p = match.provenance[f.key]
              return (
                <li key={f.key}>
                  <span className="text-bone">{f.label}</span>{' '}
                  <span className="font-mono text-xs">{Math.round(match.vector[f.key])}</span>
                  {p.raters === 2 && (
                    <span className="font-mono text-xs"> · two raters, {Math.round(p.rater1)} and {Math.round(p.rater2)}, {Math.round(p.gap)} apart</span>
                  )}
                  {' — '}{p.rationale}
                  {p.note && <> <span className="text-bone/80">For this field: {p.note}.</span></>}
                </li>
              )
            })}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate">
            Measured from O*NET — {derived.length} of 24
          </p>
          <ul className="flex flex-col gap-1">
            {derived.map(f => {
              const p = match.provenance[f.key]
              return (
                <li key={f.key}>
                  <span className="text-bone">{f.label}</span>{' '}
                  <span className="font-mono text-xs">{Math.round(match.vector[f.key])}</span>
                  {' — '}{p.what}
                  <span className="font-mono text-xs"> ({p.els.join(', ')})</span>
                </li>
              )
            })}
          </ul>
          <p className="font-mono text-xs">
            Each is the weighted mean over the occupations listed under
            &ldquo;Inside this field&rdquo;, rescaled from O*NET&rsquo;s own scale to 0-100.
          </p>
        </div>
      </div>
    </details>
  )
}

/**
 * The occupation drill-down. Spec §1 keeps occupation codes out of the
 * headline for good reason — nobody with no direction can act on 900 of
 * them. But a person who has just read why this one industry fits can act
 * on "and inside it, these fit you best". When the occupation vectors have
 * been derived (see data-build/derive-occupation-vectors.mjs), the roster
 * is ranked over the seventeen measured facets only, and says so; when they
 * have not, the roster is listed in authoring order with no ranking claimed.
 */
function OccupationsDrawer({ match, profile }) {
  const { ranked, occupations } = rankOccupations(match.key, profile)
  if (occupations.length === 0) return null

  return (
    <details className="group border-t border-haze/20 pt-4">
      <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.2em] text-slate hover:text-brass list-none flex items-center gap-2">
        <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">▸</span>
        Inside this field — {occupations.length} occupations
      </summary>
      <div className="mt-4 flex flex-col gap-3">
        <p className="font-body text-sm leading-relaxed text-haze">
          {ranked
            ? 'Ranked against your profile on the seventeen measured facets only — O*NET has no per-occupation data for the Values facets or schedule freedom, so those sit this one out.'
            : 'The occupations whose O*NET data this industry\u2019s numbers are averaged from, heaviest first. Not ranked against you: per-occupation vectors have not been generated for this build.'}
        </p>
        <ol className="flex flex-col gap-1.5">
          {occupations.map((o, i) => (
            <li key={o.soc} className="flex items-baseline justify-between gap-4 font-body text-base text-bone">
              <span>
                <span className="font-mono text-xs text-haze mr-2">{ranked ? i + 1 : o.soc}</span>
                {o.title}
              </span>
              {ranked && (
                <span className="font-mono text-sm text-brass shrink-0">{round(o.fit)}%</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </details>
  )
}

export default function IndustryCard({ match, reasons, rank, tied, profile }) {
  return (
    <article className="w-full flex flex-col gap-6 rounded-sm border border-haze/25 p-6 sm:p-8">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate">
          {tied ? `Tied for ${ordinal(rank)}` : ordinal(rank)}
        </p>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h2 className="font-display text-2xl sm:text-3xl text-bone">{match.name}</h2>
          <p className="font-mono text-3xl text-brass">
            {round(match.fit)}<span className="text-base align-top">%</span>
          </p>
        </div>
        <p className="font-body text-base leading-relaxed text-haze">{match.blurb}</p>
      </header>

      <div className="flex flex-col gap-5">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">Why this fits</h3>
        {reasons.positives.map(reason => (
          <ReasonBlock key={reason.facet} reason={reason} tone="positive" />
        ))}
        {reasons.negative && <ReasonBlock reason={reasons.negative} tone="negative" />}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">Titles you'd see</h3>
        <ul className="flex flex-col gap-1">
          {match.titles.map(t => (
            <li key={t.title} className="font-body text-base text-bone">
              <span className="font-mono text-xs uppercase text-haze">{t.level}</span> — {t.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">A first move</h3>
        <p className="font-body text-base leading-relaxed text-bone">{match.firstMove}</p>
      </div>

      {profile && <OccupationsDrawer match={match} profile={profile} />}
      {match.provenance && <ProvenanceDrawer match={match} />}
    </article>
  )
}
