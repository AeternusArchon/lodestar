import { LOCALES, useLocale } from '../i18n/index.jsx'

/**
 * "English | Español". Each language is named in itself (LOCALES[code].name),
 * never translated, so a reader who landed on the wrong one can still find
 * their own. The active locale is marked with aria-pressed rather than colour
 * alone; the brass fill is the visual echo of the same state.
 *
 * Exported for Results as well as Intro and HowTo, which place it themselves.
 */
export default function LanguageToggle({ className = '' }) {
  const { locale, setLocale, t } = useLocale()

  return (
    <div role="group" aria-label={t('intro.language')} className={`flex items-center gap-1 font-mono text-xs ${className}`}>
      {Object.keys(LOCALES).map((code, i) => (
        <span key={code} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true" className="text-haze">|</span>}
          <button
            type="button"
            lang={code}
            aria-pressed={locale === code}
            onClick={() => setLocale(code)}
            className={`px-2 py-1 rounded-sm transition-colors ${
              locale === code ? 'text-brass' : 'text-haze hover:text-bone'
            }`}
          >
            {LOCALES[code].name}
          </button>
        </span>
      ))}
    </div>
  )
}
