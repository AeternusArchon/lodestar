import { useMemo, useState } from 'react'
import { DIMENSIONS, facetsByDimension } from '../data/facets.js'
import { centerByDimension } from '../engine/match.js'
import { useLocale } from '../i18n/index.jsx'

/**
 * Within this many centred points, the two fields are called even on a facet.
 * Smaller than any difference worth reading off a two-statement facet (see
 * engine/precision.js), so "even" never hides a real gap and a near-zero
 * difference is never dressed up as a preference.
 */
export const EVEN_WITHIN = 2

const round = n => Math.round(n)

/**
 * For each facet, which field sits closer to the respondent — measured on the
 * CENTRED values, the same shape-not-elevation comparison the ranking makes
 * (engine/match.js). Comparing raw numbers would credit a field for being
 * high across a whole dimension rather than for matching this person's
 * profile within it. Returns 'a' | 'b' | 'even' per facet key.
 */
export function favouredBy(profile, a, b) {
  const u = centerByDimension(profile)
  const ca = centerByDimension(a.vector)
  const cb = centerByDimension(b.vector)
  const out = {}
  for (const key of Object.keys(u)) {
    const da = Math.abs(ca[key] - u[key])
    const db = Math.abs(cb[key] - u[key])
    out[key] = Math.abs(da - db) <= EVEN_WITHIN ? 'even' : da < db ? 'a' : 'b'
  }
  return out
}

/**
 * Two tied (or merely adjacent) fields read the same at the top of their
 * cards: a fit percentage a point apart says nothing about what would be
 * different about the work. This puts any two shortlisted fields side by side,
 * facet by facet, with the respondent's own number alongside and a last column
 * saying which field each facet favours for them.
 *
 * `fields` are the shortlisted industry records (English, with vector and
 * authoredFacets); names are translated here. The two columns are lettered
 * A and B in their headers so the Favours column can stay one character wide
 * at phone width, where the table scrolls sideways inside its own box rather
 * than pushing the page.
 */
export default function CompareFields({ fields, profile }) {
  const { t, facet: translateFacet, industry } = useLocale()
  const [aKey, setAKey] = useState(fields[0]?.key)
  const [bKey, setBKey] = useState(fields[1]?.key)

  const a = fields.find(f => f.key === aKey) ?? fields[0]
  const b = fields.find(f => f.key === bKey) ?? fields[1]
  const favours = useMemo(() => favouredBy(profile, a, b), [profile, a, b])

  const nameOf = f => industry(f).name
  const authored = key => a.authoredFacets.includes(key) || b.authoredFacets.includes(key)

  const select = (id, label, value, onChange) => (
    <label htmlFor={id} className="flex flex-col gap-1 flex-1 min-w-0">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate">{label}</span>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-ink border border-haze/40 rounded-sm px-3 py-2 font-body text-base text-bone focus:border-brass/60"
      >
        {fields.map(f => <option key={f.key} value={f.key}>{nameOf(f)}</option>)}
      </select>
    </label>
  )

  return (
    <section id="compare" aria-label={t('compare.label')} className="w-full max-w-2xl flex flex-col gap-4 scroll-mt-6">
      <h2 className="font-display text-2xl text-bone">{t('compare.title')}</h2>
      <p className="font-body text-base leading-relaxed text-haze">{t('compare.intro')}</p>

      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        {select('compare-a', `A · ${t('compare.first')}`, a.key, setAKey)}
        {select('compare-b', `B · ${t('compare.second')}`, b.key, setBKey)}
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse font-body text-sm text-bone">
          <thead>
            <tr className="border-b border-haze/30 text-left align-bottom">
              <th scope="col" className="py-2 pr-3 font-normal" />
              <th scope="col" className="py-2 px-2 font-mono text-xs uppercase tracking-[0.15em] text-slate text-right">{t('compare.you')}</th>
              <th scope="col" className="py-2 px-2 font-mono text-xs text-slate text-right"><span className="text-brass">A</span><span className="hidden sm:inline"> · {nameOf(a)}</span></th>
              <th scope="col" className="py-2 px-2 font-mono text-xs text-slate text-right"><span className="text-brass">B</span><span className="hidden sm:inline"> · {nameOf(b)}</span></th>
              <th scope="col" className="py-2 pl-2 font-mono text-xs uppercase tracking-[0.15em] text-slate text-center">{t('compare.favours')}</th>
            </tr>
          </thead>
          {DIMENSIONS.map(dimension => (
            <tbody key={dimension}>
              <tr>
                <th scope="colgroup" colSpan={5} className="pt-4 pb-1 text-left font-mono text-xs uppercase tracking-[0.25em] text-slate font-normal">
                  {t(`dimension.${dimension}`)}
                </th>
              </tr>
              {facetsByDimension(dimension).map(f => {
                const fav = favours[f.key]
                return (
                  <tr key={f.key} data-facet={f.key} className="border-t border-haze/15">
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                      {translateFacet(f).label}
                      {authored(f.key) && <sup aria-hidden="true" className="ml-0.5 text-haze">†</sup>}
                    </th>
                    <td className="py-1.5 px-2 text-right font-mono">{round(profile[f.key])}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-haze">{round(a.vector[f.key])}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-haze">{round(b.vector[f.key])}</td>
                    <td className={`py-1.5 pl-2 text-center font-mono ${fav === 'even' ? 'text-haze' : 'text-brass'}`}>
                      {fav === 'even' ? t('compare.even') : fav === 'a' ? 'A' : 'B'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          ))}
        </table>
      </div>

      <p className="font-mono text-xs text-haze leading-relaxed">
        <span aria-hidden="true">† </span>{t('compare.note')}
      </p>
    </section>
  )
}
