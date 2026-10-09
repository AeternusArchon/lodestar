/**
 * A calendar file for the retake reminder.
 *
 * The comparison against a previous run is the most honest thing the results
 * screen does, and it only exists if a second run happens. A reminder the
 * person adds while the page is open is the cheapest way to make that likely.
 * An .ics file needs no account, no server and no permission: every calendar
 * app on every platform opens one.
 *
 * Pure. This builds the RFC 5545 text and nothing else; turning it into a
 * download (Blob, object URL, an <a download>) is the UI's job.
 *
 * The spec details that matter, and that real calendar apps do enforce:
 *   - CRLF line endings, including after the last line.
 *   - Times in UTC as YYYYMMDDTHHMMSSZ, so the event lands at the same
 *     instant whatever time zone the calendar app is set to.
 *   - TEXT values escape backslash, semicolon, comma and newline (§3.3.11).
 *     URL is a URI value, not TEXT, so it is written as-is.
 *   - Content lines longer than 75 octets are folded: CRLF then one space,
 *     and the space counts against the next line's 75 (§3.1). Octets, not
 *     characters — a Spanish title is multibyte in UTF-8, and a fold must
 *     never split a character in half.
 */

const MAX_OCTETS = 75

/** 2026-10-30T14:00:00.000Z -> 20261030T140000Z */
export function icsDate(date) {
  return date.toISOString().replace(/\.\d{3}/, '').replace(/[-:]/g, '')
}

/** Escapes a TEXT property value (RFC 5545 §3.3.11). */
export function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

const encoder = new TextEncoder()
const octets = s => encoder.encode(s).length

/**
 * Folds one content line into chunks of at most 75 octets each, counting the
 * leading space on every continuation line. Splits on code points, so a
 * multibyte character always lands whole on one side of a fold.
 */
export function foldLine(line) {
  if (octets(line) <= MAX_OCTETS) return line
  const parts = []
  let current = ''
  let size = 0
  let limit = MAX_OCTETS
  for (const ch of line) {
    const n = octets(ch)
    if (size + n > limit) {
      parts.push(current)
      current = ''
      size = 0
      limit = MAX_OCTETS - 1 // the leading space takes one
    }
    current += ch
    size += n
  }
  parts.push(current)
  return parts.join('\r\n ')
}

/**
 * The date a retake should land on: `days` days after `from`, at 10:00 local
 * time — a morning slot, when twelve unhurried minutes are likeliest. Uses the
 * calendar-day constructor rather than adding milliseconds, so a daylight-
 * saving change in between does not shift the hour.
 */
export function retakeDate(from = new Date(), days = 21) {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + days, 10, 0, 0, 0)
}

/**
 * @param {object} event
 * @param {string} event.title
 * @param {string} event.description
 * @param {string} event.url              the page to come back to
 * @param {Date}   event.start
 * @param {number} [event.durationMinutes=30]
 * @param {string} [event.uid]            stable id; generated when omitted
 * @param {Date}   [event.now]            DTSTAMP; defaults to the current time
 * @returns {string} a VCALENDAR with one VEVENT, CRLF-terminated
 */
export function buildIcs({ title, description, url, start, durationMinutes = 30, uid, now = new Date() }) {
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const id = uid ?? `${icsDate(now)}-${Math.random().toString(36).slice(2, 10)}@lodestar`
  // The URL goes into the description as well: plenty of calendar apps
  // ignore the URL property, but every one of them shows the description.
  const body = url ? `${description}\n${url}` : description

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lodestar//Retake reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${id}`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(body)}`,
    ...(url ? [`URL:${url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
