import { useState } from 'react'
import { useLocale } from '../i18n/index.jsx'

const OPTION_VALUES = [1, 2, 3, 4, 5]

/**
 * One assessment item, one viewport. A real <fieldset>/<legend>/<input
 * type="radio"> group — no ARIA substitutes — so the whole test is operable
 * with a screen reader and with the keyboard alone. Numerals sit on every
 * label so the 1-5 keyboard shortcut (bound in App) is discoverable rather
 * than secret, and the scale ends are worded ("Strongly disagree" /
 * "Strongly agree"), never colour-only.
 *
 * Under the statement sits a disclosure with a plain rewording of it
 * (explanation(item.id)). It is closed by default and App keys this component
 * by item id, so moving to another statement remounts it closed rather than
 * carrying an open note over to a sentence it does not describe. It is a
 * <button>, and a focused button receiving a digit key is harmless: App's
 * window handler only looks at modifiers, so 1-5 still answers.
 */
export default function Question({ item, value, onAnswer, index, total }) {
  const { t, item: localised, explanation } = useLocale()
  const [open, setOpen] = useState(false)
  const noteId = `${item.id}-explanation`

  return (
    <fieldset className="w-full max-w-2xl flex flex-col gap-8 border-0 m-0 p-0">
      <legend className="font-body text-2xl sm:text-3xl leading-snug text-bone p-0">
        {localised(item).text}
      </legend>
      <p className="sr-only">{t('question.of', { n: index + 1, total })}</p>

      {/*
        The legend is not a flex item of the fieldset (browsers render it
        outside the content box), so the fieldset's gap does not apply above
        this block: it carries its own top margin. A negative margin here once
        pulled the toggle up over the last line of the statement.
      */}
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={noteId}
          onClick={() => setOpen(o => !o)}
          className="group self-start inline-flex items-center gap-2 min-h-11 -ml-1 px-1 font-mono text-xs text-slate transition-colors hover:text-brass"
        >
          {/* Chevron drawn in CSS so the button's text stays exactly its label. */}
          <span aria-hidden="true" className={`inline-block before:content-['▸'] transition-transform ${open ? 'rotate-90' : ''}`} />
          <span className="underline decoration-dotted underline-offset-4">
            {open ? t('question.hide') : t('question.explain')}
          </span>
        </button>
        {open && (
          <p id={noteId} className="font-body text-base leading-relaxed text-haze border-l-2 border-haze/30 pl-4">
            {explanation(item.id)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {OPTION_VALUES.map(optValue => {
          const id = `${item.id}-${optValue}`
          return (
            <label
              key={optValue}
              htmlFor={id}
              className="flex items-center gap-4 min-h-11 rounded-sm border border-haze/30 px-4 py-3 cursor-pointer transition-colors hover:border-brass/60 has-[:checked]:border-brass has-[:checked]:bg-brass/10"
            >
              <input
                type="radio"
                id={id}
                name={item.id}
                value={optValue}
                checked={value === optValue}
                onChange={() => onAnswer(item.id, optValue)}
                className="h-4 w-4 shrink-0 accent-[var(--brass)]"
              />
              <span className="font-mono text-sm text-haze w-4 shrink-0">{optValue}</span>
              <span className="font-body text-base sm:text-lg text-bone">{t('question.options.' + optValue)}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
