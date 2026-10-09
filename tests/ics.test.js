import { describe, it, expect } from 'vitest'
import { buildIcs, retakeDate, escapeText, foldLine, icsDate } from '../src/engine/ics.js'

const encoder = new TextEncoder()
const octets = s => encoder.encode(s).length

const base = {
  title: 'Retake Lodestar',
  description: 'Take it again, unhurried.',
  url: 'https://example.org/lodestar/',
  start: new Date(Date.UTC(2026, 9, 30, 14, 0, 0)),
  uid: 'test-uid@lodestar',
  now: new Date(Date.UTC(2026, 9, 9, 8, 5, 3)),
}

/** Unfolds per RFC 5545 §3.1: a CRLF followed by one space is removed. */
const unfold = text => text.replace(/\r\n /g, '')

describe('buildIcs', () => {
  it('is a single VEVENT inside a VCALENDAR, CRLF throughout', () => {
    const ics = buildIcs(base)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1)
    // No bare LF anywhere: every \n is preceded by \r.
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
    for (const prop of ['PRODID:', 'UID:test-uid@lodestar', 'DTSTAMP:', 'DTSTART:', 'DTEND:', 'SUMMARY:', 'DESCRIPTION:', 'URL:']) {
      expect(unfold(ics), prop).toContain(`\r\n${prop}`)
    }
  })

  it('writes UTC times in the basic format, with the end after the duration', () => {
    const ics = unfold(buildIcs({ ...base, durationMinutes: 45 }))
    expect(ics).toContain('DTSTAMP:20261009T080503Z\r\n')
    expect(ics).toContain('DTSTART:20261030T140000Z\r\n')
    expect(ics).toContain('DTEND:20261030T144500Z\r\n')
  })

  it('defaults to a thirty-minute event', () => {
    expect(unfold(buildIcs(base))).toContain('DTEND:20261030T143000Z\r\n')
  })

  it('carries the url in the description as well as the URL property', () => {
    const ics = unfold(buildIcs(base))
    expect(ics).toContain('DESCRIPTION:Take it again\\, unhurried.\\nhttps://example.org/lodestar/\r\n')
    expect(ics).toContain('URL:https://example.org/lodestar/\r\n')
  })

  it('escapes commas, semicolons, backslashes and newlines in text values', () => {
    const ics = unfold(buildIcs({ ...base, title: 'a,b;c\\d\ne' }))
    expect(ics).toContain('SUMMARY:a\\,b\\;c\\\\d\\ne\r\n')
  })

  it('folds every line to at most 75 octets, without splitting a character', () => {
    const long = 'Vuelve a hacer la evaluación de afinidad profesional, sin prisa, y compárala con tu primera ronda. '.repeat(3)
    const ics = buildIcs({ ...base, description: long })
    for (const line of ics.split('\r\n')) expect(octets(line), line).toBeLessThanOrEqual(75)
    // Unfolding restores the exact escaped value.
    expect(unfold(ics)).toContain(`DESCRIPTION:${escapeText(`${long}\n${base.url}`)}\r\n`)
    // No replacement characters: nothing was cut mid-sequence.
    expect(ics).not.toContain('�')
  })

  it('generates a uid when none is given', () => {
    const ics = unfold(buildIcs({ ...base, uid: undefined }))
    expect(ics).toMatch(/\r\nUID:20261009T080503Z-[a-z0-9]+@lodestar\r\n/)
  })
})

describe('foldLine', () => {
  it('leaves a short line alone', () => {
    expect(foldLine('SUMMARY:short')).toBe('SUMMARY:short')
  })

  it('folds at exactly 75 octets, and continuation lines count their space', () => {
    const line = 'X'.repeat(200)
    const parts = foldLine(line).split('\r\n')
    expect(parts[0]).toHaveLength(75)
    for (const p of parts.slice(1)) {
      expect(p.startsWith(' ')).toBe(true)
      expect(p.length).toBeLessThanOrEqual(75)
    }
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join('')).toBe(line)
  })

  it('keeps a multibyte character whole across a fold', () => {
    // 74 ASCII octets, then a 2-octet character that would straddle 75.
    const line = 'A'.repeat(74) + 'é' + 'B'
    const parts = foldLine(line).split('\r\n')
    expect(parts[0]).toBe('A'.repeat(74))
    expect(parts[1]).toBe(' éB')
  })
})

describe('icsDate', () => {
  it('drops separators and milliseconds', () => {
    expect(icsDate(new Date(Date.UTC(2026, 0, 2, 3, 4, 5, 678)))).toBe('20260102T030405Z')
  })
})

describe('retakeDate', () => {
  it('lands 21 days later at 10:00 local time by default', () => {
    const from = new Date(2026, 9, 9, 23, 30)
    const d = retakeDate(from)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(9)
    expect(d.getDate()).toBe(30)
    expect(d.getHours()).toBe(10)
    expect(d.getMinutes()).toBe(0)
  })

  it('rolls over month and year ends', () => {
    const d = retakeDate(new Date(2026, 11, 20, 8, 0), 21)
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2027, 0, 10, 10])
  })

  it('takes a custom number of days', () => {
    const d = retakeDate(new Date(2026, 1, 27), 2)
    expect([d.getMonth(), d.getDate()]).toEqual([2, 1])
  })
})
