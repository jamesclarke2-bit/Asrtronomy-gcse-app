# Topic 11 (11.1–11.12), Topic 14 (14.1–14.11), Topic 15 (15.1–15.14) and Topic 16 (16.1–16.12) coverage audit

Read-only audit. No page, note, sim or question bank was edited to produce this — only
`src/specPoints.js`, `src/curriculum.js`, `src/pages.js` and this new file, as instructed.
Ratings use the stricter bar given for this audit: **COVERED** requires visible page text, a
diagram/sim where one would help, AND at least one practice question that actually tests the
point — a passing glossary-only mention, or a diagram/question that tests something else nearby,
is **PARTIAL** at best. **MISSING** means no real treatment anywhere on the site.

Audited against the repo at commit `34e5d8f` (branch `claude/solar-position-calculator-sr5fg1`,
merged to `main`). Same registry rules as the previous audit (R9-2): lettered sub-points stay
inside one `SPEC_POINTS` entry (no splitting), there is no core/stretch field, and a PARTIAL or
MISSING point is never tagged as covered on any curriculum subtopic.

## Totals

| Status | Topic 11 (of 12) | Topic 14 (of 11) | Topic 15 (of 14) | Topic 16 (of 12) | Total (of 49) |
|---|---|---|---|---|---|
| COVERED | 12 | 0 | 0 | 0 | 12 |
| PARTIAL | 0 | 2 | 2 | 0 | 4 |
| MISSING | 0 | 9 | 12 | 12 | 33 |

Updated 2026-11-12: 11.1, 11.5 and 11.7 moved PARTIAL &rarr; COVERED after dedicated questions
(and, for 11.7, migration content) closed each gap below — see the full table's `where` column
for each.

## Full table

| id | status | where | gap | recommendation |
|---|---|---|---|---|
| 11.1 | COVERED | `notes/solar-system-bodies.html` §`planet-data`/§`small-bodies`; question `relative-location-ordering` (orders Earth, the asteroid belt and Pluto by distance, reading the temperature-distance chart) | — | — |
| 11.2 | COVERED | `notes/solar-system-bodies.html` §`comets` (nucleus/coma/tail glossary defs, `comet-diagram` canvas); question `comet-tail-direction` | — | — |
| 11.3 | COVERED | §`comets` (`comet-diagram`, `kuiper-oort-diagram`); question `comet-origin` | — | — |
| 11.4 | COVERED | §`comets`; question `ecliptic-oort-cloud` (u3.23) | — | — |
| 11.5 | COVERED | §`comets` note on the heliosphere; `kuiper-oort-diagram`; question `heliosphere-kuiper-oort-nature` (which region is the roughly spherical shell) | — | — |
| 11.6 | COVERED | §`planet-data` (size bar chart, temperature chart, moons/rings diagrams); questions `relative-size-calculation`, `relative-mass-comparison`. Coverage is uneven across the six sub-characteristics (temperature/satellites/rings are diagram-rich but question-thin) but the point as a whole clears the bar | Atmosphere column flagged "first draft, not from the data sheet" | Could use a question on temperature or satellites/rings specifically |
| 11.7 | COVERED | §`formation` h3 "Why gas giants are gas giants" (`gas-giant-formation-diagram`, now with a migration note); migration text (first-draft); question `gas-giant-formation-and-current-position` (tests both formation and current position, via "hot Jupiters") | — | — |
| 11.8 | COVERED | `notes/scale-of-the-solar-system.html` (log-scale distance ladder); questions `convert-km-to-au`, `convert-au-to-km` etc. (`src/scaleOfSolarSystemQuestions.js`), tagged `spec: ['7.5', '11.8']` on u3.3 | — | — |
| 11.9 | COVERED | Same page, §`distance-units` table; questions `convert-ly-to-km`, `convert-parsec-to-ly`, light-travel-time questions, tagged `spec: ['7.6', '11.9']` on u3.4 | — | — |
| 11.10 | COVERED | `notes/solar-system-bodies.html` §`meteoroids-ecliptic` (stony/iron/stony-iron classification); question `meteoroid-meteor-meteorite` | — | — |
| 11.11 | COVERED | §`meteoroids-ecliptic`; `sims/solar-system-observation.html`'s zodiac-strip diagram; question `ecliptic-oort-cloud` | — | — |
| 11.12 | COVERED | §`transits-of-venus` (names Halley; `transit-of-venus-diagram`); question `transit-of-venus-parallax` | — | — |
| 14.1 | COVERED (2026-11-17) | `notes/catalogues-and-star-names.html` §`catalogues` (a Messier/NGC extract table, and a drawing of each object's type, chosen by its catalogue number); questions `cn-messier-why`, `cn-m31-means`, `cn-find-globular`, `cn-ngc-of-m42`, `cn-use-extract`, `cn-ngc-only` (u4.13) | — | — |
| 14.2 | COVERED (2026-11-17) | `notes/catalogues-and-star-names.html` §`star-names` (Orion drawn from real positions, tap a star for its proper, Bayer, Flamsteed and HD names) and §`bayer` (Greek-letter table, genitive table, and a chart showing the letters only roughly follow brightness); questions `cn-decode-beta-per`, `cn-decode-gamma-cyg`, `cn-alpha`, `cn-orion-exception`, `cn-name-sirius`, `cn-decode-vega`, `cn-greek-order`, `cn-flamsteed` (u4.13) | — | — |
| 14.3 | COVERED (2026-11-18) | `notes/sun-like-star.html` §`balance` (force arrows for the main-sequence star: gravity inward, radiation pressure outward, equal); questions `sl-ms-balance`, `sl-ms-unbalanced` (u4.14) | — | — |
| 14.4 | COVERED (2026-11-18) | `notes/sun-like-star.html` §`balance` (the same force-arrow diagram redrawn for every stage: protostar shrinking, red giant swelling, planetary nebula escaping) and §`hr-track`; questions `sl-protostar`, `sl-red-giant` (u4.14) | — | — |
| 14.5 | COVERED (2026-11-18) | `notes/sun-like-star.html` §`balance`, white-dwarf stage (electron pressure against gravity, no fusion); questions `sl-white-dwarf`, `sl-white-dwarf-why` (u4.14) | — | — |
| 14.6 | COVERED (2026-11-19) | `notes/massive-stars.html` §`balance` (force arrows redrawn for each stage: steady main sequence, swelling supergiant, collapsing supernova core); questions `mv-supernova-why`, `mv-supergiant-balance` (u4.15) | — | — |
| 14.7 | COVERED (2026-11-19) | `notes/massive-stars.html` §`balance`, neutron-star stage ("neutron pressure (outward)" against gravity); questions `mv-neutron-pressure`, `mv-neutron-size` (u4.15) | — | — |
| 14.8 | COVERED (2026-11-19) | `notes/massive-stars.html` §`chandrasekhar` (a core-mass slider across white dwarf, neutron star and black hole zones, with the limit marked); questions `mv-limit-decides`, `mv-which-end` (u4.15) | — | — |
| 14.9 | COVERED (2026-11-18) | `notes/sun-like-star.html` §`life-cycle` (a drawing for each of the seven stages, emission/absorption nebula to black dwarf) and §`timescales` (table and log-scale timeline); questions `sl-order`, `sl-core`, `sl-longest`, `sl-black-dwarf`, `sl-planetary`, `sl-nebula-types` (u4.14) | — | — |
| 14.10 | COVERED (2026-11-19) | `notes/massive-stars.html` §`life-cycle` (a drawing for each stage, nebula to neutron star or black hole) and §`timescales` (table and log-scale timeline with the Sun-like main sequence for comparison); questions `mv-order`, `mv-ms-shorter`, `mv-timescales`, `mv-supergiant-core` (u4.15) | — | — |
| 14.11 | COVERED (2026-11-20) | `notes/black-holes.html` §`invisible` (an X-ray binary drawn: gas from a star heated in an accretion disc), §`x-ray-binaries` (the two orbits round the centre of mass and a mass check against the white-dwarf and neutron-star limits) and §`galactic-centre` (a year slider moving S2 round its orbit about the unseen mass, and M = a³ ÷ T²); questions `bh-how-know`, `bh-xray-why`, `bh-too-heavy`, `bh-orbits`, `bh-infrared`, `bh-s2-fast`, `bh-mass-calc`, `bh-supermassive`, `bh-cygnus` (u4.16) | — | — |
| 15.1 | COVERED (2026-11-21) | `notes/our-galaxy.html` §`from-earth` (a drawn night sky with the Milky Way band, dark dust lanes and a binocular circle breaking it into stars); questions `gx-binoculars`, `gx-band`, `gx-dark-lanes` (u4.4) | — | — |
| 15.2 | COVERED (2026-11-21) | `notes/our-galaxy.html` §`shape` (the Galaxy drawn face-on and edge-on, a toggle: bar, arms, dust lanes, star-forming regions, globular clusters in the halo, the Sun, a 100,000 light-year scale bar); questions `gx-size`, `gx-place` (lettered drawing), `gx-star-forming` (u4.4) | — | — |
| 15.3 | COVERED (2026-11-21) | `notes/our-galaxy.html` §`radio-map` (a line of sight from the Sun, turned by a slider, crossing lettered arms, with each arm's Doppler-shifted 21 cm peak); questions `gx-why-not-light`, `gx-why-21cm`, `gx-shift`, `gx-rotation` (u4.4) | — | — |
| 15.4 | COVERED (2026-11-22) | `notes/local-group.html` §`local-group` ("the group of galaxies gravitationally linked to the Milky Way", with the drawn map inside its rough boundary); questions `lg-what`, `lg-held` (u6.5) | — | — |
| 15.5 | COVERED (2026-11-22) | `notes/local-group.html` §`local-group` (a drawn map with M31, M33, the Milky Way and a close-up with the LMC and SMC, each marked by shape, scale bars, and a table of distances in pc and light-years; LMC and M31 distances from the Variable stars Cepheids); questions `lg-largest`, `lg-satellites`, `lg-types`, `lg-m31-distance`, `lg-lmc-ly` (u6.5) | — | — |
| 15.6 | COVERED (2026-11-22) | `notes/galaxy-types.html` §`classify` (eight drawn galaxies to sort into spiral, barred spiral, elliptical and irregular, with feedback); questions `gt-classify-elliptical`, `gt-classify-barred`, `gt-classify-irregular`, `gt-classify-spiral` (all drawn), `gt-bar-or-not` (u6.6) | — | — |
| 15.7 | COVERED (2026-11-22) | `notes/galaxy-types.html` §`tuning-fork` (a drawn tuning fork: E0-E7 on the handle, S0 at the fork, Sa-Sc and SBa-SBc on the prongs, irregulars apart, the Milky Way ringed at SBb); questions `gt-fork-parts`, `gt-e-number`, `gt-a-to-c`, `gt-irregular-place`, `gt-evolution`, `gt-milky-way` (u6.6) | — | — |
| 15.8 | COVERED (2026-11-21) | `notes/our-galaxy.html` §`shape` (the bar labelled; "barred spiral, type SBb" in the text); question `gx-type` (u4.4) | — | — |
| 15.9 | COVERED (2026-11-23) | `notes/active-galaxies.html` §`agn` ("huge amounts of radiation beyond visible light", the AGN drawn) and §`spectrum` (a strip of five bands, each showing a part); question `ag-beyond` (u6.7) | — | — |
| 15.10 | COVERED (2026-11-23) | `notes/active-galaxies.html` §`agn` (the AGN drawn: supermassive black hole, accretion disc, dusty ring, jets, gas falling in; "powered by matter falling onto a supermassive black hole"); questions `ag-power`, `ag-parts` (lettered drawing) (u6.7) | — | — |
| 15.11 | COVERED (2026-11-23) | `notes/active-galaxies.html` §`types` (a viewing-angle slider and power buttons redrawing what you see: Seyfert, quasar or blazar); questions `ag-match`, `ag-quasar-name`, `ag-blazar` (u6.7) | — | — |
| 15.12 | COVERED (2026-11-23) | `notes/active-galaxies.html` §`spectrum` (radio, infrared, visible/UV, X-ray and gamma-ray rows, each with the part of the AGN it shows ringed); questions `ag-bands`, `ag-why-many` (u6.7) | — | — |
| 15.13 | COVERED (2026-11-22) | `notes/local-group.html` §`bigger` (a four-step zoom out, Local Group to cluster to supercluster to cosmic web, each with a box the size of the previous view, and why gravity groups galaxies); questions `lg-why-clusters`, `lg-ladder`, `lg-voids` (u6.5) | — | — |
| 15.14 | COVERED (2026-11-23) | `notes/galaxy-formation.html` §`top-down`, §`bottom-up` and §`mergers` (each a drawing in four steps, chosen by buttons); questions `gf-theories`, `gf-gravity`, `gf-disc`, `gf-halo`, `gf-evidence`, `gf-merger-result`, `gf-collision`, `gf-milky-way` (u6.8) | — | — |
| 16.1 | COVERED (2026-11-25) | `notes/redshift.html` §`shifted` (a galaxy's hydrogen lines drawn against a laboratory's, moved to longer wavelengths by a speed slider; galaxies outside the Local Group); questions `rs-what`, `rs-which` (u6.1) | — | — |
| 16.2 | COVERED (2026-11-25) | `notes/redshift.html` §`why` (two rows of waves: a still galaxy, and a receding one whose waves arrive stretched); questions `rs-cause`, `rs-faster` (u6.1) | — | — |
| 16.3 | COVERED (2026-11-25) | `notes/redshift.html` §`calculate` (the relation in words, rearranged in steps for v and for the observed wavelength; a practice drawing of three made-up galaxies with a worked example and a checker); questions `rs-rearrange`, `rs-find-v`, `rs-find-observed`, `rs-units` (u6.1); `notes/data-sheet.html` now links here | — | — |
| 16.4 | COVERED (2026-11-25) | `notes/hubble-law.html` §`evidence` (three galaxies at increasing distance, each with a bigger redshift, and a graph of the three on a straight line through the origin; Cepheid distances plus redshift speeds); questions `hb-evidence`, `hb-graph` (u6.2) | — | — |
| 16.5 | COVERED (2026-11-25) | `notes/hubble-law.html` §`graph` (v = H0 × d and d = v ÷ H0 with worked examples; an interactive Hubble graph with error bars, best-fit, steepest and shallowest lines, uncertainty as half the range, and a nearby-only set showing a wider range of distances reduces the percentage uncertainty); questions `hb-find-v`, `hb-find-d`, `hb-gradient` (drawn graph), `hb-uncertainty`, `hb-wider` (u6.2); `notes/data-sheet.html` now links here | — | — |
| 16.6 | COVERED (2026-11-25) | `notes/hubble-law.html` §`age` (run-the-expansion-backwards drawing, age ≈ 1 ÷ H0 with every unit conversion in steps, size ≈ c × age drawn as a circle; both called simple estimates); questions `hb-age`, `hb-size`, `hb-estimate` (u6.2) | — | — |
| 16.7 | COVERED (2026-11-26) | `notes/big-bang-steady-state.html` §`two-theories` (a patch of space in both theories, side by side, four steps: thinning out against new galaxies in the gaps) and §`deciding` (what each predicts for the distant past; expansion alone fits both); questions `bb-expansion-alone`, `bb-start`, `bb-new-matter`, `bb-density`, `bb-past`, `bb-what-decides`, `bb-match` (u6.9) | — | — |
| 16.8 | COVERED (2026-11-26) | `notes/big-bang-evidence.html` §`quasars` (a schematic count of quasars by distance: none nearby), §`cmb` (microwaves from every direction and the CMB's spectrum drawn) and §`deep-field` (a drawing of the Deep Field with its distant galaxies ringed on demand); questions `ev-quasars`, `ev-cmb`, `ev-cmb-steady`, `ev-deep-field`, `ev-lookback`, `ev-match` (u6.3) | — | — |
| 16.9 | COVERED (2026-11-26) | `notes/big-bang-evidence.html` §`fluctuations` (a drawn all-sky map shaded and marked + and −, with a coarse-to-fine slider: early map, WMAP, Planck; the seeds of galaxies and why the pattern tests theories); questions `ev-seeds`, `ev-why-matter`, `ev-wmap-planck` (u6.3) | — | — |
| 16.10 | COVERED (2026-11-27) | `notes/dark-universe.html` §`dark-matter` (a rotation curve: measured speed flat at Our Galaxy's 220 km/s against the falling visible-matter curve; other evidence and possible natures) and §`dark-energy` (the expansion speeding up, from distant supernovae; a bar of the Universe's make-up told apart by pattern); questions `du-read-curve` (reads the drawn rotation curve), `du-flat-means`, `du-nature`, `du-supernovae`, `du-biggest-share` (u6.4) | — | — |
| 16.11 | COVERED (2026-11-27) | `notes/dark-universe.html` §`detecting` (a star giving out light, a gas cloud absorbing it, dark matter doing neither and showing itself only by bending light with its gravity; direct searches have found nothing); questions `du-hard-to-detect`, `du-searches` (u6.4) | — | — |
| 16.12 | COVERED (2026-11-27) | `notes/dark-universe.html` §`future` (a graph of the size of the Universe against time for four model futures, with buttons for the balance of matter and dark energy that redraw the chosen future; the favoured one named as first draft); questions `du-lots-of-matter`, `du-favoured`, `du-match-futures` (u6.4) | — | — |

## Part 2 — registration

- **11.1–11.12**: already registered in `src/specPoints.js` with depths that already match the
  given list exactly (`be able to`: 11.1, 11.8, 11.9; `know`: 11.11; `understand`: everything
  else) — **no fix needed**.
- **14.1–16.12** (37 points): added to `src/specPoints.js`, same `{code, topic, depth, text}`
  shape as Topics 11/13, no lettered sub-codes split out, depths taken exactly from the list
  given rather than inferred.
- **Tagging change (PARTIAL points un-tagged):** `src/curriculum.js` had `11.1`, `11.5` and `11.7`
  already tagged on `u3.16`/`u3.17`, `u3.20` and `u3.21` respectively, from before this stricter
  bar existed. Since this audit rates all three PARTIAL, not COVERED, they have been **removed**
  from those subtopics' `spec` arrays (comments left explaining why, pointing at this file). No
  new tags were needed for 14–16, since nothing in either topic clears the COVERED bar yet.
- **`COMING_SOON` (`src/pages.js`)**: a stale pair was also found and fixed while touching this
  array — `13.22` and `13.30` were still listed as unbuilt in the "Stars, galaxies and the
  Universe" step even though a previous task already covered them on
  `notes/earth-structure.html`; both are now removed from that list. A new step, "Rounding out the
  Solar System overview" (phase "The Solar System and gravity"), was added for `11.1`, `11.5` and
  `11.7`, and the old `topics: [14, 15, 16]` entry on "Stellar Evolution, the Galaxy and Cosmology"
  was replaced with an explicit `specPoints` list of all 37 new codes (every position in
  `PAGES`/`COMING_SOON` from 27 onward shifted by +1 to make room for the new step; no page's
  `href` or `units` changed).

### New totals

| | Raw (Syllabus Review) | Covered | Not built | Flagged thin | Rolled-up (Syllabus Map) |
|---|---|---|---|---|---|
| Before this task | 192 | 151 | 41 | 30 | 178 |
| After this task | 229 | 148 | 81 | 30 | 215 |

Covered dropped by 3 (151 → 148) from un-tagging 11.1/11.5/11.7. Not built rose by 37 (the new,
still-unbuilt Topic 14–16 points) plus 3 (11.1/11.5/11.7, now correctly "not built" instead of
miscounted as covered) = +40, landing at 81. Flagged thin is unaffected (it only ever applies to
covered points).

**Update 2026-11-12:** 11.1, 11.5 and 11.7 each gained a dedicated question (11.7 also gained
migration text), closing the gap the `where`/`gap` columns above described. All three now clear
the strict COVERED bar and are re-tagged in `src/curriculum.js`. Covered: 148 → 151; not built:
81 → 78 (229 total, 30 flagged thin, unchanged) — matching `docs/syllabus-review.md`'s own
regenerated totals.

**Update 2026-11-12 (later same day):** `13.30` (Topic 13, audited separately in
`docs/topic-11-13-audit.md`, rated PARTIAL there — `notes/earth-structure.html` names it but has
no dedicated diagram) was still tagged covered in `src/curriculum.js`. Untagged on u2.33 and
added back to the "Stars, galaxies and the Universe" coming-soon step's `specPoints`, until
either that page or `earth-structure.html` gives it a diagram. Covered: 151 → 150; not built:
78 → 79; flagged thin: 30 → 29 (229 total) — the tap-reveal-heavy flag no longer applies to an
un-covered point.

## Part 3 — overlaps: who should own each idea

- **Stellar life cycle — 13.8 vs 14.3–14.10.** `13.8` ("how a star's life cycle relates to its
  position on the HR diagram") is registered but **unbuilt** — `notes/magnitude.html` has no
  HR diagram, spectral-type or giant/dwarf/supergiant content at all, and `13.4`–`13.8` are still
  listed together in `COMING_SOON`'s "Stars, galaxies and the Universe" step. So there is
  currently nothing for 14.3–14.10 to overlap with in substance, but the two *will* tell the same
  story twice once both are built: 13.8 is "where a star sits on the HR diagram, and what that
  position means", while 14.3–14.10 is "the physics driving it there and what happens next". A
  single stellar-evolution page, with one HR-diagram-plus-life-cycle figure, should own both,
  rather than building the HR diagram on `magnitude.html` and the life cycle somewhere else.
- **Doppler shift / radial velocity — 13.4c vs 16.2, 16.3.** `13.4`'s text already names "radial
  velocity" as one of three things learnable from a stellar spectrum, but **no page anywhere
  explains or computes radial velocity from a spectrum** — it's registered-but-unbuilt, the same
  as 13.8. 16.2 (redshift = recession) and 16.3 (the redshift formula) are also unbuilt. All three
  are the same underlying idea (Doppler shift of spectral lines) applied at two different scales
  (a single star's radial velocity vs. a whole galaxy's recession) — a single future page (most
  naturally the redshift/Big Bang page 16.1–16.9 needs) should derive the Doppler relationship
  once and let 13.4c cite it rather than re-deriving it for stars alone.
- **Quasars and active galaxies — 13.27 vs 15.9–15.12 vs 16.8a.** `13.27` ("radio astronomy's role
  in the discovery of quasars, jets from black holes, the Milky Way's structure and protoplanetary
  discs") is registered but unbuilt. 15.9–15.12 (AGN family: Seyferts, quasars, blazars) and
  16.8a (quasars as Big Bang evidence) are all unbuilt too. These are three different *angles* on
  the same object (quasar = extreme AGN = early-universe evidence) — recommend one page covering
  radio astronomy + AGN/quasars that satisfies 13.27 and 15.9–15.12 together, with 16.8a's own
  future Big Bang page linking back to it rather than re-explaining what a quasar is.
- **Clusters — 13.17 vs 15.2 vs 15.13.** `13.17` ("structure of gravitationally bound groupings
  such as binary stars and clusters") is registered but unbuilt. 15.2's globular clusters and
  15.13's galaxy clusters/superclusters are also unbuilt. Stellar clusters (13.17, 15.2) and
  galaxy clusters (15.13) are genuinely different scales and physics, so recommend keeping galaxy
  clusters/superclusters on the future Galaxy page (with 15.2) and letting 13.17 own stellar/
  binary clusters on whichever page ends up covering binary stars and open/globular clusters at
  the stellar level — not one page trying to do both scales at once.
- **How a telescope shows galaxies — 13.34 vs 15.6.** `13.34` ("how a telescope alters the
  appearance of ... nebulae and galaxies") is registered but unbuilt (only its stars/double-star/
  cluster sub-parts are indirectly touched by `notes/telescopes.html`'s double-star and
  star-cluster sims — galaxies specifically are not). 15.6 (Hubble classification) is also
  unbuilt. A single page showing real telescope images of spiral/barred-spiral/elliptical/
  irregular galaxies, used both to teach the classification (15.6) and to show what a telescope
  actually reveals about their shape (13.34's own galaxy clause), would satisfy both without
  duplicating the images.
- **Distance units — 11.9 vs 13.10–13.12.** No overlap found, and no fix needed: `11.9`
  (`notes/scale-of-the-solar-system.html`, "given" AU/ly/pc conversion facts in a data-sheet-style
  table) and `13.10`–`13.12` (`notes/parallax.html`, *deriving* the parsec from parallax geometry)
  already cleanly cross-link each other both ways. One real precision issue was found while
  checking, though: `src/specData.js`'s own `parsecKm` is the data sheet's rounded figure
  (`auKm × parsecLightYears-ratio`-style rounding), but `src/parallax.js`'s `AU_PER_PARSEC` is
  computed from exact geometry (`1 / tan(1 arcsec)` ≈ 206,264.8) rather than from
  `parsecKm / auKm` (≈ 206,666.7) — about a 0.2% difference between the exam's own rounded parsec
  and the precise one `parallax.js` actually uses. `notes/parallax.html` never discloses this
  (searched for "precise", "exam", "206,265", "data sheet" — no hits), which CLAUDE.md's own
  house rule 6 calls for whenever a page's engine needs more precision than the rounded exam
  figure. Flagging only, as instructed — not fixed here.
- **Catalogues and naming — 14.1, 14.2 and any earlier sky-navigation page.** No overlap found:
  neither the Messier/NGC catalogues (14.1) nor the Bayer naming system (14.2) are mentioned
  anywhere on the site, including `notes/naked-eye-sky.html`, which uses proper star names
  (Polaris, Sirius, Betelgeuse, Rigel, Merak, Dubhe) purely as navigation landmarks without ever
  explaining the Greek-letter convention behind them. Both points are simply unbuilt; no
  ownership conflict to resolve, just a natural pairing for one new page.

## Part 4 — physics checks on existing content (report only, nothing added from memory)

- **Chandrasekhar Limit:** not found anywhere on the site — no numeric value, no framing of it as
  a white-dwarf mass limit.
- **Radiation-pressure-vs-gravity balance / electron pressure in white dwarfs / neutron pressure
  in neutron stars:** none of these appear anywhere on the site.
- **Milky Way type, size, Sun's position:** "barred spiral" and "SBb" do not appear anywhere. No
  size figure for the Galaxy is stated anywhere. The Sun's position is never stated directly — the
  only related text is `notes/naked-eye-sky.html`'s Milky Way description, "the combined glow of
  billions of stars in our Galaxy's disc, seen edge-on from inside it", which implies but never
  states the Sun sits within the disc.
- **Local Group members and scale:** "Local Group" does not appear anywhere on the site. Only one
  of its three named members (Andromeda/M31) is mentioned at all, on `notes/naked-eye-sky.html`:
  "the Andromeda Galaxy, over two million light years away and the most distant object visible to
  the naked eye." The LMC, SMC and Triangulum/M33 do not appear anywhere.
- **Redshift formula:** the only occurrence on the whole site is `notes/data-sheet.html`'s
  equations table, row "Redshift": `(λ − λ₀) / λ₀ = v / c` (HTML: `&lambda;`, `&minus;`, a `₀`
  subscript), with its own worked-example column reading literally "Coming soon."
- **Hubble's law, its units, H0, age of the Universe:** the only occurrence is the same table,
  row "Hubble's law": `v = H₀ × d`, also "Coming soon." No numeric value of H0 is stated anywhere
  on the site, no units for H0 are given anywhere, and no age-of-the-Universe figure (whether
  stated directly or derived from H0) appears anywhere.
- **v = cz applied to a very distant galaxy or quasar, with or without a low-redshift caveat:**
  not found anywhere — there is no instance of this formula being applied to any object on the
  site at all, so there is nothing to check for a missing caveat.
- **21 cm radio waves and galactic rotation:** "21 cm" does not appear anywhere on the site.
- **Transit of Venus method (11.12):** `notes/solar-system-bodies.html` §`transits-of-venus`
  states: two observers at widely separated latitudes see Venus trace very slightly different
  paths across the Sun's disc, timed to start and end at slightly different moments; that
  measured difference, combined with the precisely known distance between the two observers on
  Earth's surface, gives enough geometry to triangulate the real Sun-Earth distance. The page's
  own diagram adds that this, combined with Venus's own orbital distance (already known from
  Kepler's third law), is what actually produces the AU figure — this matches the spec's own
  framing (Halley's proposal, using the transit to find the AU and so the Solar System's absolute
  size) and nothing here looks wrong.
