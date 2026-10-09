import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import App, { parseHash } from '../src/App.jsx'
import { LocaleProvider, makeT } from '../src/i18n/index.jsx'
import en from '../src/i18n/en.js'
import es from '../src/i18n/es.js'
import { QUESTIONS } from '../src/data/questions.js'
import { EXPLANATIONS } from '../src/data/explanations.js'
import { encodeAnswers } from '../src/engine/observer.js'

const t = makeT('en')

beforeEach(() => localStorage.clear())
afterEach(() => {
  window.history.replaceState(null, '', window.location.pathname)
})

/** Clicks Begin (or Continue) and, if the how-to screen appears, its start button. */
function start() {
  fireEvent.click(screen.getByRole('button', { name: /begin|continue/i }))
  const go = screen.queryByRole('button', { name: t('howto.start') })
  if (go) fireEvent.click(go)
}

function renderApp(locale = 'en') {
  return render(<LocaleProvider initial={locale}><App /></LocaleProvider>)
}

const allAnswers = value => Object.fromEntries(QUESTIONS.map((q, i) => [q.id, typeof value === 'function' ? value(i) : value]))

describe('assessment flow', () => {
  it('starts on the intro and states the honest scope', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
    expect(document.body.textContent).toMatch(/snapshot|not a verdict|shortlist/i)
  })

  it('advances to the first item and shows progress', () => {
    render(<App />)
    start()
    expect(screen.getByText(QUESTIONS[0].text)).toBeDefined()
    expect(document.body.textContent).toMatch(/1\s*\/\s*72/)
  })

  it('presents each item as a fieldset with a legend and five options', () => {
    render(<App />)
    start()
    expect(screen.getByRole('group')).toBeDefined()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
  })

  it('answers with the number keys and advances', () => {
    render(<App />)
    start()
    fireEvent.keyDown(window, { key: '4' })
    expect(screen.getByText(QUESTIONS[1].text)).toBeDefined()
  })

  it('goes back without losing the previous answer', () => {
    render(<App />)
    start()
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
    start()
    expect(screen.getByText(QUESTIONS[0].text)).toBeDefined()
    expect(screen.getAllByRole('radio').every(r => !r.checked)).toBe(true)
  })

  it('shows a time-remaining estimate on the rail', () => {
    render(<App />)
    start()
    expect(document.body.textContent).toMatch(/about \d+ min left/i)
  })

  it('records a timing for each first answer and ignores malformed stored timings', () => {
    localStorage.setItem('lodestar.v1.session', JSON.stringify({
      stage: 'test', index: 0, answers: {}, timings: { [QUESTIONS[0].id]: 'fast', bogus: 100 },
    }))
    render(<App />)
    start()
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
    start()
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
    start()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText(QUESTIONS[1].text)).toBeDefined()
  })
})

describe('Back and Next controls (Finding 2)', () => {
  it('disables Back on the first item and enables it once away from the first', () => {
    render(<App />)
    start()
    expect(screen.getByRole('button', { name: /back/i }).disabled).toBe(true)

    fireEvent.keyDown(window, { key: '3' })
    expect(screen.getByRole('button', { name: /back/i }).disabled).toBe(false)
  })

  it('disables Next until the current item has an answer, then advances on click', () => {
    render(<App />)
    start()
    const next = screen.getByRole('button', { name: /next/i })
    expect(next.disabled).toBe(true)

    fireEvent.click(screen.getByRole('radio', { name: /3/ }))
    expect(next.disabled).toBe(false)

    fireEvent.click(next)
    expect(screen.getByText(QUESTIONS[1].text)).toBeDefined()
  })

  it('Back returns to the previous item without losing the answer recorded there', () => {
    render(<App />)
    start()
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
    start()
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

describe('how-to screen', () => {
  it('sits between Begin and the first statement and advances on its button', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    expect(screen.getByRole('heading', { name: t('howto.title') })).toBeDefined()
    expect(screen.queryByText(QUESTIONS[0].text)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: t('howto.start') }))
    expect(screen.getByText(QUESTIONS[0].text)).toBeDefined()
  })

  it('is skipped when continuing a resumed session', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'test', index: 3, answers: { [QUESTIONS[0].id]: 5 } }))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(QUESTIONS[3].text)).toBeDefined()
  })

  it('restores a stored howto stage as a plain intro', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'howto', index: 0, answers: {} }))
    render(<App />)
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
    expect(document.body.textContent).not.toMatch(/you stopped at/i)
  })
})

describe('statement explanations', () => {
  it('toggles the plain-language note for the current item', () => {
    render(<App />)
    start()
    const btn = screen.getByRole('button', { name: t('question.explain') })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText(EXPLANATIONS[QUESTIONS[0].id])).toBeNull()

    fireEvent.click(btn)
    const note = screen.getByText(EXPLANATIONS[QUESTIONS[0].id])
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(btn.getAttribute('aria-controls')).toBe(note.id)
    expect(btn.textContent).toBe(t('question.hide'))

    fireEvent.click(btn)
    expect(screen.queryByText(EXPLANATIONS[QUESTIONS[0].id])).toBeNull()
    expect(btn.textContent).toBe(t('question.explain'))
  })

  it('closes again when the item changes', () => {
    render(<App />)
    start()
    fireEvent.click(screen.getByRole('button', { name: t('question.explain') }))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText(QUESTIONS[1].text)).toBeDefined()
    expect(screen.getByRole('button', { name: t('question.explain') }).getAttribute('aria-expanded')).toBe('false')
  })

  it('does not swallow the 1-5 shortcut while the explanation button has focus', () => {
    render(<App />)
    start()
    const btn = screen.getByRole('button', { name: t('question.explain') })
    btn.focus()
    expect(document.activeElement).toBe(btn)
    // Dispatched on the button so it bubbles to window with the button as target.
    fireEvent.keyDown(btn, { key: '4' })
    expect(screen.getByText(QUESTIONS[1].text)).toBeDefined()
    const saved = JSON.parse(localStorage.getItem('lodestar.v1.session'))
    expect(saved.answers[QUESTIONS[0].id]).toBe(4)
  })
})

describe('language toggle', () => {
  it('switches the intro to Spanish and remembers the choice', () => {
    renderApp('en')
    expect(screen.getByRole('heading').textContent).toBe(en.intro.title)
    const es_btn = screen.getByRole('button', { name: es.name })
    expect(es_btn.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(es_btn)
    expect(screen.getByRole('heading').textContent).toBe(es.intro.title)
    expect(screen.getByRole('button', { name: es.name }).getAttribute('aria-pressed')).toBe('true')
    expect(localStorage.getItem('lodestar.v1.locale')).toBe('es')
    expect(document.documentElement.lang).toBe('es')
  })

  it('shows translated item text and options on the question screen', () => {
    renderApp('es')
    fireEvent.click(screen.getByRole('button', { name: es.intro.begin }))
    fireEvent.click(screen.getByRole('button', { name: es.howto.start }))
    expect(screen.getByText(es.items[QUESTIONS[0].id])).toBeDefined()
    expect(screen.getByRole('radio', { name: new RegExp(es.question.options[5]) })).toBeDefined()
  })
})

describe('parseHash', () => {
  it('reads observer and from hashes, and tolerates junk', () => {
    expect(parseHash('#observer=Ana%20B')).toEqual({ observer: 'Ana B' })
    expect(parseHash('#observer=')).toEqual({ observer: '' })
    expect(parseHash('#from=Ana%3AB:CODE')).toEqual({ from: { name: 'Ana:B', code: 'CODE' } })
    expect(parseHash('#from=nocolon')).toEqual({})
    expect(parseHash('#observer=%E0%A4%A')).toEqual({})
    expect(parseHash('')).toEqual({})
    expect(parseHash('#other')).toEqual({})
  })
})

describe('observer mode', () => {
  it('shows the observer intro, skips the how-to, and keeps its own storage key', () => {
    window.location.hash = '#observer=Ana'
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'test', index: 3, answers: { [QUESTIONS[0].id]: 5 } }))
    renderApp('en')
    expect(screen.getByRole('heading').textContent).toBe(t('intro.observerTitle', { name: 'Ana' }))
    // The respondent's own half-finished session is not offered as a resume cue.
    expect(document.body.textContent).not.toMatch(/you stopped at/i)

    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    expect(screen.queryByRole('button', { name: t('howto.start') })).toBeNull()
    expect(screen.getByText(QUESTIONS[0].text)).toBeDefined()
    expect(document.body.textContent).toContain(t('question.observerBanner', { name: 'Ana' }))

    fireEvent.keyDown(window, { key: '4' })
    expect(JSON.parse(localStorage.getItem('lodestar.v1.observer-session')).answers[QUESTIONS[0].id]).toBe(4)
    // The respondent's session is untouched.
    expect(JSON.parse(localStorage.getItem('lodestar.v1.session')).answers[QUESTIONS[0].id]).toBe(5)
  })

  it('falls back to a generic name when the link carries none', () => {
    window.location.hash = '#observer='
    renderApp('en')
    expect(screen.getByRole('heading').textContent).toBe(t('intro.observerTitle', { name: 'this person' }))
  })

  it('ends on ObserverDone with a return link, records no run, and shows the raw code', () => {
    window.location.hash = '#observer=Ana'
    const answers = allAnswers(i => (i % 5) + 1)
    const last = QUESTIONS[QUESTIONS.length - 1].id
    const { [last]: _omit, ...almost } = answers
    localStorage.setItem('lodestar.v1.observer-session',
      JSON.stringify({ stage: 'test', index: 71, answers: almost, runId: null }))
    renderApp('en')
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(QUESTIONS[71].text)).toBeDefined()
    fireEvent.keyDown(window, { key: String(answers[last]) })

    expect(screen.getByRole('heading').textContent).toBe(t('observer.doneTitle'))
    const code = encodeAnswers(answers)
    // The return link carries the OBSERVER's name, not the respondent's:
    // blank files the view under "?", a typed name goes into the link.
    const [nameInput, input] = screen.getAllByRole('textbox')
    expect(input.readOnly).toBe(true)
    expect(input.value).toContain('#from=%3F:' + code)
    fireEvent.change(nameInput, { target: { value: 'Luis' } })
    expect(screen.getAllByRole('textbox')[1].value).toContain('#from=Luis:' + code)
    expect(document.body.textContent).toContain(code)
    expect(localStorage.getItem('lodestar.v1.runs')).toBeNull()
  })

  it('copies the link and reports the outcome', async () => {
    window.location.hash = '#observer=Ana'
    localStorage.setItem('lodestar.v1.observer-session',
      JSON.stringify({ stage: 'results', index: 71, answers: allAnswers(3) }))
    const writeText = vi.fn().mockResolvedValue()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderApp('en')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t('observer.copyLink') })) })
    expect(writeText).toHaveBeenCalledWith(screen.getAllByRole('textbox')[1].value)
    expect(screen.getByRole('status').textContent).toBe(t('observer.linkCopied'))
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
  })
})

describe('consuming a #from= link', () => {
  it('stores a valid observer view and clears the hash', () => {
    const code = encodeAnswers(allAnswers(i => (i % 5) + 1))
    window.location.hash = `#from=Ana:${code}`
    renderApp('en')
    const stored = JSON.parse(localStorage.getItem('lodestar.v1.observers'))
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ name: 'Ana', code })
    expect(stored[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(window.location.hash).toBe('')
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
  })

  it('replaces an existing view with the same code instead of duplicating it', () => {
    const code = encodeAnswers(allAnswers(2))
    localStorage.setItem('lodestar.v1.observers',
      JSON.stringify([{ name: 'Old', code, date: '2026-01-01' }]))
    window.location.hash = `#from=New:${code}`
    renderApp('en')
    const stored = JSON.parse(localStorage.getItem('lodestar.v1.observers'))
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('New')
  })

  it('ignores a bad code', () => {
    window.location.hash = '#from=Ana:not-a-code'
    renderApp('en')
    expect(localStorage.getItem('lodestar.v1.observers')).toBeNull()
    expect(screen.getByRole('button', { name: /begin/i })).toBeDefined()
  })
})
