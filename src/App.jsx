import { useEffect, useState } from 'react'
import Intro from './components/Intro.jsx'
import Question from './components/Question.jsx'
import InstrumentRail from './components/InstrumentRail.jsx'
import { QUESTIONS } from './data/questions.js'

const STORAGE_KEY = 'lodestar.v1.session'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.index !== 'number' || typeof parsed.answers !== 'object') return null
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
  useEffect(() => {
    if (stage !== 'test') return

    function handleKey(e) {
      if (e.key.length === 1 && e.key >= '1' && e.key <= '5') {
        answerAndAdvance(QUESTIONS[index].id, Number(e.key))
      } else if (e.key === 'ArrowLeft') {
        goTo(index - 1)
      } else if (e.key === 'ArrowRight') {
        goTo(index + 1)
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

  return (
    <main className="min-h-screen flex flex-col bg-ink text-bone px-4 sm:px-6 py-6 gap-6">
      <InstrumentRail answers={answers} index={index} total={QUESTIONS.length} />
      <div className="flex-1 flex items-center justify-center">
        <Question
          item={item}
          value={answers[item.id]}
          onAnswer={answerAndAdvance}
          index={index}
          total={QUESTIONS.length}
        />
      </div>
    </main>
  )
}
