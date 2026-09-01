# Deriving industry vectors

The O*NET release is not checked in (13 MB, and it is not ours to redistribute in
raw form). Fetch it once:

```bash
mkdir -p data-build/onet && cd data-build/onet
curl -sLO https://www.onetcenter.org/dl_files/database/db_30_3_text.zip
unzip -q db_30_3_text.zip && cd ../..
node data-build/derive-industry-vectors.mjs
```

Regenerate whenever `soc-by-industry.json` changes. The output,
`src/data/industry-vectors.json`, **is** checked in — the app must build without
the 13 MB source.

O*NET 30.3 has no Work Values data, and no usable measure of schedule freedom. The
script derives **17** of the 24 facets; the other seven are authored by hand in
`src/data/industries.js`. See spec §3.8.

## Four corrections versus the original plan

The element map in `derive-industry-vectors.mjs` was planned against O*NET's
documented content model, then checked against the actual downloaded text files.
Two things in the real release didn't match the plan, and the script was adjusted
to the data rather than the other way around:

1. **No plain `Skills.txt`.** O*NET 30.3 splits the historical Skills domain into
   `Essential Skills.txt` (2.A, basic skills) and `Transferable Skills.txt` (2.B,
   cross-functional skills). The `interpersonal` facet's element, 2.B.1.a (Social
   Perceptiveness), lives in `Transferable Skills.txt`. Scale is still `LV`, 0-7,
   unchanged.
2. **Element `4.C.3.c` ("Competition") has zero data rows in `Work Context.txt`.**
   It is a category label in the content model, not a directly surveyed item. The
   leaf element actually surveyed under it is `4.C.3.c.1` ("Level of Competition"),
   same `CX` scale, same concept, and the `riskTolerance` facet was pointed at that
   instead.

Both were confirmed empirically against the extracted `db_30_3_text/` files before
being changed — see `data-build/validate-soc.mjs`.

Two further corrections were made after review, on the meaning of the mappings rather
than on the shape of the archive:

3. **`peopleFacing` measured too little.** It originally mapped to `4.C.1.a.4`
   ("Contact With Others" — any contact, with anyone, coworkers included), which
   compressed to a 74–97 band across all 22 industries because nearly every job
   involves talking to someone. Replaced with `4.C.1.b.1.f` ("Deal With External
   Customers or the Public in General"), which spans roughly 30–84 and matches what
   "people-facing" means to a person choosing a career. Same file, same `CX` scale.
4. **`scheduleFlex` measured the wrong thing, and was removed.** It mapped to
   `4.C.3.a.4` ("Freedom to Make Decisions"), which O*NET files under 4.C.3.a
   "Criticality of Position" — decision *discretion*, not schedule freedom. The
   derived numbers said so: public safety ranked 3rd of 22, teaching outranked the
   skilled trades, and arts and entertainment came 11th. It also spanned only 24.5
   points, tighter than the mapping rejected in correction 3. No clean re-mapping
   exists — `4.C.3.d.4` and `4.C.3.d.8` are categorical `CT` elements with `CTP`
   percentage rows, not 1–5 `CX` means — so the facet was dropped from the map and is
   now authored per industry in `src/data/industries.js`, labelled in the UI as an
   editorial estimate alongside the six Values facets.

## Validating the SOC join

`data-build/validate-soc.mjs` checks that every SOC code in `soc-by-industry.json`
(1) exists in `Occupation Data.txt` with a matching title, and (2) has a data row
for every element/scale the derivation script needs, in every required source file.
Run it after editing `soc-by-industry.json` and before regenerating the output:

```bash
node data-build/validate-soc.mjs
```

A small number of occupations (Legislators, Data Scientists, Emergency Medical
Technicians, Paramedics) have Career Interest Types data but no Abilities, Skills,
or Work Context data in this O*NET release — likely because they are newly split
or atypical SOC codes without a full incumbent survey yet. The validator reports
these as gaps; the derivation script treats them as expected, non-fatal per-facet
gaps (each industry has other occupations that fully cover every facet) and prints
a warning per gap rather than failing. Three catch-all "All Other" residual SOC
codes that had *zero* data in every file were swapped out for real, fully-surveyed
occupations before this became an issue — see task-5-report.md for which ones and
why.
