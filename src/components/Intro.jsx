/**
 * The opening screen. Carries the honest-scope statement (spec §1) — that this
 * is a self-report snapshot producing a shortlist to investigate, not a
 * verdict — because it matters more than any other copy in the product. Says
 * it once, plainly, and leaves the rest of the screen alone.
 */
export default function Intro({ onStart }) {
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

        <button
          type="button"
          onClick={onStart}
          className="self-start font-display text-lg px-8 py-3 bg-brass text-ink rounded-sm transition-colors hover:bg-brass/90"
        >
          Begin
        </button>

        <p className="font-mono text-xs uppercase tracking-[0.2em] text-haze">
          Answer with 1 to 5, or click. One statement at a time, seventy-two in all.
        </p>
      </div>
    </main>
  )
}
