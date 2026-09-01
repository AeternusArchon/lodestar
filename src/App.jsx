import { useEffect, useState } from 'react'
import Intro from './components/Intro.jsx'
import Question from './components/Question.jsx'
import InstrumentRail from './components/InstrumentRail.jsx'
import { QUESTIONS } from './data/questions.js'

const STORAGE_KEY = 'lodestar.v1.session'
const VALID_STAGES = ['intro', 'test', 'results']

// Validated, not assumed: a stored session that is well-formed JSON but
// structurally wrong (a null answers map, an out-of-range index, an unknown
// stage) must still fall back to a fresh session rather than being handed to
// the app as-is — QUESTIONS[9999] is undefined, and reading .text off it
// throws, which is exactly what the try/catch below exists to prevent.
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed) return null
    if (!VALID_STAGES.includes(parsed.stage)) return null
    if (!Number.isInteger(parsed.index) || parsed.index < 0 || parsed.index >= QUESTIONS.length) return null
    if (parsed.answers === null || typeof parsed.answers !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function saveSession(session) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)) } catch { /* storage unavailable */ }
}

const FRESH_SESSION = { stage: 'intro', index: 0, answers: {} }

/**
 * Owns { stage, index, answers } for the whole assessment and persists it to
 * localStorage on every change. Restoration is validated and wrapped in
 * try/catch (see loadSession above) rather than assumed — an unreadable or
 * malformed value falls back to a fresh session instead of throwing.
 *
 * `stage` is 'intro' | 'test' | 'results'. Task 12 fills in the real
 * 'results' view; the arm exists here already so that wiring is additive.
 */
export default function App() {
  const [session, setSession] = useState(() => loadSession() ?? FRESH_SESSION)
  const { stage, index, answers } = session

  useEffect(() => {
    saveSession(session)
  }, [session])

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

      if (e.key.length === 1 && e.key >= '1' && e.key <= '5') {
        answerAndAdvance(QUESTIONS[index].id, Number(e.key))
      } else if (!onRadio && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault()
        goTo(index + (e.key === 'ArrowRight' ? 1 : -1))
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [stage, index])

  function begin() {
    setSession(s => ({ ...s, stage: 'test' }))
  }

  function goTo(nextIndex) {
    const clamped = Math.max(0, Math.min(QUESTIONS.length - 1, nextIndex))
    setSession(s => ({ ...s, index: clamped }))
  }

  // Records an answer without moving anywhere. This is what a mouse click or
  // a keyboard Space/Enter on a radio triggers (via Question's onAnswer), so
  // the Back/Next controls below have real work to do: Next only lights up
  // once the current item has an answer, and clicking it is a separate,
  // reviewable step rather than something that already happened the instant
  // an option was picked.
  function recordAnswer(id, value) {
    setSession(s => ({ ...s, answers: { ...s.answers, [id]: value } }))
  }

  // Advances (or, on the last item, finishes) without changing the answer.
  // Used by the Next button, once an answer already exists for this item.
  function advance() {
    setSession(s => {
      if (s.index >= QUESTIONS.length - 1) return { ...s, stage: 'results' }
      return { ...s, index: s.index + 1 }
    })
  }

  // Records and advances in one atomic update. This is the 1-5 keyboard
  // shortcut's behaviour specifically — the brief calls for the shortcut to
  // both answer and advance, and that stays a single-step action; only the
  // mouse/Back-Next route was split into record-then-advance.
  function answerAndAdvance(id, value) {
    setSession(s => {
      const nextAnswers = { ...s.answers, [id]: value }
      if (s.index >= QUESTIONS.length - 1) {
        return { ...s, answers: nextAnswers, stage: 'results' }
      }
      return { ...s, answers: nextAnswers, index: s.index + 1 }
    })
  }

  if (stage === 'intro') {
    return <Intro onStart={begin} />
  }

  if (stage === 'results') {
    // Task 12 replaces this with the full results view.
    return (
      <main className="min-h-screen grid place-items-center bg-ink text-bone font-display text-center px-6">
        <p>That's the last one. Results are on their way.</p>
      </main>
    )
  }

  const item = QUESTIONS[index]
  const isFirst = index === 0
  const isLast = index === QUESTIONS.length - 1
  const hasAnswer = answers[item.id] !== undefined

  return (
    <main className="min-h-screen flex flex-col bg-ink text-bone px-4 sm:px-6 py-6 gap-6">
      <InstrumentRail answers={answers} index={index} total={QUESTIONS.length} />
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <Question
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
            className="font-display text-base px-5 py-2 rounded-sm border border-haze/40 text-bone transition-colors hover:border-brass/60 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!hasAnswer}
            className="font-display text-base px-5 py-2 rounded-sm bg-brass text-ink transition-colors hover:bg-brass/90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </main>
  )
}
