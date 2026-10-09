import { useState } from 'react'
import { FACETS } from '../data/facets.js'
import { decodeAnswers, compareWithObserver, CODE_LENGTH } from '../engine/observer.js'
import { useLocale } from '../i18n/index.jsx'

const FACET_BY_KEY = Object.fromEntries(FACETS.map(f => [f.key, f]))
const round = n => Math.round(n)
const signed = n => (round(n) > 0 ? `+${round(n)}` : `${round(n)}`)

const BUTTON = 'font-display text-base px-5 py-2 rounded-sm border border-haze/40 text-bone transition-colors hover:border-brass/60'
const INPUT = 'w-full min-w-0 bg-ink border border-haze/40 rounded-sm px-3 py-2 font-body text-base text-bone focus:border-brass/60'

/**
 * Reads what a respondent pastes back: either the full link an observer sent
 * (anything containing `#from=<name>:<code>`, the same contract App.parseHash
 * reads on load) or the bare 28-character code on its own, which ObserverDone
 * prints for exactly the case where a chat app has mangled the link. A bare
 * code carries no name, so it is filed under '?'. Returns { name, code } only
 * when the code decodes to 72 valid answers, otherwise null. Never throws on
 * a malformed escape.
 */
export function parsePasted(text) {
  const raw = String(text ?? '').trim()
  const at = raw.indexOf('#from=')
  let name, code
  if (at >= 0) {
    const body = raw.slice(at + '#from='.length)
    const cut = body.lastIndexOf(':')
    if (cut < 0) return null
    try { name = decodeURIComponent(body.slice(0, cut)) } catch { return null }
    code = body.slice(cut + 1)
  } else if (raw.length === CODE_LENGTH) {
    name = '?'
    code = raw
  } else {
    return null
  }
  return decodeAnswers(code) ? { name, code } : null
}

/**
 * Copies to the clipboard: the async API first, then a throwaway textarea and
 * execCommand for older browsers and non-secure contexts. Resolves to true or
 * false; never rejects.
 */
async function copyText(text) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('no clipboard API')
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand && document.execCommand('copy')
      document.body.removeChild(area)
      return Boolean(ok)
    } catch {
      return false
    }
  }
}

/** One stored outside view, compared facet by facet with the self profile. */
function ObserverEntry({ observer, profile, onRemove }) {
  const { t, facet: translateFacet } = useLocale()
  const answers = decodeAnswers(observer.code)
  if (!answers) return null
  const { agree, differ } = compareWithObserver(profile, answers)
  const name = observer.name || '?'

  return (
    <li className="flex flex-col gap-2 border-l-2 border-slate/60 pl-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg text-bone">
          {t('observer.from', { name })}{' '}
          {observer.date && <span className="font-mono text-xs text-haze">{observer.date}</span>}
        </h3>
        <button
          type="button"
          onClick={() => onRemove?.(observer.code)}
          aria-label={t('observer.remove', { name })}
          className="font-mono text-base leading-none px-2 py-1 text-haze hover:text-rust print:hidden"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <p className="font-body text-base leading-relaxed text-haze">
        {t('observer.agree', { n: agree.length, name })}
      </p>
      {differ.length > 0 && (
        <>
          <p className="font-body text-base leading-relaxed text-haze">{t('observer.differ', { n: differ.length })}</p>
          <ul className="flex flex-col gap-1.5" aria-label={t('observer.from', { name })}>
            {differ.map(row => (
              <li key={row.key} className="flex flex-wrap items-baseline justify-between gap-x-4 font-body text-base text-bone">
                <span>{translateFacet(FACET_BY_KEY[row.key]).label}</span>
                <span className="font-mono text-sm text-haze">
                  {`${t('observer.youSaw')} ${round(row.self)} · ${name} ${round(row.observer)}`}{' '}
                  <span className={Math.abs(row.delta) >= 20 ? 'text-rust' : ''}>({signed(row.delta)})</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </li>
  )
}

/**
 * How others see you. Two halves, matching the two links in the observer
 * contract (see App.jsx): making the `#observer=<name>` link to send out, and
 * taking back the `#from=<name>:<code>` link an observer returns. A link that
 * is opened directly is consumed by App on load; pasting is for the far more
 * common case of a link that arrives in a chat app and is copied, not clicked.
 *
 * Nothing leaves the machine. The outgoing link carries only a name; the
 * incoming one carries 72 answers, which are scored here, locally.
 */
export default function ObserverView({ profile, observers = [], onAddObserver, onRemoveObserver }) {
  const { t } = useLocale()
  const [name, setName] = useState('')
  const [link, setLink] = useState(null)
  const [copyStatus, setCopyStatus] = useState(null)
  const [pasted, setPasted] = useState('')
  const [pasteStatus, setPasteStatus] = useState(null)

  function makeLink(e) {
    e.preventDefault()
    setLink(`${location.origin}${location.pathname}#observer=${encodeURIComponent(name.trim())}`)
    setCopyStatus(null)
  }

  async function copy() {
    setCopyStatus((await copyText(link)) ? 'ok' : 'failed')
  }

  function addPasted(e) {
    e.preventDefault()
    const parsed = parsePasted(pasted)
    // onAddObserver returns false when it refused the code; a handler that
    // returns nothing is taken at its word.
    if (parsed && onAddObserver?.(parsed.name, parsed.code) !== false) {
      setPasteStatus('ok')
      setPasted('')
    } else {
      setPasteStatus('bad')
    }
  }

  return (
    <section id="observer" aria-label={t('observer.label')} className="w-full max-w-2xl flex flex-col gap-6 scroll-mt-6">
      <h2 className="font-display text-2xl text-bone">{t('observer.title')}</h2>

      <div className="flex flex-col gap-3 print:hidden">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">{t('observer.askTitle')}</h3>
        <p className="font-body text-base leading-relaxed text-haze">{t('observer.askIntro')}</p>
        <form onSubmit={makeLink} className="flex flex-col sm:flex-row sm:items-end gap-3">
          <label htmlFor="observer-name" className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="font-mono text-xs text-slate">{t('observer.name')}</span>
            <input id="observer-name" type="text" value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" className={INPUT} />
          </label>
          <button type="submit" className={BUTTON}>{t('observer.makeLink')}</button>
        </form>
        {link && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              readOnly
              value={link}
              aria-label={t('observer.copyLink')}
              onFocus={e => e.target.select()}
              className="flex-1 min-w-0 bg-ink border border-haze/40 rounded-sm px-3 py-2 font-mono text-xs text-bone"
            />
            <button type="button" onClick={copy} className={BUTTON}>{t('observer.copyLink')}</button>
          </div>
        )}
        <p role="status" aria-live="polite" className={`font-mono text-sm min-h-[1.25rem] ${copyStatus === 'failed' ? 'text-rust' : 'text-slate'}`}>
          {copyStatus === 'ok' && t('observer.linkCopied')}
          {copyStatus === 'failed' && t('observer.linkFailed')}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <form onSubmit={addPasted} className="flex flex-col sm:flex-row sm:items-end gap-3 print:hidden">
          <label htmlFor="observer-paste" className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="font-mono text-xs text-slate">{t('observer.paste')}</span>
            <input id="observer-paste" type="text" value={pasted} onChange={e => { setPasted(e.target.value); setPasteStatus(null) }} className={INPUT} />
          </label>
          <button type="submit" className={BUTTON}>{t('observer.pasteButton')}</button>
        </form>
        <p role="status" aria-live="polite" className={`font-mono text-sm min-h-[1.25rem] print:hidden ${pasteStatus === 'bad' ? 'text-rust' : 'text-slate'}`}>
          {pasteStatus === 'ok' && t('observer.added')}
          {pasteStatus === 'bad' && t('observer.pasteBad')}
        </p>

        {observers.length === 0 ? (
          <p className="font-body text-base text-haze">{t('observer.nobody')}</p>
        ) : (
          <ul className="flex flex-col gap-6">
            {observers.map(o => (
              <ObserverEntry key={o.code} observer={o} profile={profile} onRemove={onRemoveObserver} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
