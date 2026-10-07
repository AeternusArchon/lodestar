import { QUESTIONS } from '../data/questions.js'
import { FACETS } from '../data/facets.js'

/**
 * Response-quality checks: did this person actually read the statements?
 *
 * profile.js detects a flat PROFILE — six facets in a dimension landing too
 * close together to rank on. That is a fact about the person's answers. This
 * module is about a different failure: a flat RESPONDENT, who clicked the
 * same number down the page, or contradicted themselves on every reverse-keyed
 * pair, or finished seventy-two items in ninety seconds. Those answers score
 * fine, match fine, and produce a confident-looking shortlist built on
 * nothing. None of the three checks below can prove inattention — a person
 * really can be a 3 on most things — so the output is a set of flags with
 * plain-language reasons, never a rejection. The results screen says "treat
 * this run as a draft" and carries on.
 *
 * Thresholds are exported so tests assert the rule, not a magic number.
 */

/** Share of answers that are the single most common value. */
export const STRAIGHTLINE_SHARE = 0.7
/** Longest run of identical consecutive answers, in presentation order. */
export const STRAIGHTLINE_RUN = 12
/**
 * Reverse-keyed contradictions: a +1 item and a -1 item on the same facet
 * both agreed with (>= 4) or both disagreed with (<= 2). One or two happen to
 * careful people — items are imperfect. Six is a quarter of the facets.
 */
export const CONTRADICTION_COUNT = 6
/** Median milliseconds per item below which the run reads as rushed. */
export const RUSHED_MEDIAN_MS = 2000
/** Timing is only judged when at least this share of items carry a time. */
export const MIN_TIMED_SHARE = 0.5

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function straightLining(answers) {
  const ordered = QUESTIONS.map(q => answers[q.id]).filter(v => v !== undefined)
  if (ordered.length === 0) return { share: 0, longestRun: 0, mode: null }

  const counts = {}
  for (const v of ordered) counts[v] = (counts[v] ?? 0) + 1
  const [mode, modeCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]

  let longestRun = 1, run = 1
  for (let i = 1; i < ordered.length; i++) {
    run = ordered[i] === ordered[i - 1] ? run + 1 : 1
    if (run > longestRun) longestRun = run
  }

  return { share: modeCount / ordered.length, longestRun, mode: Number(mode) }
}

/**
 * Every (+1, -1) item pair within a facet where both were answered the same
 * way. Agreeing with "I would rather be left to decide" AND with "I would
 * rather be handed clear direction" is not a nuanced position; it is not
 * reading. Returns the pairs so the UI can quote one if it wants to.
 */
export function reverseContradictions(answers) {
  const pairs = []
  for (const facet of FACETS) {
    const items = QUESTIONS.filter(q => q.facet === facet.key && answers[q.id] !== undefined)
    const forward = items.filter(q => q.dir === 1)
    const reverse = items.filter(q => q.dir === -1)
    for (const f of forward) {
      for (const r of reverse) {
        const a = answers[f.id], b = answers[r.id]
        if ((a >= 4 && b >= 4) || (a <= 2 && b <= 2)) {
          pairs.push({ facet: facet.key, forward: f.id, reverse: r.id, values: [a, b] })
        }
      }
    }
  }
  return pairs
}

/**
 * `timings` maps item id -> milliseconds spent on that item before answering.
 * Returns null when too few items were timed to say anything.
 */
export function pace(timings = {}) {
  const ms = QUESTIONS.map(q => timings[q.id]).filter(v => Number.isFinite(v) && v >= 0)
  if (ms.length < QUESTIONS.length * MIN_TIMED_SHARE) return null
  return { medianMs: median(ms), timedItems: ms.length }
}

/**
 * The one call the UI makes. `flags` is an array of { code, message }; an
 * empty array means nothing looked off. `stats` carries the raw numbers for
 * anyone who wants to show them.
 */
export function assessQuality(answers, timings = {}) {
  const flags = []
  const line = straightLining(answers)
  const contradictions = reverseContradictions(answers)
  const speed = pace(timings)

  if (line.share >= STRAIGHTLINE_SHARE) {
    flags.push({
      code: 'straightline-share',
      message: `${Math.round(line.share * 100)}% of your answers were the same number (${line.mode}). That usually means the statements were not being weighed one at a time.`,
    })
  } else if (line.longestRun >= STRAIGHTLINE_RUN) {
    flags.push({
      code: 'straightline-run',
      message: `You gave the same answer ${line.longestRun} times in a row. Twelve or more in a row is a pattern of clicking rather than reading.`,
    })
  }

  if (contradictions.length >= CONTRADICTION_COUNT) {
    flags.push({
      code: 'contradictions',
      message: `On ${contradictions.length} facets you agreed with two statements that describe opposite people. One or two of those is normal; this many usually means the reversed statements were missed.`,
    })
  }

  if (speed && speed.medianMs < RUSHED_MEDIAN_MS) {
    flags.push({
      code: 'rushed',
      message: `Your typical statement got ${(speed.medianMs / 1000).toFixed(1)} seconds. Under two seconds is not long enough to read most of them.`,
    })
  }

  return { flags, stats: { straightLining: line, contradictions, pace: speed } }
}
