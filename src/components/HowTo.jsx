import LanguageToggle from './LanguageToggle.jsx'
import { useLocale } from '../i18n/index.jsx'
import { BUTTON_HERO } from './ui.js'

/**
 * One screen between the intro and the first statement. The instrument has
 * two quirks a reader cannot be expected to guess: some statements are the
 * mirror of earlier ones on purpose, and "compared with people I know" asks
 * for a comparison, not a self-image. Saying so once, before item 1, is
 * cheaper than the contradictions and flat answers it prevents.
 *
 * Skipped on a resumed session (the reader has already read it) and in
 * observer mode (the observer intro covers it).
 */
export default function HowTo({ onStart }) {
  const { t } = useLocale()

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-ink text-bone px-6 py-16">
      <LanguageToggle className="absolute top-2 right-4 sm:right-6" />
      <div className="w-full max-w-xl flex flex-col gap-8">
        <h1 className="font-display text-4xl sm:text-5xl leading-tight">{t('howto.title')}</h1>

        <div className="font-body text-lg leading-relaxed text-bone flex flex-col gap-4">
          <p>{t('howto.p1')}</p>
          <p>{t('howto.p2')}</p>
          <p>{t('howto.p3')}</p>
          <p>{t('howto.p4')}</p>
        </div>

        <button
          type="button"
          onClick={onStart}
          className={`self-start ${BUTTON_HERO}`}
        >
          {t('howto.start')}
        </button>
      </div>
    </main>
  )
}
