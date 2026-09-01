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

  // The screen-level half of spec §3.8 correction 4: schedule freedom is no
  // longer derived from O*NET, so the page must say so alongside the Values
  // facets rather than presenting it as measured data.
  it('names schedule freedom among the editorial estimates, not just the Values facets', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    const text = document.body.textContent
    expect(text).toMatch(/seven of the twenty-four facets/i)
    expect(text).toMatch(/schedule freedom is missing/i)
    // And the inline note must not have been left narrowed to Values, or it
    // renders a false sentence under a schedule-freedom reason.
    expect(text).not.toMatch(/O\*NET does not measure Values/i)
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

// Spec §3.7 removes entrepreneurship from the 22 on the condition that it is
// surfaced as a cross-cutting note instead, triggered by high autonomy, high
// riskTolerance and high enterprising. Nothing implemented it until now.
describe('the self-employment cross-cutting note (spec §3.7)', () => {
  // Push all three trigger facets to the top of their scales, honouring each
  // item's own dir, and leave everything else mid-scale so the profile is not
  // wholly flat and a real shortlist still gets built.
  const entrepreneurial = { ...varied }
  for (const q of QUESTIONS) {
    if (!['autonomy', 'riskTolerance', 'enterprising'].includes(q.facet)) continue
    entrepreneurial[q.id] = q.dir === 1 ? 5 : 1
  }

  it('surfaces the note when all three facets score high', () => {
    render(<Results answers={entrepreneurial} onRestart={() => {}} />)
    expect(screen.getByRole('region', { name: /working for yourself/i })).toBeDefined()
    expect(document.body.textContent).toMatch(/self-employed path fits your profile|in\s+any of these, that path fits your profile/i)
    // It must read as a mode of working, not a twenty-third recommendation.
    expect(document.body.textContent).toMatch(/isn't a twenty-third industry/i)
    expect(screen.queryAllByRole('article').length).toBeGreaterThanOrEqual(5)
  })

  it('stays silent when the three facets are not all high', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    expect(screen.queryByRole('region', { name: /working for yourself/i })).toBeNull()
    expect(document.body.textContent).not.toMatch(/self-employed|working for yourself/i)
  })

  it('stays silent on a wholly flat profile, where there is no list to cut across', () => {
    render(<Results answers={uniform} onRestart={() => {}} />)
    expect(screen.queryByRole('region', { name: /working for yourself/i })).toBeNull()
  })
})

// Fix round 1, Finding 1 (Critical): the weighted cosine in match.js centers
// each dimension on its own mean, so a facet where BOTH the respondent and
// the industry sit below their dimension's mean multiplies two negatives
// into a positive contribution — a real, positive signal ("neither of us
// cares about this"). Every facets.js blurb was written for the HIGH pole
// only, so that genuine low-low match rendered a sentence asserting the
// opposite of what the respondent actually answered.
//
// `varied` is known (verified by direct inspection of matchIndustries +
// explainMatch against it) to put 'autonomy' — score ~8 of 100, well under
// the low/high threshold — among the top match's three positive reasons.
// That is the exact shape of the bug: a low score driving a *positive*
// reason, which is precisely when the old code rendered the HIGH blurb over
// a low score.
describe('facet blurb polarity (fix round 1, Finding 1)', () => {
  const autonomy = FACETS.find(f => f.key === 'autonomy')

  it('renders the low-pole blurb, never the high-pole one, for a low score that drives a reason', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    // The whole page, not just one card: ProfileReadout renders the same
    // facet's blurb too, and both must agree with the respondent's actual
    // score, not with each other's history of being wrong the same way.
    expect(document.body.textContent).not.toContain(autonomy.blurb)
    expect(document.body.textContent).toContain(autonomy.blurbLow)
  })
})
