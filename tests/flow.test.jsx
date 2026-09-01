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

  it('restores an in-progress session from localStorage', () => {
    localStorage.setItem('lodestar.v1.session',
      JSON.stringify({ stage: 'test', index: 3, answers: { [QUESTIONS[0].id]: 5 } }))
    render(<App />)
    expect(screen.getByText(QUESTIONS[3].text)).toBeDefined()
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
