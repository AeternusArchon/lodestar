# Attribution

This product includes information from the O*NET 30.3 Database by the U.S. Department of Labor, Employment and Training Administration. Used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA. Lodestar has modified this information; O*NET has not approved, endorsed, or tested these modifications.

- O*NET Database: https://www.onetcenter.org/database.html
- Licence (CC BY 4.0): https://creativecommons.org/licenses/by/4.0/

The O*NET bulk database is used, not the O*NET Web Services API — the API operates
under a separate, non-transferable license that does not grant redistribution rights
to an app's users.

## What is derived and what is not

**Interests, Aptitudes, and Context** — the eighteen facets in these three dimensions,
for every one of the 22 industry vectors, are derived from the O*NET 30.3 bulk database
by `data-build/derive-industry-vectors.mjs`. See `data-build/README.md` for how to
regenerate them and the two corrections made against the documented content model
while doing so.

**Values — not from O*NET.** The six Values facets on every industry vector are
Lodestar's own editorial estimates, not O*NET data. Work Values was removed from the
O*NET Content Model: the 1.B branch runs 1.B.1 straight to 1.B.3, skipping the
reinforcer element that would have carried this data, and no per-occupation Work
Values data exists anywhere in the 30.3 release. Those six numbers per industry were
written by hand and are labelled as editorial estimates wherever they appear in the
UI — they carry no O*NET provenance and should be weighted accordingly by anyone
relying on them.

**The SOC-to-industry join** — `data-build/soc-by-industry.json`, which maps SOC
occupation codes onto Lodestar's 22 industries, is built from the BLS
Industry-Occupation Matrix, a US Government work and public domain. It carries no
license restriction.
