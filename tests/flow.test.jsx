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
