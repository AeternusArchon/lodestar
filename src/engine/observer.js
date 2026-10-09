import { QUESTIONS } from '../data/questions.js'
import { FACETS } from '../data/facets.js'
import { scoreAnswers } from './score.js'

/**
 * The observer version: someone who knows the respondent answers the same
 * 72 statements as they believe the respondent would, and the two profiles
 * are compared. Self-report is weakest exactly where a person cannot see
 * themselves clearly; a second rater is the standard remedy and costs
 * nothing here.
 *
 * No server. The link the respondent sends carries only their name; the
 * link the observer sends back carries the 72 answers packed into the URL
 * hash. Packing: each answer 1-5 becomes a base-5 digit; 72 digits are
 * read as one big integer and written in URL-safe base64 of its bytes.
 * 72 answers fit in 21 bytes, 28 characters. The order is QUESTIONS order,
 * which is fixed (questions.js), so the code is stable across builds.
 *
 * Everything here is pure; the URL itself is assembled by the UI.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const BYTES = 21 // ceil(72 * log2(5) / 8) = ceil(167.2 / 8)

function bytesToB64(bytes) {
  let bits = 0n
  for (const b of bytes) bits = (bits << 8n) | BigInt(b)
  const chars = Math.ceil((bytes.length * 8) / 6)
  let out = ''
  for (let i = chars - 1; i >= 0; i--) {
    out += ALPHABET[Number((bits >> BigInt(i * 6)) & 63n)]
  }
  return out
}

function b64ToBigInt(str) {
  let bits = 0n
  for (const ch of str) {
    const v = ALPHABET.indexOf(ch)
    if (v < 0) return null
    bits = (bits << 6n) | BigInt(v)
  }
  return bits
}

/** A complete answer map -> a 28-character URL-safe code. Throws if incomplete. */
export function encodeAnswers(answers) {
  let n = 0n
  for (const q of QUESTIONS) {
    const r = answers[q.id]
    if (!Number.isInteger(r) || r < 1 || r > 5) throw new Error(`cannot encode: ${q.id} is ${r}`)
    n = n * 5n + BigInt(r - 1)
  }
  const bytes = new Array(BYTES).fill(0)
  for (let i = BYTES - 1; i >= 0; i--) { bytes[i] = Number(n & 255n); n >>= 8n }
  return bytesToB64(bytes)
}

export const CODE_LENGTH = Math.ceil((BYTES * 8) / 6) // 28

/** A code -> answer map, or null if it does not decode to 72 valid answers. */
export function decodeAnswers(code) {
  if (typeof code !== 'string' || code.length !== CODE_LENGTH) return null
  let bits = b64ToBigInt(code)
  if (bits === null) return null
  // 28 chars carry 168 bits; the top byte boundary is 168 = 21*8 exactly, so
  // no padding bits to strip.
  let n = bits
  const digits = []
  for (let i = 0; i < QUESTIONS.length; i++) { digits.unshift(Number(n % 5n)); n /= 5n }
  if (n !== 0n) return null // more than 72 digits' worth of value: not one of ours
  const answers = {}
  QUESTIONS.forEach((q, i) => { answers[q.id] = digits[i] + 1 })
  return answers
}

/** A facet moved less than this between self and observer is called agreement. */
export const AGREE_DELTA = 10

/**
 * Compare a self profile with an observer's answers. Returns per-facet rows
 * sorted by absolute gap, plus the agree/differ split.
 */
export function compareWithObserver(selfProfile, observerAnswers) {
  const theirs = scoreAnswers(observerAnswers)
  const rows = FACETS.map(f => ({
    key: f.key,
    dimension: f.dimension,
    self: selfProfile[f.key],
    observer: theirs[f.key],
    delta: theirs[f.key] - selfProfile[f.key],
  }))
  const differ = rows.filter(r => Math.abs(r.delta) >= AGREE_DELTA)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  const agree = rows.filter(r => Math.abs(r.delta) < AGREE_DELTA)
  return { profile: theirs, rows, agree, differ }
}

/**
 * Stored observer views must be well-formed: a name string and a code that
 * decodes. Anything else is dropped.
 */
export function sanitiseObservers(value) {
  if (!Array.isArray(value)) return []
  return value.filter(o => o && typeof o.name === 'string' && typeof o.code === 'string' && decodeAnswers(o.code))
    .slice(-5)
}
