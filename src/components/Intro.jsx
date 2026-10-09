import LanguageToggle from './LanguageToggle.jsx'
import { useLocale } from '../i18n/index.jsx'
import { BUTTON_HERO } from './ui.js'

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
 *
 * `observerName`, when not null, switches the copy to the observer's version:
 * someone who was sent a link to describe the respondent. The scope statement
 * is the respondent's and does not apply; the observer copy says what they are
 * being asked to do instead. The caller has already defaulted an empty name.
 */
export default function Intro({ onStart, onRestart, resume = null, observerName = null }) {
  const { t } = useLocale()
  const observer = observerName !== null

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-ink text-bone px-6 py-16">
      <LanguageToggle className="absolute top-2 right-4 sm:right-6" />
      <div className="w-full max-w-xl flex flex-col gap-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
          {observer ? t('intro.observerKicker') : t('intro.kicker')}
        </p>

        <h1 className="font-display text-4xl sm:text-5xl leading-tight">
          {observer ? t('intro.observerTitle', { name: observerName }) : t('intro.title')}
        </h1>

        <div className="font-body text-lg leading-relaxed text-bone flex flex-col gap-4">
          {observer ? (
            <>
              <p>{t('intro.observerP1', { name: observerName })}</p>
              <p>{t('intro.observerP2')}</p>
            </>
          ) : (
            <>
              <p>{t('intro.p1')}</p>
              <p>{t('intro.p2')}</p>
              <p>{t('intro.p3')}</p>
            </>
          )}
        </div>

        {resume ? (
          <div role="status" className="flex flex-col gap-4 border-l-2 border-brass/50 pl-4">
            <p className="font-body text-base leading-relaxed text-bone">
              {t('intro.resume', { index: resume.index + 1, total: resume.total, answered: resume.answered })}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onStart}
                className={BUTTON_HERO}
              >
                {t('intro.continue')}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="inline-flex items-center justify-center min-h-11 font-display text-lg px-6 py-3 rounded-sm border border-haze/40 text-bone transition-colors hover:border-brass/60"
              >
                {t('intro.fresh')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className={`self-start ${BUTTON_HERO}`}
          >
            {t('intro.begin')}
          </button>
        )}

        <p className="font-mono text-xs uppercase tracking-[0.2em] text-haze">
          {t('intro.hint')}
        </p>
      </div>
    </main>
  )
}
