import { useState } from 'react'
import { encodeAnswers } from '../engine/observer.js'
import { useLocale } from '../i18n/index.jsx'
import { BUTTON_PRIMARY, FIELD_LABEL, INPUT, LINK_BOX } from './ui.js'

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

        <label htmlFor="observer-rater" className="flex flex-col gap-2">
          <span className={FIELD_LABEL}>{t('observer.yourName')}</span>
          <input
            id="observer-rater"
            type="text"
            value={raterName}
            onChange={e => { setRaterName(e.target.value); setStatus(null) }}
            className={INPUT}
          />
        </label>

        {/*
          A wrapping readonly textarea rather than a one-line input: the link
          is the whole point of this screen, and an input showed about forty
          characters of it with the code itself scrolled out of sight.
        */}
        <div className="flex flex-col gap-2">
          <label htmlFor="observer-return-link" className={FIELD_LABEL}>{t('observer.linkBack')}</label>
          <textarea
            id="observer-return-link"
            readOnly
            rows={3}
            value={link}
            onFocus={e => e.target.select()}
            className={LINK_BOX}
          />
          <button type="button" onClick={copy} className={`self-start ${BUTTON_PRIMARY}`}>
            {t('observer.copyLink')}
          </button>
        </div>

        <p role="status" aria-live="polite" className={`font-mono text-sm min-h-[1.25rem] ${status === 'failed' ? 'text-bone border-l-2 border-rust pl-3' : 'text-slate'}`}>
          {status === 'ok' && t('observer.linkCopied')}
          {status === 'failed' && t('observer.linkFailed')}
        </p>

        <div className="flex flex-col gap-2 border-t border-haze/20 pt-4">
          <p className="font-body text-sm leading-relaxed text-haze">{t('observer.codeLabel')}</p>
          <p className="font-mono text-sm text-bone break-all select-all">{code}</p>
        </div>
      </div>
    </main>
  )
}
