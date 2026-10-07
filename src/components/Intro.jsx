/**
 * The opening screen. Carries the honest-scope statement (spec §1) — that this
 * is a self-report snapshot producing a shortlist to investigate, not a
 * verdict — because it matters more than any other copy in the product. Says
 * it once, plainly, and leaves the rest of the screen alone.
 *
 * `resume`, when present, is { index, answered, total } for a session that was
 * interrupted mid-test. Coming back used to drop the reader straight onto
 * statement 35 with no sign of how they got there; now the intro says where
 * they stopped and offers to continue or start fresh.
 */
export default function Intro({ onStart, onRestart, resume = null }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ink text-bone px-6 py-16">
      <div className="w-full max-w-xl flex flex-col gap-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
          Lodestar — career-fit instrument
        </p>

        <h1 className="font-display text-4xl sm:text-5xl leading-tight">
          Answer honestly. This isn't a test you can fail.
        </h1>

        <div className="font-body text-lg leading-relaxed text-bone flex flex-col gap-4">
          <p>
            You don't have to know what you want to be. Most people don't, and
            that's nothing to be embarrassed about. This gives you somewhere to
            start looking.
          </p>
          <p>
            This is a self-report snapshot, not a verdict on who you are.
            Seventy-two statements turn into a shortlist of industries worth
            investigating, nothing more.
          </p>
          <p>
            It takes about twelve minutes. Your answers stay on this machine
            and go nowhere else.
          </p>
        </div>

        {resume ? (
          <div role="status" className="flex flex-col gap-4 border-l-2 border-brass/50 pl-4">
            <p className="font-body text-base leading-relaxed text-bone">
              You stopped at statement {resume.index + 1} of {resume.total}, with{' '}
              {resume.answered} answered. Pick up where you left off, or start fresh.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onStart}
                className="font-display text-lg px-8 py-3 bg-brass text-ink rounded-sm transition-colors hover:bg-brass/90"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="font-display text-lg px-6 py-3 rounded-sm border border-haze/40 text-bone transition-colors hover:border-brass/60"
              >
                Start fresh
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className="self-start font-display text-lg px-8 py-3 bg-brass text-ink rounded-sm transition-colors hover:bg-brass/90"
          >
            Begin
          </button>
        )}

        <p className="font-mono text-xs uppercase tracking-[0.2em] text-haze">
          Answer with 1 to 5, or click. One statement at a time, seventy-two in all.
        </p>
      </div>
    </main>
  )
}
