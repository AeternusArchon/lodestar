import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App.jsx'
import { QUESTIONS } from '../src/data/questions.js'

beforeEach(() => localStorage.clear())

describe('assessment flow', () => {
  it('starts on the intro and states the honest scope', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
    expect(document.body.textContent).toMatch(/snapshot|not a verdict|shortlist/i)
  })

  it('advances to the first item and shows progress', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    expect(screen.getByText(QUESTIONS[0].text)).toBeDefined()
    expect(document.body.textContent).toMatch(/1\s*\/\s*72/)
  })

  it('presents each item as a fieldset with a legend and five options', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    expect(screen.getByRole('group')).toBeDefined()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
  })

  it('answers with the number keys and advances', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    fireEvent.keyDown(window, { key: '4' })
    expect(screen.getByText(QUESTIONS[1].text)).toBeDefined()
  })

  it('goes back without losing the previous answer', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    fireEvent.keyDown(window, { key: '4' })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText(QUESTIONS[0].text)).toBeDefined()
    expect(screen.getByRole('radio', { name: /4/ }).checked).toBe(true)
  })

  // An interrupted session comes back to the intro with a resume cue rather
  // than dropping the reader onto a statement with no context; Continue picks
  // up at the saved index.
  it('restores an in-progress session from localStorage behind a resume cue', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'test', index: 3, answers: { [QUESTIONS[0].id]: 5 } }))
    render(<App />)
    expect(document.body.textContent).toMatch(/stopped at statement 4 of 72, with 1 answered/i)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(QUESTIONS[3].text)).toBeDefined()
  })

  it('offers to start fresh from the resume cue and clears the saved answers', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'test', index: 3, answers: { [QUESTIONS[0].id]: 5 } }))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /start fresh/i }))
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    expect(screen.getByText(QUESTIONS[0].text)).toBeDefined()
    expect(screen.getAllByRole('radio').every(r => !r.checked)).toBe(true)
  })

  it('shows a time-remaining estimate on the rail', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    expect(document.body.textContent).toMatch(/about \d+ min left/i)
  })

  it('records a timing for each first answer and ignores malformed stored timings', () => {
    localStorage.setItem('lodestar.v1.session', JSON.stringify({
      stage: 'test', index: 0, answers: {}, timings: { [QUESTIONS[0].id]: 'fast', bogus: 100 },
    }))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /continue|begin/i }))
    fireEvent.keyDown(window, { key: '4' })
    const saved = JSON.parse(localStorage.getItem('lodestar.v1.session'))
    expect(Object.keys(saved.timings)).toEqual([QUESTIONS[0].id])
    expect(typeof saved.timings[QUESTIONS[0].id]).toBe('number')
  })

  it('survives unreadable localStorage', () => {
    localStorage.setItem('lodestar.v1.session', 'not json')
    expect(() => render(<App />)).not.toThrow()
  })
})

// Fix round 1: coordinator-flagged findings.
describe('keyboard vs. native radio-group navigation (Finding 1)', () => {
  it('does not change the question when an arrow key originates from a radio', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    const radios = screen.getAllByRole('radio')
    // Dispatched on the radio itself (not window), so e.target is the input —
    // this is what the earlier unconditional preventDefault() broke: the
    // browser's native "move the checked option" behaviour never gets a
    // chance to run, and item navigation fires in its place instead.
    fireEvent.keyDown(radios[2], { key: 'ArrowRight' })
    expect(screen.getByText(QUESTIONS[0].text)).toBeDefined()
  })

  it('still navigates on arrow keys when focus is not on a radio', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText(QUESTIONS[1].text)).toBeDefined()
  })
})

describe('Back and Next controls (Finding 2)', () => {
  it('disables Back on the first item and enables it once away from the first', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    expect(screen.getByRole('button', { name: /back/i }).disabled).toBe(true)

    fireEvent.keyDown(window, { key: '3' })
    expect(screen.getByRole('button', { name: /back/i }).disabled).toBe(false)
  })

  it('disables Next until the current item has an answer, then advances on click', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    const next = screen.getByRole('button', { name: /next/i })
    expect(next.disabled).toBe(true)

    fireEvent.click(screen.getByRole('radio', { name: /3/ }))
    expect(next.disabled).toBe(false)

    fireEvent.click(next)
    expect(screen.getByText(QUESTIONS[1].text)).toBeDefined()
  })

  it('Back returns to the previous item without losing the answer recorded there', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    fireEvent.click(screen.getByRole('radio', { name: /3/ }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(QUESTIONS[0].text)).toBeDefined()
    expect(screen.getByRole('radio', { name: /3/ }).checked).toBe(true)
  })
})

describe('session-restore validation (Finding 3)', () => {
  it('falls back to a fresh session when the stored answers are null', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'test', index: 3, answers: null }))
    render(<App />)
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
  })

  it('falls back to a fresh session when the stored index is out of bounds', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'test', index: 9999, answers: {} }))
    render(<App />)
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
  })

  it('falls back to a fresh session when the stored stage is unknown', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'bogus', index: 0, answers: {} }))
    render(<App />)
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
  })
})

// A stored session whose SHAPE is fine but whose answer VALUES are unscoreable
// used to pass every gate and reach scoreAnswers(), which throws. With no
// error boundary the app rendered blank, the bad session stayed in
// localStorage, and every reload failed identically — the only escape was
// clearing site data.
describe('corrupt stored answer values', () => {
  const complete = value => Object.fromEntries(QUESTIONS.map(q => [q.id, value]))

  it('falls back to a fresh session when stored answers are out of range', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'results', index: 71, answers: complete(99) }))
    expect(() => render(<App />)).not.toThrow()
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
  })

  it('falls back to a fresh session when stored answers are strings', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'results', index: 71, answers: complete('4') }))
    expect(() => render(<App />)).not.toThrow()
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
  })

  it('falls back to a fresh session when an answer key is not a question id', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'test', index: 3, answers: { 'NOPE-01': 3 } }))
    render(<App />)
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
  })

  it('falls back to a fresh session on a non-integer answer', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'test', index: 3, answers: { [QUESTIONS[0].id]: 2.5 } }))
    render(<App />)
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
  })

  it('still restores a session whose answer values are all valid', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'test', index: 3, answers: { [QUESTIONS[0].id]: 1, [QUESTIONS[1].id]: 5 } }))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(QUESTIONS[3].text)).toBeDefined()
  })
})

describe('restored session hygiene and keyboard modifiers', () => {
  it('does not restore a stale unanswered-statements notice', () => {
    localStorage.setItem('lodestar.v1.session', JSON.stringify({
      stage: 'test', index: 3, answers: { [QUESTIONS[0].id]: 4 },
      notice: '5 statements still need an answer. Here\'s the first one.',
    }))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(QUESTIONS[3].text)).toBeDefined()
    expect(document.body.textContent).not.toMatch(/statements? still needs? an answer/i)
  })

  it('ignores the 1-5 shortcut when a modifier is held', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    for (const modifier of ['altKey', 'metaKey', 'ctrlKey']) {
      fireEvent.keyDown(window, { key: '3', [modifier]: true })
      expect(screen.getByText(QUESTIONS[0].text), modifier).toBeDefined()
      expect(screen.queryByRole('radio', { name: /3/ }).checked, modifier).toBe(false)
    }
    // ...and still answers on a plain digit.
    fireEvent.keyDown(window, { key: '3' })
    expect(screen.getByText(QUESTIONS[1].text)).toBeDefined()
  })
})

describe('run history', () => {
  const complete = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, (i % 5) + 1]))

  it('records a completed run once, keyed by run id, and survives a reload', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'results', index: 71, answers: complete, runId: 'run-a' }))
    const { unmount } = render(<App />)
    let runs = JSON.parse(localStorage.getItem('lodestar.v1.runs'))
    expect(runs).toHaveLength(1)
    expect(runs[0].id).toBe('run-a')
    expect(runs[0].shortlist.length).toBeGreaterThanOrEqual(5)
    unmount()
    render(<App />)
    runs = JSON.parse(localStorage.getItem('lodestar.v1.runs'))
    expect(runs).toHaveLength(1)
  })

  it('compares against the previous run when one exists', () => {
    const profile = Object.fromEntries(
      ['realistic','investigative','artistic','social','enterprising','conventional',
       'autonomy','impact','income','stability','mastery','recognition',
       'analytical','verbal','spatial','interpersonal','organizational','creative',
       'peopleFacing','structurePref','pace','physicality','riskTolerance','scheduleFlex'].map(k => [k, 50]))
    localStorage.setItem('lodestar.v1.runs', JSON.stringify([
      { id: 'run-old', date: '2026-09-01', profile, shortlist: ['technology-software'] },
    ]))
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'results', index: 71, answers: complete, runId: 'run-new' }))
    render(<App />)
    expect(document.body.textContent).toMatch(/Versus your run on 2026-09-01/)
    expect(document.body.textContent).toMatch(/of 24 facets landed within ten points/)
  })

  it('drops a malformed history instead of crashing', () => {
    localStorage.setItem('lodestar.v1.runs', JSON.stringify([{ id: 'x', profile: null }]))
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'results', index: 71, answers: complete, runId: 'run-b' }))
    expect(() => render(<App />)).not.toThrow()
    expect(document.body.textContent).not.toMatch(/Versus your run/)
  })
})
