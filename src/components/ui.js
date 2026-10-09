/**
 * Shared class strings, so the same control or block looks the same on every
 * screen. Tailwind utilities only; nothing here adds a colour outside the six
 * tokens.
 *
 * Every button and form control is at least 44px tall (min-h-11) so it is a
 * comfortable tap target at phone width.
 */

/** Secondary action: outlined. */
export const BUTTON =
  'inline-flex items-center justify-center min-h-11 font-display text-base px-5 py-2 rounded-sm border border-haze/40 text-bone transition-colors hover:border-brass/60 disabled:opacity-30 disabled:cursor-not-allowed'

/** Primary action: brass fill. Same box as BUTTON so the two line up in a row. */
export const BUTTON_PRIMARY =
  'inline-flex items-center justify-center min-h-11 font-display text-base px-5 py-2 rounded-sm border border-brass bg-brass text-ink transition-colors hover:bg-brass/90 disabled:opacity-30 disabled:cursor-not-allowed'

/** Large primary call to action on the single-message screens. */
export const BUTTON_HERO =
  'inline-flex items-center justify-center min-h-11 font-display text-lg px-8 py-3 rounded-sm border border-brass bg-brass text-ink transition-colors hover:bg-brass/90'

/** Destructive: wipes the run. Never styled like Copy or Print. */
export const BUTTON_DANGER =
  'inline-flex items-center justify-center min-h-11 font-display text-base px-5 py-2 rounded-sm border border-rust/70 text-bone transition-colors hover:border-rust hover:bg-rust/10'

export const INPUT =
  'w-full min-w-0 min-h-11 bg-ink border border-haze/40 rounded-sm px-3 py-2 font-body text-base text-bone focus:border-brass/60'

/** A readonly, wrapping box for a link that has to be seen whole. */
export const LINK_BOX =
  'w-full min-w-0 resize-none bg-ink border border-haze/40 rounded-sm px-3 py-2 font-mono text-xs leading-relaxed text-bone break-all'

/** Small mono field label. */
export const FIELD_LABEL = 'font-mono text-xs uppercase tracking-[0.2em] text-slate'

/**
 * The aside: a secondary block that qualifies or follows up the main result -
 * draft banner, near-misses, versus last run, reminder, outside view,
 * self-employment note, the numbers note. One treatment for all of them: a
 * left rule, an xl heading, body copy. The rule colour defaults to haze;
 * callers pass 'warn' or 'note' where the block is a caution or a
 * highlight, and the heading always says which, so colour is never the only
 * cue.
 */
const ASIDE_BASE = 'w-full max-w-2xl flex flex-col gap-3 border-l-2 pl-4 sm:pl-6 scroll-mt-6'
const ASIDE_TONE = { plain: 'border-haze/30', warn: 'border-rust/70', note: 'border-brass/50' }
export const aside = (tone = 'plain') => `${ASIDE_BASE} ${ASIDE_TONE[tone]}`
export const ASIDE_TITLE = 'font-display text-xl text-bone'
export const ASIDE_BODY = 'font-body text-base leading-relaxed text-haze'

/** A major section heading (shortlist tools, full profile). */
export const SECTION_TITLE = 'font-display text-2xl sm:text-3xl text-bone'

/** Hairline-separated entries inside an aside (instead of nested rules). */
export const ENTRY = 'flex flex-col gap-1 border-t border-haze/20 pt-3'
