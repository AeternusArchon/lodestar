import { readFileSync, writeFileSync, existsSync } from 'node:fs'

/**
 * Per-occupation facet vectors, for the drill-down under each industry card.
 *
 * The industry vectors (derive-industry-vectors.mjs) average several SOC
 * occupations into one row per industry. This script keeps the rows apart:
 * for every occupation in soc-by-industry.json it writes the same 17 derived
 * facets, so the app can rank the occupations INSIDE a shortlisted industry
 * against the respondent's profile. Still no occupation-level output at the
 * top (spec §1 non-goals): a person with no direction cannot act on 900
 * codes. But a person who has just read why Healthcare fits them can act on
 * "and inside it, these two of seven fit best".
 *
 * Two modes, decided by whether the O*NET text release is on disk:
 *
 *   - With data-build/onet present: full vectors are written.
 *   - Without it: the roster (soc, title, weight, industry) is still written
 *     with `vector: null`, and the app lists occupations unranked. The app
 *     must build and run without the 13 MB O*NET download, same as the
 *     industry vectors — but unlike those, this file is small enough that a
 *     roster-only version is a useful fallback rather than a broken one.
 *
 * The element MAP is imported from the industry script's single source of
 * truth by re-declaring it here identically; if the two ever drift, the
 * industry-level and occupation-level numbers stop meaning the same thing.
 * tests/occupations.test.js checks the facet key sets agree.
 */

const ONET = 'data-build/onet/db_30_3_text'
const OUT = 'src/data/occupations.json'

const SCALE_BOUNDS = { OI: [1, 7], CX: [1, 5], LV: [0, 7] }

// Identical to derive-industry-vectors.mjs. Keep in lockstep.
const MAP = {
  realistic:      { scale: 'OI', els: ['1.B.1.a'], file: 'Career Interest Types.txt' },
  investigative:  { scale: 'OI', els: ['1.B.1.b'], file: 'Career Interest Types.txt' },
  artistic:       { scale: 'OI', els: ['1.B.1.c'], file: 'Career Interest Types.txt' },
  social:         { scale: 'OI', els: ['1.B.1.d'], file: 'Career Interest Types.txt' },
  enterprising:   { scale: 'OI', els: ['1.B.1.e'], file: 'Career Interest Types.txt' },
  conventional:   { scale: 'OI', els: ['1.B.1.f'], file: 'Career Interest Types.txt' },
  analytical:     { scale: 'LV', els: ['1.A.1.b.4', '1.A.1.b.3'], file: 'Abilities.txt' },
  verbal:         { scale: 'LV', els: ['1.A.1.a.1', '1.A.1.a.2'], file: 'Abilities.txt' },
  spatial:        { scale: 'LV', els: ['1.A.1.f.1', '1.A.1.f.2'], file: 'Abilities.txt' },
  creative:       { scale: 'LV', els: ['1.A.1.b.2', '1.A.1.b.1'], file: 'Abilities.txt' },
  interpersonal:  { scale: 'LV', els: ['2.B.1.a'],                file: 'Transferable Skills.txt' },
  organizational: { scale: 'CX', els: ['4.C.3.b.4'],              file: 'Work Context.txt' },
  peopleFacing:   { scale: 'CX', els: ['4.C.1.b.1.f'], file: 'Work Context.txt' },
  physicality:    { scale: 'CX', els: ['4.C.2.d.1.b'], file: 'Work Context.txt' },
  structurePref:  { scale: 'CX', els: ['4.C.3.b.7'], file: 'Work Context.txt' },
  pace:           { scale: 'CX', els: ['4.C.3.d.1'], file: 'Work Context.txt' },
  riskTolerance:  { scale: 'CX', els: ['4.C.3.c.1'], file: 'Work Context.txt' },
}

const haveOnet = existsSync(ONET)

const tables = new Map()
function table(name) {
  if (!tables.has(name)) {
    const [header, ...rows] = readFileSync(`${ONET}/${name}`, 'utf8').replace(/\r\n/g, '\n').trim().split('\n')
    const cols = header.split('\t')
    tables.set(name, rows.map(r => Object.fromEntries(r.split('\t').map((v, i) => [cols[i], v]))))
  }
  return tables.get(name)
}

function valueFor(file, soc, elementId, scaleId) {
  const rows = table(file).filter(r =>
    r['O*NET-SOC Code'] === soc && r['Element ID'] === elementId && r['Scale ID'] === scaleId &&
    (r['Category'] === undefined || r['Category'] === 'n/a') && r['Recommend Suppress'] !== 'Y')
  if (rows.length === 0) return null
  return rows.reduce((a, r) => a + Number(r['Data Value']), 0) / rows.length
}

function rescale(v, scale) {
  const [lo, hi] = SCALE_BOUNDS[scale]
  return Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))
}

function vectorFor(soc) {
  const vector = {}
  for (const [facet, spec] of Object.entries(MAP)) {
    const vals = spec.els.map(el => valueFor(spec.file, soc, el, spec.scale)).filter(v => v !== null)
    if (vals.length === 0) return null // partial vectors are not comparable; skip the occupation
    vector[facet] = Number(rescale(vals.reduce((a, b) => a + b, 0) / vals.length, spec.scale).toFixed(2))
  }
  return vector
}

const socByIndustry = JSON.parse(readFileSync('data-build/soc-by-industry.json', 'utf8'))
const occupations = {}
let withVectors = 0

for (const [industry, list] of Object.entries(socByIndustry)) {
  occupations[industry] = list.map(occ => {
    const vector = haveOnet ? vectorFor(occ.soc) : null
    if (vector) withVectors++
    return { soc: occ.soc, title: occ.title, weight: occ.weight, vector }
  })
}

writeFileSync(OUT, JSON.stringify({
  meta: {
    onetVersion: '30.3',
    generated: new Date().toISOString().slice(0, 10),
    facets: Object.keys(MAP),
    vectors: haveOnet ? 'derived' : 'absent — run data-build/README.md step 1, then this script',
  },
  occupations,
}, null, 2) + '\n')

const total = Object.values(occupations).reduce((a, l) => a + l.length, 0)
console.log(`wrote ${OUT}: ${total} occupations across ${Object.keys(occupations).length} industries, ${withVectors} with vectors`)
