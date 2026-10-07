import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Results from '../src/components/Results.jsx'
import { QUESTIONS } from '../src/data/questions.js'
import { FACETS } from '../src/data/facets.js'
import { INDUSTRIES } from '../src/data/industries.js'
import { scoreAnswers } from '../src/engine/score.js'
import { matchIndustries } from '../src/engine/match.js'
import { summarise } from '../src/engine/profile.js'

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

  // The screen had no h1 and ran H3 (industry name) … H4 (card sections) … H2
  // (full profile), so there was nothing to land on at the top and the outline
  // skipped a level on the way back up.
  it('has exactly one h1 and a heading outline that never skips a level', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)

    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .map(h => Number(h.tagName[1]))
    expect(levels[0]).toBe(1)
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1], `${levels[i - 1]} -> ${levels[i]}`).toBeLessThanOrEqual(1)
    }
  })

  it('carries the O*NET attribution', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    expect(document.body.textContent).toMatch(/O\*NET 30\.3 Database/)
    expect(document.body.textContent).toMatch(/CC BY 4\.0/)
  })
})

// Important 4: groupNearTies anchors on the group head's fit and summarise
// added whole groups with no truncation, so the "shortlist" reached 14 of 22.
// The cap lives in profile.js (see tests/profile.test.js); this covers what the
// reader actually sees.
describe('the shortlist cap on screen', () => {
  // A real, scoreable answer set — found by scanning 3,000 synthetic
  // respondents — whose near-tie grouping selects seventeen industries. Under
  // the old behaviour that was seventeen full cards, each with four reasons,
  // three titles and a first move.
  let s = 1521
  const overflowing = Object.fromEntries(QUESTIONS.map(q => {
    s = (s * 1103515245 + 12345) % 2147483648
    return [q.id, (s % 5) + 1]
  }))

  it('renders at most seven cards however wide the tie group runs', () => {
    render(<Results answers={overflowing} onRestart={() => {}} />)
    expect(screen.getAllByRole('article')).toHaveLength(7)
  })

  it('names the industries it did not card rather than dropping them', () => {
    render(<Results answers={overflowing} onRestart={() => {}} />)
    const text = document.body.textContent
    expect(text).toMatch(/also within a point of these/i)

    const profile = scoreAnswers(overflowing)
    const summary = summarise(profile, matchIndustries(profile))
    expect(summary.alsoTied.length).toBeGreaterThan(0)
    for (const entry of summary.alsoTied) {
      const name = INDUSTRIES.find(i => i.key === entry.key).name
      expect(text, name).toContain(name)
    }
  })

  it('shows no such line when nothing overflowed', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    expect(document.body.textContent).not.toMatch(/also within a point of these/i)
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

describe('<Results> additions', () => {
  // Every item answered in its keyed direction at full strength: no
  // straight-lining by share (values split 5/1), no contradictions.
  const consistent = Object.fromEntries(QUESTIONS.map(q => [q.id, q.dir === 1 ? 5 : 1]))
  const slow = Object.fromEntries(QUESTIONS.map(q => [q.id, 8000]))
  const fast = Object.fromEntries(QUESTIONS.map(q => [q.id, 900]))

  it('shows the draft banner on a rushed run and not on an unhurried one', () => {
    const { unmount } = render(<Results answers={consistent} timings={fast} onRestart={() => {}} />)
    expect(document.body.textContent).toMatch(/Treat this run as a draft/)
    expect(document.body.textContent).toMatch(/under a second/)
    unmount()
    render(<Results answers={consistent} timings={slow} onRestart={() => {}} />)
    expect(document.body.textContent).not.toMatch(/Treat this run as a draft/)
  })

  it('flags a straight-lined run even when the profile is not wholly flat', () => {
    // 4 on everything except one item per facet: share well over 0.7, and the
    // profile still varies because reverse-keyed items flip.
    const answers = Object.fromEntries(QUESTIONS.map(q => [q.id, 4]))
    render(<Results answers={answers} onRestart={() => {}} />)
    expect(document.body.textContent).toMatch(/Treat this run as a draft/)
    expect(document.body.textContent).toMatch(/of your answers were the same number/)
  })

  it('names the industries that just missed and the facet that would help each most', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    const section = screen.getByRole('region', { name: /just missed/i })
    expect(section.textContent).toMatch(/What would change this/)
    expect(section.querySelectorAll('li').length).toBe(3)
    expect(section.textContent).toMatch(/Most helped by scoring (higher|lower) on/)
    expect(section.textContent).toMatch(/points short/)
  })

  it('does not show near-misses on a wholly flat profile', () => {
    render(<Results answers={uniform} onRestart={() => {}} />)
    expect(screen.queryByRole('region', { name: /just missed/i })).toBeNull()
  })

  it('has an on-page nav whose anchors all resolve', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    const nav = screen.getByRole('navigation', { name: /on this page/i })
    const hrefs = [...nav.querySelectorAll('a')].map(a => a.getAttribute('href'))
    expect(hrefs.length).toBeGreaterThanOrEqual(6)
    for (const href of hrefs) {
      expect(document.querySelector(href), href).not.toBeNull()
    }
  })

  it('marks two-statement facets as rough estimates in the readout', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    const roughRows = screen.getAllByText(/Rough — two statements/)
    expect(roughRows).toHaveLength(12) // six aptitudes + six context facets
    expect(screen.getAllByText(/Firm — five statements/)).toHaveLength(6)
    expect(screen.getAllByText(/Fair — three statements/)).toHaveLength(6)
  })

  it('gives every card a provenance drawer and an occupations drawer', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    const cards = screen.getAllByRole('article')
    for (const card of cards) {
      expect(card.textContent).toMatch(/Where these numbers come from/)
      expect(card.textContent).toMatch(/Inside this field/)
      expect(card.textContent).toMatch(/Judged by Lodestar — 7 of 24/)
      expect(card.textContent).toMatch(/Measured from O\*NET — 17 of 24/)
    }
  })

  it('copies the results as Markdown', async () => {
    const writeText = vi.fn().mockResolvedValue()
    Object.assign(navigator, { clipboard: { writeText } })
    render(<Results answers={varied} onRestart={() => {}} />)
    fireEvent.click(screen.getAllByRole('button', { name: /copy as text/i })[0])
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    const md = writeText.mock.calls[0][0]
    expect(md).toMatch(/^# Lodestar results/)
    expect(md).toMatch(/## Full profile/)
    await waitFor(() => expect(document.body.textContent).toMatch(/Copied as Markdown/))
  })

  it('calls onRecordRun once with the profile and shortlist', () => {
    const onRecordRun = vi.fn()
    render(<Results answers={varied} onRestart={() => {}} onRecordRun={onRecordRun} />)
    expect(onRecordRun).toHaveBeenCalledTimes(1)
    const run = onRecordRun.mock.calls[0][0]
    expect(Object.keys(run.profile)).toHaveLength(24)
    expect(run.shortlist.length).toBeGreaterThanOrEqual(5)
  })

  it('invites a second run when there is no previous one', () => {
    render(<Results answers={varied} onRestart={() => {}} />)
    expect(document.body.textContent).toMatch(/Take this again in a few weeks/)
  })
})
