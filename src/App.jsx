import { useEffect, useRef, useState } from 'react'
import Intro from './components/Intro.jsx'
import Question from './components/Question.jsx'
import InstrumentRail from './components/InstrumentRail.jsx'
import Results from './components/Results.jsx'
import HowTo from './components/HowTo.jsx'
import ObserverDone from './components/ObserverDone.jsx'
import { QUESTIONS } from './data/questions.js'
import { appendRun, previousRun, sanitiseRuns } from './engine/history.js'
import { decodeAnswers, sanitiseObservers } from './engine/observer.js'
import { useLocale } from './i18n/index.jsx'

const STORAGE_KEY = 'lodestar.v1.session'
// An observer (someone rating the respondent) keeps a session of their own so
// opening a link never overwrites the respondent's half-finished test.
const OBSERVER_STORAGE_KEY = 'lodestar.v1.observer-session'
const RUNS_KEY = 'lodestar.v1.runs'
const OBSERVERS_KEY = 'lodestar.v1.observers'
/** Time on one item is capped so a tab left open overnight does not count as reading. */
const MAX_ITEM_MS = 120_000
// 'howto' sits between 'intro' and 'test'. It is a valid stored stage but is
// never restored as such: like 'test' it comes back as 'intro', so the resume
// cue only has to reason about "has answers" versus "has none".
const VALID_STAGES = ['intro', 'howto', 'test', 'results']

const QUESTION_IDS = new Set(QUESTIONS.map(q => q.id))

/**
 * Reads the two URL-hash contracts. `#observer=<name>` (name URI-encoded, may
 * be empty) means "run as an observer rating <name>"; `#from=<name>:<code>` is
 * an observer's answers coming back to the respondent. The name is encoded,
 * so any ':' in it is %3A and the LAST ':' is always the separator. Returns
 * {} for anything else, and never throws on a malformed escape.
 */
export function parseHash(hash) {
  const raw = String(hash ?? '').replace(/^#/, '')
  const decode = s => { try { return decodeURIComponent(s) } catch { return null } }

  if (raw.startsWith('observer=')) {
    const name = decode(raw.slice('observer='.length))
    return name === null ? {} : { observer: name }
  }
  if (raw.startsWith('from=')) {
    const body = raw.slice('from='.length)
    const cut = body.lastIndexOf(':')
    if (cut < 0) return {}
    const name = decode(body.slice(0, cut))
    return name === null ? {} : { from: { name, code: body.slice(cut + 1) } }
  }
  return {}
}

/**
 * Every entry in a stored answers map must be a known question id pointing at
 * an integer 1-5. One bad entry rejects the whole session.
 *
 * The shape checks alone were not enough, and the failure mode was permanent.
 * scoreAnswers() throws on any response outside 1..5 or not a finite number,
 * and Results' own isComplete() gate only checks `!== undefined` — so a stored
 * map of 72 out-of-range values (all 99) or 72 wrong-typed ones (all '4', the
 * shape any storage-format change or hand-edit produces) passed both gates and
 * reached the throw. There is no error boundary, so the app rendered blank,
 * the bad session stayed in localStorage, and every reload failed identically.
 * The only escape was clearing site data.
 *
 * Rejecting outright rather than repairing is deliberate: a session we cannot
 * trust the values of is not one whose partial answers are worth restoring,
 * and silently dropping the bad entries would leave the reader looking at a
 * progress figure built from answers they never gave.
 */
function hasValidAnswers(answers) {
  return Object.entries(answers).every(([id, value]) =>
    QUESTION_IDS.has(id) && Number.isInteger(value) && value >= 1 && value <= 5
  )
}

// Validated, not assumed: a stored session that is well-formed JSON but
// structurally wrong (a null answers map, an out-of-range index, an unknown
// stage, an unscoreable answer value) must still fall back to a fresh session
// rather than being handed to the app as-is — QUESTIONS[9999] is undefined,
// and reading .text off it throws, which is exactly what the try/catch below
// exists to prevent.
function loadSession(key = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed) return null
    if (!VALID_STAGES.includes(parsed.stage)) return null
    if (!Number.isInteger(parsed.index) || parsed.index < 0 || parsed.index >= QUESTIONS.length) return null
    if (parsed.answers === null || typeof parsed.answers !== 'object') return null
    if (Array.isArray(parsed.answers)) return null
    if (!hasValidAnswers(parsed.answers)) return null
    // `notice` is transient — it names how many statements were unanswered at
    // the moment the user tried to finish. It is persisted along with the rest
    // of the session, so restoring it verbatim brings back a stale "5
    // statements still need an answer" banner over a session the reader may
    // have since completed. Drop it on load; the next finish attempt that
    // needs one will set a fresh, correct one.
    // Timings are advisory (engine/quality.js reads them) and never a reason
    // to reject a session: a malformed map is replaced with an empty one.
    const timings = sanitiseTimings(parsed.timings)
    // A run id is minted when results are first reached; keep it if present so
    // a reload does not record the same completion twice.
    const runId = typeof parsed.runId === 'string' ? parsed.runId : null
    // A session interrupted mid-test comes back to the intro with a resume
    // cue ("you stopped at 34 of 72") rather than dropping the reader onto a
    // statement with no context. The index is kept; Begin continues from it.
    const stage = parsed.stage === 'test' || parsed.stage === 'howto' ? 'intro' : parsed.stage
    return { ...parsed, stage, timings, runId, notice: null }
  } catch {
    return null
  }
}

function sanitiseTimings(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out = {}
  for (const [id, ms] of Object.entries(value)) {
    if (QUESTION_IDS.has(id) && Number.isFinite(ms) && ms >= 0) out[id] = Math.min(ms, MAX_ITEM_MS)
  }
  return out
}

function loadRuns() {
  try {
    return sanitiseRuns(JSON.parse(localStorage.getItem(RUNS_KEY) ?? '[]'))
  } catch {
    return []
  }
}

function saveRuns(runs) {
  try { localStorage.setItem(RUNS_KEY, JSON.stringify(runs)) } catch { /* storage unavailable */ }
}

function newRunId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function saveSession(session, key = STORAGE_KEY) {
  try { localStorage.setItem(key, JSON.stringify(session)) } catch { /* storage unavailable */ }
}

function loadObservers() {
  try {
    return sanitiseObservers(JSON.parse(localStorage.getItem(OBSERVERS_KEY) ?? '[]'))
  } catch {
    return []
  }
}

function saveObservers(observers) {
  try { localStorage.setItem(OBSERVERS_KEY, JSON.stringify(observers)) } catch { /* storage unavailable */ }
}

/**
 * Adds an observer's view, newest last, last five kept. A second view with the
 * same code replaces the first rather than duplicating it, so pasting the same
 * link twice (or reloading on a #from= link) is harmless. Returns the new list,
 * or null when the code does not decode to 72 valid answers.
 */
function withObserver(current, name, code) {
  if (typeof name !== 'string' || !decodeAnswers(code)) return null
  const entry = { name, code, date: new Date().toISOString().slice(0, 10) }
  return sanitiseObservers([...current.filter(o => o.code !== code), entry])
}

const FRESH_SESSION = { stage: 'intro', index: 0, answers: {}, timings: {}, runId: null }

/**
 * Owns { stage, index, answers } for the whole assessment and persists it to
 * localStorage on every change. Restoration is validated and wrapped in
 * try/catch (see loadSession above) rather than assumed — an unreadable or
 * malformed value falls back to a fresh session instead of throwing.
 *
 * `stage` is 'intro' | 'howto' | 'test' | 'results'. Task 12 fills in the real
 * 'results' view; the arm exists here already so that wiring is additive.
 *
 * Observer mode (`#observer=<name>` at load) runs the same test under a
 * separate storage key, skips the how-to (the observer intro covers it), keeps
 * no run history, and ends on ObserverDone instead of Results. The mode is
 * fixed at mount: it is a property of the link that opened this page.
 */
export default function App() {
  const { locale, t } = useLocale()
  const [observerRaw] = useState(() => parseHash(window.location.hash).observer ?? null)
  const observerMode = observerRaw !== null
  const sessionKey = observerMode ? OBSERVER_STORAGE_KEY : STORAGE_KEY
  const [session, setSession] = useState(() => loadSession(sessionKey) ?? FRESH_SESSION)
  const [runs, setRuns] = useState(loadRuns)
  const [observers, setObservers] = useState(loadObservers)
  const { stage, index, answers, timings = {} } = session
  // What the observer copy calls the respondent when the link carried no name.
  const observerName = observerMode
    ? (observerRaw || (locale === 'es' ? 'esta persona' : 'this person'))
    : null

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    saveSession(session, sessionKey)
  }, [session])

  // An observer's answers coming home: `#from=<name>:<code>` is consumed once
  // on load, stored, and cleared from the address bar so a reload or a shared
  // screenshot of the URL does not carry it around. A bad code is dropped but
  // the hash is cleared all the same. Idempotent (same code replaces itself),
  // so StrictMode's double effect cannot add it twice.
  useEffect(() => {
    if (observerMode) return
    const { from } = parseHash(window.location.hash)
    if (!from) return
    addObserver(from.name, from.code)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])

  // When the current item was first shown. Reset whenever the item changes,
  // so the time recorded against an answer is time spent looking at that
  // statement, not time spent elsewhere in the test.
  const shownAt = useRef(Date.now())
  useEffect(() => {
    shownAt.current = Date.now()
  }, [stage, index])

  /**
   * Time spent on the item at the moment it is answered. Only the FIRST
   * answer to an item is timed: that is the reading, and a later change of
   * mind after going Back says nothing about whether the statement was read.
   */
  function timingFor(id, current) {
    if (current[id] !== undefined) return current
    const ms = Math.min(Math.max(0, Date.now() - shownAt.current), MAX_ITEM_MS)
    return { ...current, [id]: ms }
  }

  // 1-5 answers the current item and advances; ArrowLeft/ArrowRight navigate
  // without recording an answer. Only bound while a question is on screen.
  //
  // The arrow-key branch is gated on e.target: a <input type="radio"> group
  // has its own native ArrowLeft/ArrowRight behaviour (move focus and the
  // checked option to the adjacent radio in the same name group), which is
  // the primary way keyboard and screen-reader users browse the five options
  // in a fieldset. Firing item navigation on top of that — as an earlier
  // version of this handler did, unconditionally — either fights the native
  // behaviour (if prevented) or double-fires alongside it (if not), and a
  // live-browser check confirmed the prevented case: pressing the arrow
  // silently teleported to a different question with nothing checked. So
  // when focus is on a radio, this handler does nothing at all and lets
  // native semantics win; item navigation via the arrow keys only applies
  // when focus is elsewhere (nothing focused, or on the Back/Next buttons).
  useEffect(() => {
    if (stage !== 'test') return

    function handleKey(e) {
      const onRadio = e.target instanceof HTMLInputElement && e.target.type === 'radio'

      // Modifier-held digits belong to the browser and the OS, not to us:
      // Alt+3 and Meta+3 are tab-switching and application shortcuts on the
      // major platforms, and Ctrl+digit is a zoom or tab binding. Answering
      // the current item and advancing off the back of one of those is an
      // answer the user never intended to give, on an item they may not have
      // been looking at. Shift is not excluded — Shift+3 produces '#' rather
      // than '3', so it never reaches this branch anyway.
      const plainDigit = !e.ctrlKey && !e.altKey && !e.metaKey &&
        e.key.length === 1 && e.key >= '1' && e.key <= '5'

      if (plainDigit) {
        answerAndAdvance(QUESTIONS[index].id, Number(e.key))
      } else if (!onRadio && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault()
        goTo(index + (e.key === 'ArrowRight' ? 1 : -1))
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [stage, index, locale])

  // Begin from a clean intro goes through the how-to; Continue on a resumed
  // session and every observer start go straight to the statements.
  function begin() {
    setSession(s => ({ ...s, stage: observerMode ? 'test' : 'howto' }))
  }

  function startTest() {
    setSession(s => ({ ...s, stage: 'test' }))
  }

  function goTo(nextIndex) {
    const clamped = Math.max(0, Math.min(QUESTIONS.length - 1, nextIndex))
    setSession(s => ({ ...s, index: clamped, notice: null }))
  }

  // Records an answer without moving anywhere. This is what a mouse click or
  // a keyboard Space/Enter on a radio triggers (via Question's onAnswer), so
  // the Back/Next controls below have real work to do: Next only lights up
  // once the current item has an answer, and clicking it is a separate,
  // reviewable step rather than something that already happened the instant
  // an option was picked.
  function recordAnswer(id, value) {
    setSession(s => ({
      ...s,
      answers: { ...s.answers, [id]: value },
      timings: timingFor(id, s.timings ?? {}),
      notice: null,
    }))
  }

  // Gate for the 'test' -> 'results' transition. scoreAnswers() (Task 8)
  // throws on an incomplete answer map, and goTo lets a keyboard user land on
  // the last item having arrow-keyed straight past every question before it
  // without answering any of them — one digit press there would otherwise
  // reach 'results' with 71 items still unanswered and crash on the throw.
  // So the transition to 'results' is gated here, independent of how the
  // user reached the final index, on ALL 72 items being answered — not just
  // "index is at the end". When it isn't, the user is dropped on the first
  // unanswered item with a count so there's something to act on rather than
  // a dead end.
  function finishOrRedirect(s, answers) {
    const missingIndex = QUESTIONS.findIndex(q => answers[q.id] === undefined)
    if (missingIndex === -1) {
      return { ...s, answers, stage: 'results', runId: s.runId ?? newRunId(), notice: null }
    }

    const missingCount = QUESTIONS.length - QUESTIONS.filter(q => answers[q.id] !== undefined).length
    const notice = missingCount === 1
      ? t('notice.one')
      : t('notice.many', { n: missingCount })
    return { ...s, answers, index: missingIndex, notice }
  }

  // Advances (or, on the last item, finishes) without changing the answer.
  // Used by the Next button, once an answer already exists for this item.
  function advance() {
    setSession(s => {
      if (s.index < QUESTIONS.length - 1) return { ...s, index: s.index + 1, notice: null }
      return finishOrRedirect(s, s.answers)
    })
  }

  // Records and advances in one atomic update. This is the 1-5 keyboard
  // shortcut's behaviour specifically — the brief calls for the shortcut to
  // both answer and advance, and that stays a single-step action; only the
  // mouse/Back-Next route was split into record-then-advance.
  function answerAndAdvance(id, value) {
    setSession(s => {
      const nextAnswers = { ...s.answers, [id]: value }
      const nextTimings = timingFor(id, s.timings ?? {})
      if (s.index < QUESTIONS.length - 1) {
        return { ...s, answers: nextAnswers, timings: nextTimings, index: s.index + 1, notice: null }
      }
      return finishOrRedirect({ ...s, timings: nextTimings }, nextAnswers)
    })
  }

  function restart() {
    setSession({ ...FRESH_SESSION, answers: {}, timings: {} })
  }

  /** Returns true when the code was a complete set of answers and was stored. */
  function addObserver(name, code) {
    const next = withObserver(loadObservers(), name, code)
    if (!next) return false
    saveObservers(next)
    setObservers(next)
    return true
  }

  function removeObserver(code) {
    const next = loadObservers().filter(o => o.code !== code)
    saveObservers(next)
    setObservers(next)
  }

  /**
   * Called by Results once it has a profile and a shortlist. Idempotent on
   * runId, so re-rendering or reloading the results screen never adds a
   * second entry for the same completion.
   */
  function recordRun(run) {
    setRuns(current => {
      const next = appendRun(current, { ...run, id: session.runId, date: new Date().toISOString().slice(0, 10) })
      saveRuns(next)
      return next
    })
  }

  if (stage === 'intro') {
    const answered = QUESTIONS.filter(q => answers[q.id] !== undefined).length
    const resume = answered > 0 ? { index, answered, total: QUESTIONS.length } : null
    return (
      <Intro
        onStart={resume ? startTest : begin}
        onRestart={restart}
        resume={resume}
        observerName={observerName}
      />
    )
  }

  if (stage === 'howto') {
    return <HowTo onStart={startTest} />
  }

  if (stage === 'results' && observerMode) {
    return <ObserverDone answers={answers} name={observerName} />
  }

  if (stage === 'results') {
    return (
      <Results
        answers={answers}
        timings={timings}
        previous={previousRun(runs, session.runId)}
        onRecordRun={recordRun}
        onRestart={restart}
        observers={observers}
        onAddObserver={addObserver}
        onRemoveObserver={removeObserver}
      />
    )
  }

  const item = QUESTIONS[index]
  const isFirst = index === 0
  const isLast = index === QUESTIONS.length - 1
  const hasAnswer = answers[item.id] !== undefined

  return (
    <main className="min-h-screen flex flex-col bg-ink text-bone px-4 sm:px-6 py-6 gap-6">
      <InstrumentRail answers={answers} timings={timings} index={index} total={QUESTIONS.length} />
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {session.notice && (
          <p role="status" className="w-full max-w-2xl border-l-2 border-rust pl-3 font-mono text-sm text-bone">
            {session.notice}
          </p>
        )}
        {observerMode && (
          <p className="w-full max-w-2xl border-l-2 border-slate pl-3 font-mono text-xs text-slate">
            {t('question.observerBanner', { name: observerName })}
          </p>
        )}
        {/* Keyed by item so the explanation note closes when the statement changes. */}
        <Question
          key={item.id}
          item={item}
          value={answers[item.id]}
          onAnswer={recordAnswer}
          index={index}
          total={QUESTIONS.length}
        />

        <div className="w-full max-w-2xl flex items-center justify-between">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={isFirst}
            className="min-h-11 font-display text-base px-5 py-2 rounded-sm border border-haze/40 text-bone transition-colors hover:border-brass/60 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t('nav.back')}
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!hasAnswer}
            className="min-h-11 font-display text-base px-5 py-2 rounded-sm border border-brass bg-brass text-ink transition-colors hover:bg-brass/90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLast ? t('nav.finish') : t('nav.next')}
          </button>
        </div>
      </div>
    </main>
  )
}
