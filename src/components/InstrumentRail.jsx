import Constellation from './Constellation.jsx'
import { QUESTIONS } from '../data/questions.js'
import { FACETS } from '../data/facets.js'
import { useLocale } from '../i18n/index.jsx'

/** Seconds per item assumed until the reader has set their own pace. */
const DEFAULT_SECONDS_PER_ITEM = 10
/** How many timed items before the estimate switches to the reader's own median. */
const MIN_TIMED_FOR_ESTIMATE = 5

/**
 * "About N min left", from the reader's own median time per item once there
 * are enough timed items to trust it, else from the intro's twelve-minute
 * figure (ten seconds per statement). The median, not the mean, so one long
 * pause for a phone call does not inflate the estimate for the rest of the
 * run. Rounded up to whole minutes and floored at one: "about 0 min left" is
 * both wrong and discouraging.
 */
export function minutesLeft(timings, remaining) {
  const ms = Object.values(timings ?? {}).filter(v => Number.isFinite(v) && v >= 0)
  let perItemMs = DEFAULT_SECONDS_PER_ITEM * 1000
  if (ms.length >= MIN_TIMED_FOR_ESTIMATE) {
    const sorted = [...ms].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    perItemMs = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }
  return Math.max(1, Math.ceil((remaining * perItemMs) / 60_000))
}

/**
 * A tolerant, partial cousin of engine/score.js's scoreAnswers(): that function
 * throws until all 72 items are answered, but the rail has to show the profile
 * emerging mid-test. A facet with zero answered items is left out of
 * `answeredFacets` entirely, which is what Constellation reads as "unmeasured"
 * (drawn at the origin) rather than "scored at 0".
 */
function partialProfile(answers) {
  const profile = {}
  const answeredFacets = new Set()

  for (const facet of FACETS) {
    const items = QUESTIONS.filter(q => q.facet === facet.key)
    const answered = items.filter(q => answers[q.id] !== undefined)
    if (answered.length === 0) continue

    answeredFacets.add(facet.key)
    const signed = answered.map(q => (q.dir === 1 ? answers[q.id] : 6 - answers[q.id]))
    const mean = signed.reduce((a, b) => a + b, 0) / signed.length
    profile[facet.key] = ((mean - 1) / 4) * 100
  }

  return { profile, answeredFacets }
}

/**
 * The mid-test rail: the item counter and the live constellation.
 *
 * `index`/`total` were once optional, guarded by a `showProgress` check, on
 * the expectation that the results view would reuse this component with only
 * `answers`. It did not — Results renders <Constellation> directly at a much
 * larger size — so no caller has ever omitted them and the guarded branch was
 * dead. App is the only caller and always passes all three.
 */
export default function InstrumentRail({ answers, timings = {}, index, total }) {
  const { t } = useLocale()
  const { profile, answeredFacets } = partialProfile(answers)
  const remaining = total - Object.keys(answers).length
  const minutes = minutesLeft(timings, remaining)

  return (
    <aside aria-label={t('rail.ariaLabel')} className="w-full flex flex-col items-center gap-2">
      <p aria-live="polite" className="font-mono text-xs uppercase tracking-[0.25em] text-haze">
        {t('rail.progress', { n: index + 1, total })}
        <span aria-hidden="true"> · </span>
        <span className="normal-case tracking-normal">
          {t('rail.timeLeft', { m: minutes })}
        </span>
      </p>
      <div className="w-[180px] h-[180px]">
        <Constellation profile={profile} answeredFacets={answeredFacets} size={180} />
      </div>
    </aside>
  )
}
