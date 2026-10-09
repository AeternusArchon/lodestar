import { FACETS } from '../data/facets.js'
import { QUESTIONS } from '../data/questions.js'
import { rankOccupations } from '../engine/occupations.js'
import { useLocale } from '../i18n/index.jsx'

const FACET_BY_KEY = Object.fromEntries(FACETS.map(f => [f.key, f]))
const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map(q => [q.id, q]))

const round = n => Math.round(n)

/**
 * The note appended to any reason built on an authored facet (card.authoredNote). Seven of the 24
 * numbers per industry are not O*NET data — the six Values facets, which O*NET
 * dropped from its database, and schedule freedom, which O*NET has no measure
 * of on a usable scale. They are Lodestar's own editorial estimate of what the
 * industry typically offers. Every reason that leans on one must say so
 * inline, right where the reader is weighing it, not in a footnote they may
 * never reach. Which facets those are is read off the industry's own
 * `authoredFacets` (see engine/explain.js), so this copy has to hold for all
 * seven — do not narrow it back to Values, in either locale.
 */

/**
 * Turns one computed Reason into fixed, deterministic prose. Same reason in,
 * same words out, every time — nothing here paraphrases or varies per
 * industry, so the sentence a reader gets is a direct report of the numbers,
 * not a generated opinion about them.
 *
 * The engine's reason carries English copy (label, blurb, item text). Only
 * its keys and numbers are used here: the label and blurb are re-read from
 * the translated facet, with the pole picked from the respondent's own score
 * exactly as explain.js picks it, and each quoted statement is looked up by
 * id so the reader sees the sentence they actually answered.
 */
function ReasonBlock({ reason, tone }) {
  const { t, facet: translateFacet, item: translateItem } = useLocale()
  const facet = translateFacet(FACET_BY_KEY[reason.facet])
  const blurb = reason.score >= 50 ? facet.blurb : facet.blurbLow
  const vars = { score: round(reason.score), label: facet.label, target: round(reason.target) }
  const lead = tone === 'negative' ? t('card.leadNeg', vars) : t('card.lead', vars)

  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-display text-base text-bone">
        {tone === 'negative' ? t('card.against') : null}{facet.label}
      </p>
      <p className="font-body text-base leading-relaxed text-bone">{lead} {blurb}</p>
      {reason.authored && (
        <p className="font-mono text-xs text-haze leading-relaxed">{t('card.authoredNote')}</p>
      )}
      {reason.items.length > 0 && (
        <ul className="flex flex-col gap-1 pl-4 list-disc marker:text-haze">
          {reason.items.map(it => {
            const q = QUESTION_BY_ID[it.id]
            const text = q ? translateItem(q).text : it.text
            return (
              <li key={it.id} className="font-body text-sm text-haze leading-snug">
                {t('card.answered', { text, response: it.response })}
              </li>
            )
          })}
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
 *
 * The rationale and O*NET element descriptions are provenance data and stay
 * as written (English); the facet labels and the drawer's own copy translate.
 */
function ProvenanceDrawer({ match }) {
  const { t, facet: translateFacet } = useLocale()
  const authored = FACETS.filter(f => match.provenance[f.key].kind === 'authored')
  const derived = FACETS.filter(f => match.provenance[f.key].kind === 'derived')
  const twoRater = authored.filter(f => match.provenance[f.key].raters === 2)

  return (
    <details className="group border-t border-haze/20 pt-2">
      <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.2em] text-slate hover:text-brass list-none flex items-center gap-2 min-h-11 rounded-sm">
        <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">▸</span>
        {t('card.provenanceSummary')}
      </summary>
      <div className="mt-4 flex flex-col gap-5 font-body text-sm leading-relaxed text-haze">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate">
            {t('card.provenanceAuthored', { n: authored.length })}
            {twoRater.length > 0
              ? t('card.provenanceTwoRaters', { n: twoRater.length })
              : t('card.provenanceOneRater')}
          </p>
          <ul className="flex flex-col gap-2">
            {authored.map(f => {
              const p = match.provenance[f.key]
              return (
                <li key={f.key}>
                  <span className="text-bone">{translateFacet(f).label}</span>{' '}
                  <span className="font-mono text-xs">{Math.round(match.vector[f.key])}</span>
                  {p.raters === 2 && (
                    <span className="font-mono text-xs"> · {t('card.provenanceTwo', { a: Math.round(p.rater1), b: Math.round(p.rater2), gap: Math.round(p.gap) })}</span>
                  )}
                  {' — '}{p.rationale}
                  {p.note && <> <span className="text-bone">{t('card.provenanceForField', { note: p.note })}</span></>}
                </li>
              )
            })}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate">
            {t('card.provenanceDerived', { n: derived.length })}
          </p>
          <ul className="flex flex-col gap-1">
            {derived.map(f => {
              const p = match.provenance[f.key]
              return (
                <li key={f.key}>
                  <span className="text-bone">{translateFacet(f).label}</span>{' '}
                  <span className="font-mono text-xs">{Math.round(match.vector[f.key])}</span>
                  {' — '}{p.what}
                  <span className="font-mono text-xs"> ({p.els.join(', ')})</span>
                </li>
              )
            })}
          </ul>
          <p className="font-mono text-xs">{t('card.provenanceFooter')}</p>
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
  const { t } = useLocale()
  const { ranked, occupations } = rankOccupations(match.key, profile)
  if (occupations.length === 0) return null

  return (
    <details className="group border-t border-haze/20 pt-2">
      <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.2em] text-slate hover:text-brass list-none flex items-center gap-2 min-h-11 rounded-sm">
        <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">▸</span>
        {t('card.occupationsSummary', { n: occupations.length })}
      </summary>
      <div className="mt-4 flex flex-col gap-3">
        <p className="font-body text-sm leading-relaxed text-haze">
          {ranked ? t('card.occupationsRanked') : t('card.occupationsUnranked')}
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

/*
 * `match` is the English industry record plus its fit; the displayed copy
 * (name, blurb, titles, first move) is the active locale's, via industry().
 * Engine fields — key, vector, provenance — pass through untouched.
 */
export default function IndustryCard({ match: raw, reasons, rank, tied, profile }) {
  const { t, ordinal, industry } = useLocale()
  const match = industry(raw)
  return (
    <article className="w-full flex flex-col gap-6 rounded-sm border border-haze/25 p-5 sm:p-8">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate">
          {tied ? t('card.tied', { rank: ordinal(rank) }) : ordinal(rank)}
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
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">{t('card.why')}</h3>
        {reasons.positives.map(reason => (
          <ReasonBlock key={reason.facet} reason={reason} tone="positive" />
        ))}
        {reasons.negative && <ReasonBlock reason={reasons.negative} tone="negative" />}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">{t('card.titles')}</h3>
        <ul className="flex flex-col gap-1">
          {match.titles.map(title => (
            <li key={title.title} className="font-body text-base text-bone">
              <span className="font-mono text-xs uppercase text-haze">{t(`level.${title.level}`)}</span> — {title.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">{t('card.firstMove')}</h3>
        <p className="font-body text-base leading-relaxed text-bone">{match.firstMove}</p>
      </div>

      {profile && <OccupationsDrawer match={match} profile={profile} />}
      {match.provenance && <ProvenanceDrawer match={match} />}
    </article>
  )
}
