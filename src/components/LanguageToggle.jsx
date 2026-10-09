import { LOCALES, useLocale } from '../i18n/index.jsx'

/**
 * "English | Español". Each language is named in itself (LOCALES[code].name),
 * never translated, so a reader who landed on the wrong one can still find
 * their own. The active locale is marked with aria-pressed rather than colour
 * alone; the brass colour and underline are the visual echo of the same
 * state, so it does not rest on colour either. Each button is a 44px tap
 * target.
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
            className={`min-h-11 min-w-11 px-2 rounded-sm transition-colors underline-offset-4 ${
              locale === code ? 'text-brass underline' : 'text-haze hover:text-bone'
            }`}
          >
            {LOCALES[code].name}
          </button>
        </span>
      ))}
    </div>
  )
}
