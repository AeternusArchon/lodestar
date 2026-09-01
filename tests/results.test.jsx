import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Results from '../src/components/Results.jsx'
import { QUESTIONS } from '../src/data/questions.js'
import { FACETS } from '../src/data/facets.js'

const varied = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, (i % 5) + 1]))
const uniform = Object.fromEntries(QUESTIONS.map(q => [q.id, 3]))

describe('<Results>', () => {
  it('shows at least five industries', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(5)
  })

  it('states the honest scope before any ranking', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    expect(document.body.textContent).toMatch(/snapshot|shortlist to investigate/i)
  })

  it('reads out all 24 facets', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    // getAllByText, not getByText: a facet label legitimately appears more than
    // once — in a card's reason lines and again in the full readout — and
    // getByText throws on multiple matches.
    for (const f of FACETS) expect(screen.getAllByText(f.label).length).toBeGreaterThanOrEqual(1)
  })

  it('labels value facets as editorial estimates', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    expect(document.body.textContent).toMatch(/estimate|not measured|our judgment/i)
  })

  it('declines to rank a wholly flat profile', () => {
    render(<Results answers={uniform} onRestart={() => {}} />)
    expect(document.body.textContent).toMatch(/did not find a signal|too even to rank/i)
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('carries the O*NET attribution', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    expect(document.body.textContent).toMatch(/O\*NET 30\.3 Database/)
    expect(document.body.textContent).toMatch(/CC BY 4\.0/)
  })
})
