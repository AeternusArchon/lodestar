import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const ONET = 'data-build/onet/db_30_3_text'
const OUT = 'src/data/industry-vectors.json'

// Scale bounds are read from O*NET's documented ranges, never inferred from the data.
const SCALE_BOUNDS = { OI: [1, 7], CX: [1, 5], LV: [0, 7], IM: [1, 5] }

// Each Lodestar facet maps to one or more O*NET elements. These are interpretations,
// not identities — disagree with them here, in one place.
//
// Two corrections versus the original plan, both forced by the actual shape of the
// O*NET 30.3 text release (verified against data-build/onet/db_30_3_text):
//   1. O*NET 30.3 has no plain "Skills.txt". The Skills domain is split into
//      "Essential Skills.txt" (2.A, basic skills) and "Transferable Skills.txt"
//      (2.B, cross-functional skills). Element 2.B.1.a (Social Perceptiveness)
//      lives in "Transferable Skills.txt"; the LV scale and 0-7 bounds are unchanged.
//   2. Element 4.C.3.c ("Competition") has zero data rows in Work Context.txt — it
//      is a category label, not a surveyed item. The leaf element actually surveyed
//      under it is 4.C.3.c.1 ("Level of Competition"), same CX scale, same concept.
const MAP = {
  // Interests: 1.B.1.a-f, scale OI
  realistic:      { scale: 'OI', els: ['1.B.1.a'], file: 'Career Interest Types.txt' },
  investigative:  { scale: 'OI', els: ['1.B.1.b'], file: 'Career Interest Types.txt' },
  artistic:       { scale: 'OI', els: ['1.B.1.c'], file: 'Career Interest Types.txt' },
  social:         { scale: 'OI', els: ['1.B.1.d'], file: 'Career Interest Types.txt' },
  enterprising:   { scale: 'OI', els: ['1.B.1.e'], file: 'Career Interest Types.txt' },
  conventional:   { scale: 'OI', els: ['1.B.1.f'], file: 'Career Interest Types.txt' },

  // Aptitudes: Abilities (LV) and Skills (LV)
  analytical:     { scale: 'LV', els: ['1.A.1.b.4', '1.A.1.b.3'], file: 'Abilities.txt' },
  verbal:         { scale: 'LV', els: ['1.A.1.a.1', '1.A.1.a.2'], file: 'Abilities.txt' },
  spatial:        { scale: 'LV', els: ['1.A.1.f.1', '1.A.1.f.2'], file: 'Abilities.txt' },
  creative:       { scale: 'LV', els: ['1.A.1.b.2', '1.A.1.b.1'], file: 'Abilities.txt' },
  interpersonal:  { scale: 'LV', els: ['2.B.1.a'],                file: 'Transferable Skills.txt' },
  organizational: { scale: 'CX', els: ['4.C.3.b.4'],              file: 'Work Context.txt' },

  // Context: Work Context, scale CX
  peopleFacing:   { scale: 'CX', els: ['4.C.1.a.4'], file: 'Work Context.txt' },
  physicality:    { scale: 'CX', els: ['4.C.2.d.1.b'], file: 'Work Context.txt' },
  structurePref:  { scale: 'CX', els: ['4.C.3.b.7'], file: 'Work Context.txt' },
  pace:           { scale: 'CX', els: ['4.C.3.d.1'], file: 'Work Context.txt' },
  riskTolerance:  { scale: 'CX', els: ['4.C.3.c.1'], file: 'Work Context.txt' },
  scheduleFlex:   { scale: 'CX', els: ['4.C.3.a.4'], file: 'Work Context.txt' },
}

function loadTable(name) {
  const path = `${ONET}/${name}`
  if (!existsSync(path)) throw new Error(`missing O*NET table: ${path}. Run data-build/README.md step 1.`)
  // The O*NET text release ships CRLF line endings. Normalise up front so no parsed
  // field — including the last tab-separated column of a row — ever carries a
  // trailing \r that could corrupt an equality check downstream.
  const [header, ...rows] = readFileSync(path, 'utf8').replace(/\r\n/g, '\n').trim().split('\n')
  const cols = header.split('\t')
  return rows.map(r => Object.fromEntries(r.split('\t').map((v, i) => [cols[i], v])))
}

const tables = new Map()
function table(name) {
  if (!tables.has(name)) tables.set(name, loadTable(name))
  return tables.get(name)
}

/** Mean data value for one SOC and one element, or null when absent/suppressed. */
function valueFor(file, soc, elementId, scaleId) {
  const rows = table(file).filter(r =>
    r['O*NET-SOC Code'] === soc &&
    r['Element ID'] === elementId &&
    r['Scale ID'] === scaleId &&
    // Work Context carries CXP category rows alongside CX means; a naive mean
    // over both is silently wrong. Accept only the non-categorical row.
    (r['Category'] === undefined || r['Category'] === 'n/a') &&
    r['Recommend Suppress'] !== 'Y'
  )
  if (rows.length === 0) return null
  return rows.reduce((a, r) => a + Number(r['Data Value']), 0) / rows.length
}

function rescale(v, scale) {
  const [lo, hi] = SCALE_BOUNDS[scale]
  return Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))
}

// Sanity-check the join before deriving anything: every SOC code used must exist in
// Occupation Data.txt. A typo here would otherwise fail silently deep inside the
// weighted-average loop.
const occupationCodes = new Set(table('Occupation Data.txt').map(r => r['O*NET-SOC Code']))
const socByIndustry = JSON.parse(readFileSync('data-build/soc-by-industry.json', 'utf8'))
for (const [industry, occupations] of Object.entries(socByIndustry)) {
  for (const occ of occupations) {
    if (!occupationCodes.has(occ.soc)) {
      throw new Error(`${industry}: SOC ${occ.soc} (${occ.title}) is not in Occupation Data.txt`)
    }
  }
}

const industries = {}
const warnings = []

for (const [industry, occupations] of Object.entries(socByIndustry)) {
  const vector = {}
  for (const [facet, spec] of Object.entries(MAP)) {
    let weighted = 0, totalWeight = 0
    for (const occ of occupations) {
      const perElement = spec.els.map(el => valueFor(spec.file, occ.soc, el, spec.scale)).filter(v => v !== null)
      if (perElement.length === 0) { warnings.push(`${industry}/${facet}: no data for ${occ.soc}`); continue }
      const mean = perElement.reduce((a, b) => a + b, 0) / perElement.length
      weighted += rescale(mean, spec.scale) * occ.weight
      totalWeight += occ.weight
    }
    if (totalWeight === 0) throw new Error(`no usable O*NET data for ${industry}/${facet}`)
    vector[facet] = Number((weighted / totalWeight).toFixed(2))
  }
  industries[industry] = vector
}

if (warnings.length) console.warn(`${warnings.length} gap(s):\n` + warnings.join('\n'))

writeFileSync(OUT, JSON.stringify({
  meta: { onetVersion: '30.3', generated: new Date().toISOString().slice(0, 10) },
  industries,
}, null, 2))

console.log(`wrote ${OUT}: ${Object.keys(industries).length} industries x ${Object.keys(MAP).length} facets`)
