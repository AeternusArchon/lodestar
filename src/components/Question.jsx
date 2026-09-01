const OPTIONS = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly agree' },
]

/**
 * One assessment item, one viewport. A real <fieldset>/<legend>/<input
 * type="radio"> group — no ARIA substitutes — so the whole test is operable
 * with a screen reader and with the keyboard alone. Numerals sit on every
 * label so the 1-5 keyboard shortcut (bound in App) is discoverable rather
 * than secret, and the scale ends are worded ("Strongly disagree" /
 * "Strongly agree"), never colour-only.
 */
export default function Question({ item, value, onAnswer, index, total }) {
  return (
    <fieldset className="w-full max-w-2xl flex flex-col gap-8 border-0 m-0 p-0">
      <legend className="font-body text-2xl sm:text-3xl leading-snug text-bone p-0">
        {item.text}
      </legend>
      <p className="sr-only">Question {index + 1} of {total}</p>

      <div className="flex flex-col gap-3">
        {OPTIONS.map(opt => {
          const id = `${item.id}-${opt.value}`
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className="flex items-center gap-4 rounded-sm border border-haze/30 px-4 py-3 cursor-pointer transition-colors hover:border-brass/60 has-[:checked]:border-brass has-[:checked]:bg-brass/10"
            >
              <input
                type="radio"
                id={id}
                name={item.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onAnswer(item.id, opt.value)}
                className="h-4 w-4 shrink-0 accent-[var(--brass)]"
              />
              <span className="font-mono text-sm text-haze w-4 shrink-0">{opt.value}</span>
              <span className="font-body text-base sm:text-lg text-bone">{opt.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
