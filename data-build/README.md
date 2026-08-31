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

O*NET 30.3 has no Work Values data. See spec §3.8.

## Two corrections versus the original plan

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
