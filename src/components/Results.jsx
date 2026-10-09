import { useEffect, useMemo, useState } from 'react'
import Constellation from './Constellation.jsx'
import ProfileReadout from './ProfileReadout.jsx'
import IndustryCard from './IndustryCard.jsx'
import CompareFields from './CompareFields.jsx'
import ObserverView from './ObserverView.jsx'
import LanguageToggle from './LanguageToggle.jsx'
import { scoreAnswers } from '../engine/score.js'
import { matchIndustries } from '../engine/match.js'
import { summarise } from '../engine/profile.js'
import { explainMatch } from '../engine/explain.js'
import { assessQuality } from '../engine/quality.js'
import { nearMisses, SHIFT } from '../engine/nearmiss.js'
import { diffProfiles, diffShortlists } from '../engine/history.js'
import { toMarkdown } from '../engine/format.js'
import { buildIcs, retakeDate } from '../engine/ics.js'
import { FACETS, DIMENSIONS } from '../data/facets.js'
import { INDUSTRIES } from '../data/industries.js'
import { QUESTIONS } from '../data/questions.js'
import { useLocale } from '../i18n/index.jsx'
import { BUTTON, BUTTON_HERO, BUTTON_DANGER, ENTRY, aside, ASIDE_TITLE, ASIDE_BODY } from './ui.js'

const ALL_FACETS = new Set(FACETS.map(f => f.key))
const INDUSTRY_BY_KEY = Object.fromEntries(INDUSTRIES.map(i => [i.key, i]))
const FACET_BY_KEY = Object.fromEntries(FACETS.map(f => [f.key, f]))

// O*NET requires this notice verbatim wherever their data is used — see
// https://www.onetcenter.org/license_forproducts.html. Do not paraphrase it,
// and do not translate it: "verbatim" is the licence term, so it stays in
// English in every locale. (The Markdown export's shorter attribution is
// Lodestar's own sentence and does translate — see export.attribution.)
const ONET_ATTRIBUTION =
  "This product includes information from the O*NET 30.3 Database by the U.S. Department of Labor, Employment and Training Administration. Used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA. Lodestar has modified this information; O*NET has not approved, endorsed, or tested these modifications."

function isComplete(answers) {
  return QUESTIONS.every(q => answers[q.id] !== undefined)
}

/**
 * Spec §3.7 removes entrepreneurship from the 22 on the explicit condition
 * that it is surfaced another way: "a cross-cutting note triggered by high
 * `autonomy`, high `riskTolerance`, and high `enterprising` scores".
 *
 * Threshold: all three at 70 or above, on the 0-100 facet scale. "High" has to
 * mean more than the 50 used elsewhere to pick which pole of a blurb to
 * render — 50 is the midpoint of the scale, not a strong reading, and firing
 * this on three coin-flips would make the note meaningless. 70 is a person who
 * answered around 4 of 5 on every item in all three facets. All three are
 * required, not any: wanting to run your own thing without the appetite for
 * an uncertain income, or the appetite without wanting to sell, is a different
 * profile and a worse piece of advice.
 */
const SELF_EMPLOYED_THRESHOLD = 70
const SELF_EMPLOYED_FACETS = ['autonomy', 'riskTolerance', 'enterprising']

function fitsSelfEmployment(profile) {
  return SELF_EMPLOYED_FACETS.every(key => profile[key] >= SELF_EMPLOYED_THRESHOLD)
}

/** The group (and therefore rank/tie state) a shortlisted entry belongs to. */
function groupFor(groups, key) {
  return groups.find(g => g.members.some(m => m.key === key))
}

/**
 * "A, B, and C" / "A, B y C". Intl.ListFormat knows each language's
 * conjunction and comma rules, so no list grammar lives in the locale files.
 */
function joinList(items, dateLocale) {
  return new Intl.ListFormat(dateLocale, { style: 'long', type: 'conjunction' }).format(items)
}

/**
 * Fills a translated template whose placeholders are React nodes rather than
 * strings — a facet label that needs its own <span>, say. Call t() with the
 * plain-text vars first (it leaves unknown placeholders as written), then pass
 * the result here with the node slots.
 */
function withSlots(template, slots) {
  return template.split(/(\{\w+\})/).map((part, i) => {
    const m = /^\{(\w+)\}$/.exec(part)
    return m && slots[m[1]] !== undefined ? <span key={i}>{slots[m[1]]}</span> : part
  })
}

/**
 * A quality flag in the reader's language. The engine's own `message` is
 * English and stays the source of truth for tests and the default export;
 * the same numbers are re-read from `stats` and run through quality.<code>.
 */
function flagText(flag, stats, t) {
  switch (flag.code) {
    case 'straightline-share':
      return t('quality.straightline-share', {
        share: Math.round(stats.straightLining.share * 100), mode: stats.straightLining.mode,
      })
    case 'straightline-run':
      return t('quality.straightline-run', { run: stats.straightLining.longestRun })
    case 'contradictions':
      return t('quality.contradictions', { n: stats.contradictions.length })
    case 'rushed':
      return stats.pace.medianMs < 1000
        ? t('quality.rushedFast')
        : t('quality.rushed', { seconds: (stats.pace.medianMs / 1000).toFixed(1) })
    default:
      return flag.message
  }
}

const round = n => Math.round(n)
const signed = n => (n > 0 ? `+${round(n)}` : `${round(n)}`)


/**
 * Copy-as-Markdown and print. The clipboard API is async and can be refused
 * (insecure context, permission denied, or jsdom); the fallback is a hidden
 * textarea and execCommand, and if that fails too the button says so rather
 * than silently doing nothing. Status is announced via aria-live.
 */
function ExportControls({ markdown }) {
  const { t } = useLocale()
  const [status, setStatus] = useState(null)

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown)
      } else {
        const ta = document.createElement('textarea')
        ta.value = markdown
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand && document.execCommand('copy')
        document.body.removeChild(ta)
        if (!ok) throw new Error('execCommand failed')
      }
      setStatus('ok')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <button type="button" onClick={copy} className={BUTTON}>{t('results.copy')}</button>
      <button type="button" onClick={() => window.print()} className={BUTTON}>{t('results.print')}</button>
      <p role="status" aria-live="polite" className="font-mono text-xs text-haze">
        {status === 'ok' && t('results.copied')}
        {status === 'failed' && t('results.copyFailed')}
      </p>
    </div>
  )
}

/**
 * The retake reminder. The comparison against a previous run is only worth
 * anything if a second run happens, so this offers a calendar event three
 * weeks out while the page is still open. engine/ics.js builds the text; the
 * download is plain DOM — a Blob, an object URL, and a throwaway
 * <a download> clicked once — so there is no dependency and nothing leaves
 * the machine. The link in the event is this page without its hash, so it
 * never carries an observer code or an anchor along with it.
 */
function RetakeReminder() {
  const { t } = useLocale()

  function download() {
    const ics = buildIcs({
      title: t('reminder.eventTitle'),
      description: t('reminder.eventBody'),
      url: location.href.split('#')[0],
      start: retakeDate(),
    })
    const href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = href
    a.download = 'lodestar-retake.ics'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // Revoked on the next tick, not immediately: some browsers start the
    // download asynchronously and need the URL to still resolve.
    setTimeout(() => URL.revokeObjectURL(href), 0)
  }

  return (
    <section aria-label={t('reminder.title')} className={`${aside()} print:hidden`}>
      <h2 className={ASIDE_TITLE}>{t('reminder.title')}</h2>
      <p className={ASIDE_BODY}>{t('reminder.body')}</p>
      <div>
        <button type="button" onClick={download} className={BUTTON}>{t('reminder.button')}</button>
      </div>
    </section>
  )
}

/**
 * The results screen: what a person gets back after seventy-two questions.
 * Computes once, in a fixed order — score, then match, then summarise — and
 * renders from that single pass rather than recomputing per section, so every
 * number on the page comes from the same profile.
 *
 * Two honesty commitments run through this screen (spec): the ranking is a
 * shortlist to investigate, not a verdict, stated before any ranking appears;
 * and the six Values facets per industry are Lodestar's own editorial
 * estimate rather than measured data, which is why every reason built on one
 * says so inline (see IndustryCard).
 *
 * Three more were added later and sit in the same spirit: a response-quality
 * banner when the answers look unread; a comparison against the previous run
 * so stability, not a single snapshot, carries the weight; and a "what would
 * change this" section for the industries that just missed.
 *
 * And three after that: a side-by-side of any two shortlisted fields, an
 * outside view from someone who knows the respondent, and a calendar reminder
 * to retake. Every user-facing sentence on the screen comes from the locale
 * (i18n/en.js and es.js) except the O*NET notice, which must stay verbatim.
 */
export default function Results({
  answers, timings = {}, previous = null, onRecordRun, onRestart,
  observers = [], onAddObserver, onRemoveObserver,
}) {
  const { t } = useLocale()
  // Defensive second gate. App.jsx is responsible for never transitioning to
  // this stage with an incomplete answer set — scoreAnswers() throws on one,
  // and Task 11's arrow-key navigation can reach the last item without
  // answering everything before it. This guard exists so that if that gate
  // is ever bypassed (a bug, a future caller of <Results> directly), the
  // screen degrades to a message instead of a crash.
  if (!isComplete(answers)) {
    const answeredCount = QUESTIONS.filter(q => answers[q.id] !== undefined).length
    const missing = QUESTIONS.length - answeredCount
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink text-bone px-6 py-16">
        <div className="w-full max-w-xl flex flex-col gap-6">
          <h1 className="font-display text-3xl sm:text-4xl leading-tight">
            {t('results.incompleteTitle', { missing, total: QUESTIONS.length })}
          </h1>
          <p className="font-body text-lg text-haze leading-relaxed">{t('results.incompleteBody')}</p>
          <button
            type="button"
            onClick={onRestart}
            className={`self-start ${BUTTON_HERO}`}
          >
            {t('results.restart')}
          </button>
        </div>
      </main>
    )
  }

  return (
    <CompleteResults
      answers={answers}
      timings={timings}
      previous={previous}
      onRecordRun={onRecordRun}
      onRestart={onRestart}
      observers={observers}
      onAddObserver={onAddObserver}
      onRemoveObserver={onRemoveObserver}
    />
  )
}

function CompleteResults({ answers, timings, previous, onRecordRun, onRestart, observers, onAddObserver, onRemoveObserver }) {
  const { locale, t, ordinal, facet: translateFacet, industry, dateLocale } = useLocale()

  // Language-independent: every number on the page. Recomputed only when the
  // answers change, never on a language switch.
  const computed = useMemo(() => {
    const profile = scoreAnswers(answers)
    const ranked = matchIndustries(profile)
    const summary = summarise(profile, ranked)
    const cards = summary.shortlist.map(entry => {
      const industryRecord = INDUSTRY_BY_KEY[entry.key]
      const match = { ...industryRecord, fit: entry.fit }
      const reasons = explainMatch(entry, profile, answers, { flat: summary.flat })
      const group = groupFor(summary.groups, entry.key)
      return { key: entry.key, match, reasons, rank: group.rank, tied: group.members.length > 1 }
    })
    const quality = assessQuality(answers, timings)
    const misses = summary.whollyFlat ? [] : nearMisses(profile, ranked, summary.shortlist)
    return { profile, ranked, summary, cards, quality, misses }
  }, [answers, timings])

  const { profile, summary, cards, quality, misses } = computed

  // A stored previous run can name an industry key this build no longer
  // has; naming it would throw and blank the page, so an unknown key falls
  // back to the raw key rather than crashing the comparison.
  const nameOf = key => (INDUSTRY_BY_KEY[key] ? industry(INDUSTRY_BY_KEY[key]).name : key)
  const labelOf = key => translateFacet(FACET_BY_KEY[key]).label
  const list = items => joinList(items, dateLocale)
  const flagTexts = quality.flags.map(f => ({ code: f.code, message: flagText(f, quality.stats, t) }))

  // The export in the reader's language: translated sentences, labels and
  // industry copy handed to the (English-by-default) engine formatter.
  const markdown = useMemo(() => {
    const strings = {
      heading: t('export.heading'), scope: t('export.scope'), draft: t('export.draft'),
      shortlist: t('export.shortlist'), noRanking: t('export.noRanking'), tied: t('card.tied'),
      fit: t('export.fit'), why: t('export.why'), you: t('export.you'), estimate: t('export.estimate'),
      against: t('export.against'), titles: t('export.titles'), firstMove: t('export.firstMove'),
      alsoTied: t('export.alsoTied'), flat: t('export.flat'), profile: t('export.profile'),
      attribution: t('export.attribution'),
      levels: { entry: t('level.entry'), mid: t('level.mid'), senior: t('level.senior') },
    }
    return toMarkdown({
      profile,
      summary,
      cards: cards.map(c => ({ ...c, match: industry(c.match) })),
      flags: flagTexts,
      industryNames: Object.fromEntries(INDUSTRIES.map(i => [i.key, industry(i).name])),
      strings,
      facetLabels: Object.fromEntries(FACETS.map(f => [f.key, translateFacet(f).label])),
      dimensionLabels: Object.fromEntries(DIMENSIONS.map(d => [d, t(`dimension.${d}`)])),
      ordinal,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computed, locale])

  // Record this completion once the numbers exist. App makes this idempotent
  // on the run id, so StrictMode double-effects and reloads are harmless.
  useEffect(() => {
    if (onRecordRun) {
      onRecordRun({ profile, shortlist: summary.shortlist.map(e => e.key) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const comparison = previous
    ? { facets: diffProfiles(profile, previous.profile), shortlist: diffShortlists(summary.shortlist.map(e => e.key), previous.shortlist) }
    : null

  // Comparing two fields needs two fields and a ranking worth comparing.
  const showCompare = !summary.whollyFlat && cards.length >= 2

  const NAV_LINK = 'inline-flex items-center min-h-8 py-1 hover:text-brass'
  const deltaClass = d => `inline-block w-[5ch] text-right ${Math.abs(d) >= 20 ? 'text-bone underline decoration-rust decoration-2 underline-offset-4' : ''}`

  return (
    <main className="min-h-screen bg-ink text-bone flex flex-col items-center pt-2 sm:pt-4">
      {/*
        The language switch sits top-right, where it sits on the intro and the
        how-to, rather than beside the h1, where at phone width it squeezed the
        title onto two lines. It changes the whole page, numbers excepted, and
        a reader who arrived in the wrong language should find it first.
      */}
      <div className="w-full flex justify-end px-4 sm:px-6 print:hidden">
        <LanguageToggle />
      </div>

      {/*
        Fix round 1, Finding 2: full-bleed means edge-to-edge — no page
        gutter, no width cap — the one place in the app this diagram is
        meant to read as a large signature element rather than the small,
        boxed 180x180 instrument-rail version. The HEIGHT is capped instead
        of the width: on a wide viewport that keeps this a full-width strip
        rather than an enormous square that would bury the honest-scope note
        off-screen below it; on a narrow viewport the width is the binding
        constraint instead, so it still renders as a true edge-to-edge
        square there. The viewBox is padded inside Constellation so the rim
        and the dimension labels are not clipped at the screen edge.
      */}
      <div className="w-full aspect-square max-h-[520px]">
        <Constellation profile={profile} answeredFacets={ALL_FACETS} size={520} labelled />
      </div>

      {/*
        Rhythm: the page is a stack of groups, not a stack of equal blocks.
        Wide gaps separate the groups (header, preface, shortlist, tools,
        follow-up, full profile); tighter gaps sit between the blocks inside
        one, so a reader can see which asides belong together.
      */}
      <div className="w-full flex flex-col items-center gap-16 sm:gap-20 px-4 sm:px-6 pt-6 pb-12">
        {/*
          The page's one h1. IndustryCard's headings sit under it at h2/h3,
          and ProfileReadout's h2/h3 follow the same outline.
        */}
        <div className="w-full max-w-2xl flex flex-col gap-5 font-body text-lg leading-relaxed">
          <h1 className="font-display text-4xl sm:text-5xl leading-tight text-bone">{t('results.title')}</h1>
          <p>{t('results.scope')}</p>

          {/*
            Anchor nav. The page is long — seven cards, each with two
            drawers, then twenty-four facet rows. Sections on one row; the
            four profile dimensions on a second, indented row under it, since
            they are anchors inside "Full profile", not sections of their own.
          */}
          <nav aria-label={t('results.navLabel')} className="print:hidden font-mono text-xs uppercase tracking-[0.2em] text-slate flex flex-col gap-1 pt-1">
            <div className="flex flex-wrap gap-x-5">
              {!summary.whollyFlat && <a href="#shortlist" className={NAV_LINK}>{t('results.nav.shortlist')}</a>}
              {misses.length > 0 && <a href="#near-misses" className={NAV_LINK}>{t('results.nav.nearMisses')}</a>}
              {showCompare && <a href="#compare" className={NAV_LINK}>{t('results.nav.compare')}</a>}
              {comparison && <a href="#comparison" className={NAV_LINK}>{t('results.nav.comparison')}</a>}
              <a href="#observer" className={NAV_LINK}>{t('results.nav.observer')}</a>
              <a href="#profile" className={NAV_LINK}>{t('results.nav.profile')}</a>
            </div>
            <div className="flex flex-wrap gap-x-5 border-l-2 border-haze/30 pl-3 text-haze">
              {DIMENSIONS.map(d => (
                <a key={d} href={`#profile-${d}`} className={NAV_LINK}>{t(`dimension.${d}`)}</a>
              ))}
            </div>
          </nav>

          <ExportControls markdown={markdown} />
        </div>

        {/*
          Preface: what to know before reading the list. The numbers note,
          then the response-quality banner (not a rejection: the ranking
          below is still computed and shown, but a shortlist built from
          seventy-two 3s should not be read as the other kind), then the
          too-even dimensions.
        */}
        <div className="w-full max-w-2xl flex flex-col gap-8">
          <aside className={aside()}>
            <p className={ASIDE_BODY}>{t('results.numbersNote')}</p>
          </aside>

          {flagTexts.length > 0 && (
            <section aria-label={t('results.draftLabel')} className={aside('warn')}>
              <h2 className={ASIDE_TITLE}>{t('results.draftTitle')}</h2>
              <p className={ASIDE_BODY}>{t('results.draftBody')}</p>
              <ul className="flex flex-col gap-1.5 pl-4 list-disc marker:text-rust">
                {flagTexts.map(f => (
                  <li key={f.code} className="font-body text-base leading-relaxed text-bone">{f.message}</li>
                ))}
              </ul>
            </section>
          )}

          {!summary.whollyFlat && summary.flat.length > 0 && (
            <aside className={aside()}>
              <p className={ASIDE_BODY}>{t('results.flatDims', { dims: list(summary.flat.map(d => t(`dimension.${d}`))) })}</p>
            </aside>
          )}
        </div>

        {summary.whollyFlat ? (
          <section aria-label={t('results.whollyFlatTitle')} className="w-full max-w-2xl flex flex-col gap-3">
            <h2 className="font-display text-2xl sm:text-3xl text-bone">{t('results.whollyFlatTitle')}</h2>
            <p className="font-body text-lg leading-relaxed text-haze">{t('results.whollyFlatBody')}</p>
          </section>
        ) : (
          <div className="w-full max-w-2xl flex flex-col gap-8">
            <div id="shortlist" className="w-full flex flex-col gap-8 scroll-mt-6">
              {cards.map(card => (
                <IndustryCard
                  key={card.key}
                  match={card.match}
                  reasons={card.reasons}
                  rank={card.rank}
                  tied={card.tied}
                  profile={profile}
                />
              ))}

              {/*
                Named, not dropped. profile.js caps full cards at seven;
                anything past that is the tail of a tie group whose other
                members are carded above. Truncating a tie group silently
                would contradict §3.6's near-tie honesty rule.
              */}
              {summary.alsoTied.length > 0 && (
                <aside className={aside()}>
                  <p className={ASIDE_BODY}>
                    {t('results.alsoTied', { names: list(summary.alsoTied.map(entry => nameOf(entry.key))) })}
                  </p>
                </aside>
              )}
            </div>

            {/*
              Spec §3.7's cross-cutting note. Directly after the cards and
              outside them: it is an observation about a MODE of working
              available inside any of the shortlisted industries, not a
              twenty-third recommendation competing with them — and "the whole
              list above" should be the list just above it. Suppressed on a
              wholly flat profile, where there is no list to refer to.
            */}
            {fitsSelfEmployment(profile) && (
              <section aria-label={t('results.selfLabel')} className={aside('note')}>
                <h2 className={ASIDE_TITLE}>{t('results.selfTitle')}</h2>
                <p className="font-body text-base leading-relaxed text-bone">
                  {t('results.selfBody1', {
                    autonomy: round(profile.autonomy),
                    risk: round(profile.riskTolerance),
                    enterprising: round(profile.enterprising),
                  })}
                </p>
                <p className={ASIDE_BODY}>{t('results.selfBody2')}</p>
              </section>
            )}
          </div>
        )}

        {/*
          Tools for the list: what would change it, then a side-by-side of
          any two of it. The near-misses use a fixed shift on purpose (see
          engine/nearmiss.js): a question to ask yourself, not a target.
        */}
        {(misses.length > 0 || showCompare) && (
          <div className="w-full max-w-2xl flex flex-col gap-16">
            {misses.length > 0 && (
              <section id="near-misses" aria-label={t('results.nearLabel')} className={`${aside()} gap-4`}>
                <h2 className={ASIDE_TITLE}>{t('results.nearTitle')}</h2>
                <p className={ASIDE_BODY}>
                  {t('results.nearIntro', { n: misses.length, shift: SHIFT })}
                </p>
                <ul className="flex flex-col gap-4">
                  {misses.map(m => {
                    const helped = t('results.nearHelped', {
                      direction: m.shift.direction > 0 ? t('results.higher') : t('results.lower'),
                      from: round(m.shift.from),
                      to: round(m.shift.to),
                      newFit: round(m.shift.newFit),
                      outcome: m.reaches ? t('results.nearReaches') : t('results.nearNot'),
                    })
                    const short = round(m.gap) <= 1
                      ? t('results.nearShortOne', { fit: round(m.fit) })
                      : t('results.nearShort', { fit: round(m.fit), gap: round(m.gap) })
                    return (
                      <li key={m.key} className={ENTRY}>
                        <h3 className="font-display text-lg text-bone">{nameOf(m.key)}</h3>
                        <p className="font-mono text-sm text-haze">{short}</p>
                        <p className={ASIDE_BODY}>
                          {withSlots(helped, { label: <span className="text-bone">{labelOf(m.shift.facet)}</span> })}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {showCompare && <CompareFields fields={cards.map(c => c.match)} profile={profile} />}
          </div>
        )}

        {/*
          Follow-up: does this hold up? Versus the previous run (or the note
          that there is none yet), the reminder to make a second run happen,
          and the same question asked of a different witness.
        */}
        <div className="w-full max-w-2xl flex flex-col gap-10">
          {comparison ? (
            <section id="comparison" aria-label={t('results.vsLabel')} className={`${aside()} gap-4`}>
              <h2 className={ASIDE_TITLE}>
                {withSlots(t('results.vsTitle'), { date: <span className="whitespace-nowrap">{previous.date}</span> })}
              </h2>
              <p className={ASIDE_BODY}>
                {t('results.vsStable', { n: comparison.facets.stable.length })}{' '}
                {comparison.facets.moved.length === 0
                  ? t('results.vsNone')
                  : t('results.vsMoved', { n: comparison.facets.moved.length })}
              </p>
              {comparison.facets.moved.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {comparison.facets.moved.slice(0, 6).map(d => (
                    <li key={d.key} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 font-body text-base text-bone">
                      <span>{labelOf(d.key)}</span>
                      <span className="font-mono text-sm text-haze whitespace-nowrap">
                        <span className="inline-block w-[3ch] text-right">{round(d.from)}</span>
                        {' → '}
                        <span className="inline-block w-[3ch] text-right">{round(d.to)}</span>{' '}
                        <span className={deltaClass(d.delta)}>({signed(d.delta)})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className={ASIDE_BODY}>
                {[
                  comparison.shortlist.kept.length > 0 && t('results.vsKept', { names: list(comparison.shortlist.kept.map(nameOf)) }),
                  comparison.shortlist.added.length > 0 && t('results.vsAdded', { names: list(comparison.shortlist.added.map(nameOf)) }),
                  comparison.shortlist.dropped.length > 0 && t('results.vsDropped', { names: list(comparison.shortlist.dropped.map(nameOf)) }),
                ].filter(Boolean).join(' ')}
              </p>
            </section>
          ) : (
            <aside className={aside()}>
              <p className={ASIDE_BODY}>{t('results.firstRun')}</p>
            </aside>
          )}

          <RetakeReminder />

          <ObserverView
            profile={profile}
            observers={observers}
            onAddObserver={onAddObserver}
            onRemoveObserver={onRemoveObserver}
          />
        </div>

        <ProfileReadout profile={profile} answers={answers} />

        <div className="w-full max-w-2xl flex flex-col gap-8">
          <footer className="font-mono text-xs text-haze leading-relaxed border-t border-haze/20 pt-6">
            <p lang="en">{ONET_ATTRIBUTION}</p>
          </footer>

          {/*
            Start over wipes this run, so it sits on its own row with a
            destructive outline rather than in a row of look-alike buttons
            next to Copy and Print.
          */}
          <div className="flex flex-col gap-6 print:hidden">
            <ExportControls markdown={markdown} />
            <div className="border-t border-haze/20 pt-6">
              <button type="button" onClick={onRestart} className={BUTTON_DANGER}>
                {t('results.restart')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
