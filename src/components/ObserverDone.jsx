import { useState } from 'react'
import { encodeAnswers } from '../engine/observer.js'
import { useLocale } from '../i18n/index.jsx'

/**
 * What an observer sees instead of Results: no profile of their own (they
 * rated someone else, so a shortlist built from it would be meaningless to
 * them), just the link that carries their 72 answers back to the respondent.
 *
 * `name` is what the copy calls the respondent (already defaulted to "this
 * person" by the caller). The return link carries the OBSERVER's name, typed
 * here, so the respondent's results page can say who the view came from —
 * the respondent's own name was in the incoming link and would be the wrong
 * one to send back. Left blank, the view is filed under "?".
 *
 * The raw code is also shown as text. A link pasted into a chat app can be
 * mangled or stripped of its hash; the code on its own can be retyped.
 */
export default function ObserverDone({ answers, name }) {
  const { t } = useLocale()
  const [status, setStatus] = useState(null)
  const [raterName, setRaterName] = useState('')

  const code = encodeAnswers(answers)
  const link = `${location.origin}${location.pathname}#from=${encodeURIComponent(raterName.trim() || '?')}:${code}`

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard API')
      await navigator.clipboard.writeText(link)
      setStatus('ok')
    } catch {
      // Older browsers and non-secure contexts: select a throwaway textarea.
      try {
        const area = document.createElement('textarea')
        area.value = link
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(area)
        setStatus(ok ? 'ok' : 'failed')
      } catch {
        setStatus('failed')
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink text-bone px-6 py-16">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <h1 className="font-display text-4xl sm:text-5xl leading-tight">{t('observer.doneTitle')}</h1>
        <p className="font-body text-lg leading-relaxed">{t('observer.doneBody', { name })}</p>

        <label className="flex flex-col gap-1 font-mono text-xs uppercase tracking-[0.2em] text-slate">
          {t('observer.yourName')}
          <input
            type="text"
            value={raterName}
            onChange={e => { setRaterName(e.target.value); setStatus(null) }}
            className="bg-ink border border-haze/40 rounded-sm px-3 py-2 font-body text-base normal-case tracking-normal text-bone"
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            readOnly
            value={link}
            aria-label={t('observer.copyLink')}
            onFocus={e => e.target.select()}
            className="flex-1 min-w-0 bg-ink border border-haze/40 rounded-sm px-3 py-2 font-mono text-xs text-bone"
          />
          <button
            type="button"
            onClick={copy}
            className="font-display text-base px-6 py-2 rounded-sm bg-brass text-ink transition-colors hover:bg-brass/90"
          >
            {t('observer.copyLink')}
          </button>
        </div>

        <p role="status" aria-live="polite" className={`font-mono text-sm min-h-[1.25rem] ${status === 'failed' ? 'text-rust' : 'text-slate'}`}>
          {status === 'ok' && t('observer.linkCopied')}
          {status === 'failed' && t('observer.linkFailed')}
        </p>

        <p className="font-mono text-xs text-haze break-all select-all">{code}</p>
      </div>
    </main>
  )
}
