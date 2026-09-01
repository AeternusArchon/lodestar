import Constellation from './Constellation.jsx'
import ProfileReadout from './ProfileReadout.jsx'
import IndustryCard from './IndustryCard.jsx'
import { scoreAnswers } from '../engine/score.js'
import { matchIndustries } from '../engine/match.js'
import { summarise } from '../engine/profile.js'
import { explainMatch } from '../engine/explain.js'
import { FACETS } from '../data/facets.js'
import { INDUSTRIES } from '../data/industries.js'
import { QUESTIONS } from '../data/questions.js'

const ALL_FACETS = new Set(FACETS.map(f => f.key))
const INDUSTRY_BY_KEY = Object.fromEntries(INDUSTRIES.map(i => [i.key, i]))

// O*NET requires this notice verbatim wherever their data is used — see
// https://www.onetcenter.org/license_forproducts.html. Do not paraphrase it.
const ONET_ATTRIBUTION =
  "This product includes information from the O*NET 30.3 Database by the U.S. Department of Labor, Employment and Training Administration. Used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA. Lodestar has modified this information; O*NET has not approved, endorsed, or tested these modifications."

function isComplete(answers) {
  return QUESTIONS.every(q => answers[q.id] !== undefined)
}

/**
 * Spec §3.7 removes entrepreneurship from the 22 on the explicit condition
 * that it is surfaced another way: "a cross-cutting note triggered by high
 * `autonomy`, high `riskTolerance`, and high `enterprising` scores".
 *
 * Threshold: all three at 70 or above, on the 0-100 facet scale. "High" has to
 * mean more than the 50 used elsewhere to pick which pole of a blurb to
 * render — 50 is the midpoint of the scale, not a strong reading, and firing
 * this on three coin-flips would make the note meaningless. 70 is a person who
 * answered around 4 of 5 on every item in all three facets. All three are
 * required, not any: wanting to run your own thing without the appetite for
 * an uncertain income, or the appetite without wanting to sell, is a different
 * profile and a worse piece of advice.
 */
const SELF_EMPLOYED_THRESHOLD = 70
const SELF_EMPLOYED_FACETS = ['autonomy', 'riskTolerance', 'enterprising']

function fitsSelfEmployment(profile) {
  return SELF_EMPLOYED_FACETS.every(key => profile[key] >= SELF_EMPLOYED_THRESHOLD)
}

/** The group (and therefore rank/tie state) a shortlisted entry belongs to. */
function groupFor(groups, key) {
  return groups.find(g => g.members.some(m => m.key === key))
}

function joinList(items) {
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

/**
 * The results screen: what a person gets back after seventy-two questions.
 * Computes once, in a fixed order — score, then match, then summarise — and
 * renders from that single pass rather than recomputing per section, so every
 * number on the page comes from the same profile.
 *
 * Two honesty commitments run through this screen (spec): the ranking is a
 * shortlist to investigate, not a verdict, stated before any ranking appears;
 * and the six Values facets per industry are Lodestar's own editorial
 * estimate rather than measured data, which is why every reason built on one
 * says so inline (see IndustryCard).
 */
export default function Results({ answers, onRestart }) {
  // Defensive second gate. App.jsx is responsible for never transitioning to
  // this stage with an incomplete answer set — scoreAnswers() throws on one,
  // and Task 11's arrow-key navigation can reach the last item without
  // answering everything before it. This guard exists so that if that gate
  // is ever bypassed (a bug, a future caller of <Results> directly), the
  // screen degrades to a message instead of a crash.
  if (!isComplete(answers)) {
    const answeredCount = QUESTIONS.filter(q => answers[q.id] !== undefined).length
    const missing = QUESTIONS.length - answeredCount
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink text-bone px-6 py-16">
        <div className="w-full max-w-xl flex flex-col gap-6 text-center items-center">
          <p className="font-display text-2xl">
            {missing} of {QUESTIONS.length} statements still need an answer.
          </p>
          <p className="font-body text-lg text-haze leading-relaxed">
            These answers can't be scored as saved. Start over from the
            beginning.
          </p>
          <button
            type="button"
            onClick={onRestart}
            className="font-display text-lg px-8 py-3 bg-brass text-ink rounded-sm transition-colors hover:bg-brass/90"
          >
            Start over
          </button>
        </div>
      </main>
    )
  }

  const profile = scoreAnswers(answers)
  const ranked = matchIndustries(profile)
  const summary = summarise(profile, ranked)

  const cards = summary.shortlist.map(entry => {
    const industry = INDUSTRY_BY_KEY[entry.key]
    const match = { ...industry, fit: entry.fit }
    const reasons = explainMatch(entry, profile, answers, { flat: summary.flat })
    const group = groupFor(summary.groups, entry.key)
    return { key: entry.key, match, reasons, rank: group.rank, tied: group.members.length > 1 }
  })

  return (
    <main className="min-h-screen bg-ink text-bone flex flex-col items-center pt-6 sm:pt-8">
      {/*
        Fix round 1, Finding 2: full-bleed means edge-to-edge — no page
        gutter, no width cap — the one place in the app this diagram is
        meant to read as a large signature element rather than the small,
        boxed 180x180 instrument-rail version. The HEIGHT is capped instead
        of the width: on a wide viewport that keeps this a full-width strip
        rather than an enormous square that would bury the honest-scope note
        off-screen below it; on a narrow viewport the width is the binding
        constraint instead, so it still renders as a true edge-to-edge
        square there. Either way it is dramatically larger than the old
        448px-capped, centered version this replaces. The top padding lives
        on <main>, not on this box, so it doesn't throw off the aspect-ratio
        math — padding inside an aspect-square element adds to its rendered
        height rather than being absorbed by it.
      */}
      <div className="w-full aspect-square max-h-[520px]">
        <Constellation profile={profile} answeredFacets={ALL_FACETS} size={520} labelled />
      </div>

      <div className="w-full flex flex-col items-center gap-14 px-4 sm:px-6 pt-8 pb-10">
        {/*
          The results screen had no h1 at all, and its outline ran H3 (industry
          name) … H4 (card sections) … H2 (full profile) — non-monotonic, and
          with nothing at the top for a screen-reader user to land on. This is
          the page's one h1; IndustryCard's headings were demoted a level to
          sit under it, which leaves ProfileReadout's existing h2/h3 correct
          as they stand.
        */}
        <div className="w-full max-w-2xl flex flex-col gap-4 font-body text-lg leading-relaxed">
          <h1 className="font-display text-3xl sm:text-4xl text-bone">Your results</h1>
          <p>
            This is a self-report snapshot, not a verdict on who you are. What
            follows is a shortlist to investigate, built from how you answered —
            not a measurement of what you're capable of.
          </p>
          <p className="font-mono text-sm text-haze leading-relaxed">
            One note on the numbers: seven of the twenty-four facets aren't
            measured data for any industry below. The six Values facets
            (autonomy, impact, income, stability, mastery, recognition) are
            missing because O*NET, the government dataset this runs on, dropped
            Work Values entirely. Schedule freedom is missing because O*NET has
            no measure of hours or place on a scale this can use — it records
            work schedules as categories, not as a number — and the element we
            first used turned out to measure decision-making discretion
            instead, which is a different thing. So we estimated it. Those
            seven figures per industry are Lodestar's own editorial estimate —
            our judgment, plainly labelled, not data dressed up as fact.
            Anywhere that estimate drives a reason, it says so.
          </p>
        </div>

        {!summary.whollyFlat && summary.flat.length > 0 && (
          <div className="w-full max-w-2xl font-body text-base leading-relaxed text-haze border-l-2 border-haze/30 pl-4">
            <p>
              Your answers ran too even across {joinList(summary.flat)} to
              say much there — those facets sat too close together to tell
              what you actually favor. The ranking below leans on the
              dimensions that did vary.
            </p>
          </div>
        )}

        {summary.whollyFlat ? (
          <div className="w-full max-w-2xl font-body text-lg leading-relaxed text-center flex flex-col gap-3">
            <p className="font-display text-2xl">
              This instrument did not find a signal in these answers.
            </p>
            <p className="text-haze">
              Every dimension came back too even to rank — nothing stood out
              enough to build a shortlist on. That's a real result, not a
              failure: it means these seventy-two statements didn't surface a
              strong lean, not that you lack one. The full readout below still
              shows exactly where every facet landed.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-2xl flex flex-col gap-8">
            {cards.map(card => (
              <IndustryCard
                key={card.key}
                match={card.match}
                reasons={card.reasons}
                rank={card.rank}
                tied={card.tied}
              />
            ))}

            {/*
              Named, not dropped. profile.js caps full cards at seven; anything
              past that is the tail of a tie group whose other members are
              carded above. Truncating a tie group silently would contradict
              §3.6's near-tie honesty rule, so the remainder is said out loud
              here instead of being given cards nobody asked for.
            */}
            {summary.alsoTied.length > 0 && (
              <p className="font-body text-base leading-relaxed text-haze border-l-2 border-haze/30 pl-4">
                Also within a point of these:{' '}
                {joinList(summary.alsoTied.map(entry => INDUSTRY_BY_KEY[entry.key].name))}.
                They tied with the cards at the bottom of this list, so the
                order between them means nothing — we stopped at seven rather
                than hand you fourteen. If one of them is the field you were
                already curious about, count it as on the list.
              </p>
            )}
          </div>
        )}

        {/*
          Spec §3.7's cross-cutting note. Deliberately placed after the cards
          and outside them: it is an observation about a MODE of working
          available inside any of the shortlisted industries, not a
          twenty-third recommendation competing with them. Suppressed on a
          wholly flat profile, where no shortlist was produced and "in any of
          these" would have nothing to refer to.
        */}
        {!summary.whollyFlat && fitsSelfEmployment(profile) && (
          <section
            aria-label="Working for yourself"
            className="w-full max-w-2xl flex flex-col gap-3 border-l-2 border-brass/50 pl-4"
          >
            <h2 className="font-display text-xl text-bone">Working for yourself</h2>
            <p className="font-body text-base leading-relaxed text-bone">
              Something cuts across the whole list above. You scored{' '}
              {Math.round(profile.autonomy)} on autonomy,{' '}
              {Math.round(profile.riskTolerance)} on risk tolerance, and{' '}
              {Math.round(profile.enterprising)} on enterprising — all three
              high, which is the combination that tends to point at running
              your own thing.
            </p>
            <p className="font-body text-base leading-relaxed text-haze">
              This isn't a twenty-third industry to weigh against the others.
              Every field above has a self-employed version — contract,
              freelance, private practice, your own small operation — and in
              any of these, that path fits your profile. Pick the field on the
              evidence above, then decide separately whether you want to do it
              on someone's payroll or on your own account.
            </p>
          </section>
        )}

        <ProfileReadout profile={profile} />

        <footer className="w-full max-w-2xl font-mono text-xs text-haze leading-relaxed border-t border-haze/20 pt-6">
          <p>{ONET_ATTRIBUTION}</p>
        </footer>

        <button
          type="button"
          onClick={onRestart}
          className="font-display text-base px-6 py-2 rounded-sm border border-haze/40 text-bone transition-colors hover:border-brass/60"
        >
          Start over
        </button>
      </div>
    </main>
  )
}
