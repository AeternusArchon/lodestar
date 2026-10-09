import { useState } from 'react'
import { FACETS } from '../data/facets.js'
import { decodeAnswers, compareWithObserver, CODE_LENGTH } from '../engine/observer.js'
import { useLocale } from '../i18n/index.jsx'
import { BUTTON, INPUT, LINK_BOX, FIELD_LABEL, ENTRY, aside, ASIDE_TITLE, ASIDE_BODY } from './ui.js'

const FACET_BY_KEY = Object.fromEntries(FACETS.map(f => [f.key, f]))
const round = n => Math.round(n)
const signed = n => (round(n) > 0 ? `+${round(n)}` : `${round(n)}`)


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
    <li className={`${ENTRY} gap-2`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg text-bone">
          {t('observer.from', { name })}{' '}
          {observer.date && <span className="font-mono text-xs text-haze whitespace-nowrap">{observer.date}</span>}
        </h3>
        <button
          type="button"
          onClick={() => onRemove?.(observer.code)}
          aria-label={t('observer.remove', { name })}
          title={t('observer.remove', { name })}
          className="inline-flex items-center justify-center h-11 w-11 shrink-0 rounded-sm font-mono text-lg leading-none text-haze transition-colors hover:text-bone hover:bg-rust/20 print:hidden"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <p className={ASIDE_BODY}>
        {t('observer.agree', { n: agree.length, name })}
      </p>
      {differ.length > 0 && (
        <>
          <p className={ASIDE_BODY}>{t('observer.differ', { n: differ.length })}</p>
          {/*
            A grid, not a wrapping flex row: a long facet name wraps inside its
            own column and the numbers stay right-aligned in theirs, each in a
            fixed-width cell so they line up from row to row.
          */}
          <ul className="flex flex-col gap-1.5" aria-label={t('observer.from', { name })}>
            {differ.map(row => (
              <li key={row.key} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 font-body text-base text-bone">
                <span>{translateFacet(FACET_BY_KEY[row.key]).label}</span>
                <span className="font-mono text-sm text-haze whitespace-nowrap text-right">
                  {t('observer.youSaw')} <span className="inline-block w-[3ch] text-right">{round(row.self)}</span>
                  {' · '}{name} <span className="inline-block w-[3ch] text-right">{round(row.observer)}</span>{' '}
                  <span className={`inline-block w-[5ch] text-right ${Math.abs(row.delta) >= 20 ? 'text-bone underline decoration-rust decoration-2 underline-offset-4' : ''}`}>({signed(row.delta)})</span>
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
    <section id="observer" aria-label={t('observer.label')} className={`${aside()} gap-6`}>
      <h2 className={ASIDE_TITLE}>{t('observer.title')}</h2>

      <div className="flex flex-col gap-3 print:hidden">
        <h3 className={FIELD_LABEL}>{t('observer.askTitle')}</h3>
        <p className={ASIDE_BODY}>{t('observer.askIntro')}</p>
        <form onSubmit={makeLink} className="flex flex-col sm:flex-row sm:items-end gap-3">
          <label htmlFor="observer-name" className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="font-mono text-xs text-slate">{t('observer.name')}</span>
            <input id="observer-name" type="text" value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" className={INPUT} />
          </label>
          <button type="submit" className={BUTTON}>{t('observer.makeLink')}</button>
        </form>
        {link && (
          <div className="flex flex-col gap-2">
            <label htmlFor="observer-out-link" className="font-mono text-xs text-slate">{t('observer.linkOut')}</label>
            <textarea
              id="observer-out-link"
              readOnly
              rows={2}
              value={link}
              onFocus={e => e.target.select()}
              className={LINK_BOX}
            />
            <button type="button" onClick={copy} className={`self-start ${BUTTON}`}>{t('observer.copyLink')}</button>
          </div>
        )}
        <p role="status" aria-live="polite" className={`font-mono text-sm min-h-[1.25rem] ${copyStatus === 'failed' ? 'text-bone border-l-2 border-rust pl-3' : 'text-slate'}`}>
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
        <p role="status" aria-live="polite" className={`font-mono text-sm min-h-[1.25rem] print:hidden ${pasteStatus === 'bad' ? 'text-bone border-l-2 border-rust pl-3' : 'text-slate'}`}>
          {pasteStatus === 'ok' && t('observer.added')}
          {pasteStatus === 'bad' && t('observer.pasteBad')}
        </p>

        {observers.length === 0 ? (
          <p className={ASIDE_BODY}>{t('observer.nobody')}</p>
        ) : (
          <ul className="flex flex-col gap-5">
            {observers.map(o => (
              <ObserverEntry key={o.code} observer={o} profile={profile} onRemove={onRemoveObserver} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
