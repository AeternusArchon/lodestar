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
export default function IndustryCard({ match, reasons, rank, tied }) {
  return (
    <article className="w-full flex flex-col gap-6 rounded-sm border border-haze/25 p-6 sm:p-8">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate">
          {tied ? `Tied for ${ordinal(rank)}` : ordinal(rank)}
        </p>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h3 className="font-display text-2xl sm:text-3xl text-bone">{match.name}</h3>
          <p className="font-mono text-3xl text-brass">
            {round(match.fit)}<span className="text-base align-top">%</span>
          </p>
        </div>
        <p className="font-body text-base leading-relaxed text-haze">{match.blurb}</p>
      </header>

      <div className="flex flex-col gap-5">
        <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">Why this fits</h4>
        {reasons.positives.map(reason => (
          <ReasonBlock key={reason.facet} reason={reason} tone="positive" />
        ))}
        {reasons.negative && <ReasonBlock reason={reasons.negative} tone="negative" />}
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">Titles you'd see</h4>
        <ul className="flex flex-col gap-1">
          {match.titles.map(t => (
            <li key={t.title} className="font-body text-base text-bone">
              <span className="font-mono text-xs uppercase text-haze">{t.level}</span> — {t.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">A first move</h4>
        <p className="font-body text-base leading-relaxed text-bone">{match.firstMove}</p>
      </div>
    </article>
  )
}
