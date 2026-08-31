import { readFileSync } from 'node:fs'

const ONET = 'data-build/onet/db_30_3_text'

function loadTable(name) {
  const path = `${ONET}/${name}`
  const [header, ...rows] = readFileSync(path, 'utf8').replace(/\r\n/g, '\n').trim().split('\n')
  const cols = header.split('\t')
  return rows.map(r => Object.fromEntries(r.split('\t').map((v, i) => [cols[i], v])))
}

const occData = loadTable('Occupation Data.txt')
const occByCode = new Map(occData.map(r => [r['O*NET-SOC Code'], r['Title']]))

const socByIndustry = JSON.parse(readFileSync('data-build/soc-by-industry.json', 'utf8'))

// Mirrors the facet -> element/file/scale map in derive-industry-vectors.mjs.
// Kept as a separate literal (rather than importing the script) so this file has
// no side effects beyond reading data — importing derive-industry-vectors.mjs
// would run the derivation and write the output as a side effect of validation.
const FACETS = {
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
  peopleFacing:   { scale: 'CX', els: ['4.C.1.a.4'], file: 'Work Context.txt' },
  physicality:    { scale: 'CX', els: ['4.C.2.d.1.b'], file: 'Work Context.txt' },
  structurePref:  { scale: 'CX', els: ['4.C.3.b.7'], file: 'Work Context.txt' },
  pace:           { scale: 'CX', els: ['4.C.3.d.1'], file: 'Work Context.txt' },
  riskTolerance:  { scale: 'CX', els: ['4.C.3.c.1'], file: 'Work Context.txt' },
  scheduleFlex:   { scale: 'CX', els: ['4.C.3.a.4'], file: 'Work Context.txt' },
}

let errors = 0
let titleMismatches = 0

// Step 1: every SOC exists in Occupation Data.txt, titles match
for (const [industry, occs] of Object.entries(socByIndustry)) {
  for (const occ of occs) {
    if (!occByCode.has(occ.soc)) {
      console.error(`MISSING SOC: ${industry} -> ${occ.soc} (${occ.title}) not in Occupation Data.txt`)
      errors++
    } else if (occByCode.get(occ.soc) !== occ.title) {
      console.warn(`TITLE MISMATCH: ${industry} -> ${occ.soc}: authored "${occ.title}" vs O*NET "${occByCode.get(occ.soc)}"`)
      titleMismatches++
    }
  }
}

console.log(`\nChecked ${Object.values(socByIndustry).flat().length} (industry, soc) pairs across ${Object.keys(socByIndustry).length} industries.`)
console.log(`Missing SOC codes: ${errors}`)
console.log(`Title mismatches: ${titleMismatches}`)

// Step 2: coverage check, per (industry, facet) — mirrors the derivation script's
// actual fatal condition (totalWeight === 0), not a per-SOC completeness check.
// A single occupation missing one element is an expected, non-fatal gap as long as
// some occupation in that industry covers the facet; the derivation script warns
// on the former and only throws on the latter. Failing this validator on every
// per-SOC gap would make it fail permanently on known-acceptable data (e.g. the
// four occupations noted in README.md that have Career Interest Types data but no
// Abilities/Skills/Work Context data), turning it into a gate nobody can pass.
console.log('\n--- Element coverage check (per industry x facet, like the derivation script) ---')

const fileCache = new Map()
function index(file) {
  if (fileCache.has(file)) return fileCache.get(file)
  const rows = loadTable(file)
  const set = new Set()
  for (const r of rows) {
    if (file === 'Work Context.txt' && r['Category'] !== undefined && r['Category'] !== 'n/a') continue
    if (r['Recommend Suppress'] === 'Y') continue
    set.add(`${r['O*NET-SOC Code']}|${r['Element ID']}|${r['Scale ID']}`)
  }
  fileCache.set(file, set)
  return set
}

let softGaps = 0
let hardFailures = 0
for (const [industry, occs] of Object.entries(socByIndustry)) {
  for (const [facet, spec] of Object.entries(FACETS)) {
    const idx = index(spec.file)
    let coveringWeight = 0
    for (const occ of occs) {
      const covered = spec.els.some(el => idx.has(`${occ.soc}|${el}|${spec.scale}`))
      if (covered) {
        coveringWeight += occ.weight
      } else {
        console.warn(`gap (non-fatal, other occupations cover this facet): ${industry}/${facet} has no ${spec.scale} data for ${occ.soc} in ${spec.file}`)
        softGaps++
      }
    }
    if (coveringWeight === 0) {
      console.error(`HARD FAILURE: ${industry}/${facet} has NO occupation with data — derive-industry-vectors.mjs will throw`)
      hardFailures++
    }
  }
}

console.log(`\nNon-fatal per-SOC gaps (other occupations in the industry cover the facet): ${softGaps}`)
console.log(`Hard failures (facet has zero covering weight for the industry): ${hardFailures}`)

if (errors > 0 || hardFailures > 0) {
  console.error('\nVALIDATION FAILED')
  process.exit(1)
} else {
  console.log('\nVALIDATION PASSED' + (softGaps > 0 ? ` (with ${softGaps} known non-fatal gap(s) — see warnings above)` : ''))
}
