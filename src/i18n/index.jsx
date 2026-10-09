import { createContext, useContext, useMemo, useState } from 'react'
import en from './en.js'
import es from './es.js'
import { EXPLANATIONS } from '../data/explanations.js'

/**
 * Locale plumbing. The data files stay in English and are the single source
 * of truth for ids, keys, directions, and vectors; a locale supplies text
 * only. Anything a locale leaves out falls back to English, so a missing
 * translation reads as English rather than as a blank — and
 * tests/i18n.test.js asserts that es.js leaves nothing out, so in practice
 * the fallback is a safety net, not a feature.
 *
 * `t(key, vars)` is for UI strings, dot-pathed into the locale object.
 * `item`, `explanation`, `facet`, `industry` return the translated copy of
 * a data record, merged over the English one so engine fields (key,
 * vector, dir, authoredFacets, provenance) are never touched.
 */

export const LOCALES = { en, es }
export const LOCALE_KEY = 'lodestar.v1.locale'

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

function fill(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k])))
}

export function makeT(locale) {
  const dict = LOCALES[locale] ?? en
  return (key, vars) => {
    const s = get(dict, key) ?? get(en, key)
    if (s === undefined) return key
    return typeof s === 'string' ? fill(s, vars) : s
  }
}

/** Ordinal for a rank: "1st" in English, "1.º" in Spanish. */
export function ordinal(n, locale) {
  if (locale === 'es') return `${n}.º`
  const v = n % 100
  const suffix = ['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'
  return `${n}${suffix}`
}

export function detectLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved && LOCALES[saved]) return saved
  } catch { /* storage unavailable */ }
  const nav = (globalThis.navigator?.language ?? 'en').toLowerCase()
  return nav.startsWith('es') ? 'es' : 'en'
}

const LocaleContext = createContext(null)

export function LocaleProvider({ initial, children }) {
  const [locale, setLocaleState] = useState(() => initial ?? detectLocale())

  const value = useMemo(() => {
    const dict = LOCALES[locale] ?? en
    const t = makeT(locale)
    return {
      locale,
      setLocale(next) {
        if (!LOCALES[next]) return
        setLocaleState(next)
        try { localStorage.setItem(LOCALE_KEY, next) } catch { /* storage unavailable */ }
      },
      t,
      ordinal: n => ordinal(n, locale),
      item: q => ({ ...q, text: dict.items?.[q.id] ?? q.text }),
      explanation: id => dict.explanations?.[id] ?? EXPLANATIONS[id] ?? '',
      facet: f => ({ ...f, ...(dict.facets?.[f.key] ?? {}) }),
      industry: i => {
        const tr = dict.industries?.[i.key]
        if (!tr) return i
        return {
          ...i,
          name: tr.name ?? i.name,
          blurb: tr.blurb ?? i.blurb,
          firstMove: tr.firstMove ?? i.firstMove,
          titles: tr.titles
            ? i.titles.map((t0, idx) => ({ ...t0, title: tr.titles[idx] ?? t0.title }))
            : i.titles,
        }
      },
      dateLocale: locale === 'es' ? 'es-ES' : 'en-US',
    }
  }, [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    // Components rendered outside the provider (older tests) get English.
    const t = makeT('en')
    return {
      locale: 'en', setLocale() {}, t, ordinal: n => ordinal(n, 'en'),
      item: q => q, explanation: id => EXPLANATIONS[id] ?? '', facet: f => f, industry: i => i,
      dateLocale: 'en-US',
    }
  }
  return ctx
}
