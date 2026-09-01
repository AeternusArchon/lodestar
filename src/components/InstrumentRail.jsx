import Constellation from './Constellation.jsx'
import { QUESTIONS } from '../data/questions.js'
import { FACETS } from '../data/facets.js'

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
 * `index`/`total` are optional: during the test App passes both so the rail
 * can show progress, but Task 12's results view can reuse this component with
 * only `answers` (a completed set) to show the finished figure without a
 * meaningless position readout.
 */
export default function InstrumentRail({ answers, index, total }) {
  const { profile, answeredFacets } = partialProfile(answers)
  const showProgress = typeof index === 'number' && typeof total === 'number'

  return (
    <aside aria-label="Your emerging profile" className="w-full flex flex-col items-center gap-2">
      {showProgress && (
        <p aria-live="polite" className="font-mono text-xs uppercase tracking-[0.25em] text-haze">
          {index + 1} / {total}
        </p>
      )}
      <div className="w-[180px] h-[180px]">
        <Constellation profile={profile} answeredFacets={answeredFacets} size={180} />
      </div>
    </aside>
  )
}
