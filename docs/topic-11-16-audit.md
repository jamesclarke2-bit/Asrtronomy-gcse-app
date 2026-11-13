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
| 14.1 | MISSING | — | No mention of "Messier", "NGC" or "New General Catalogue" anywhere on the site | New page (suggested title: "Catalogues and Naming: Messier, NGC and Bayer"), pairing with 14.2 |
| 14.2 | MISSING | — | No mention of the Bayer system anywhere; `notes/naked-eye-sky.html` uses proper star names (Polaris, Sirius, Betelgeuse...) purely as landmarks, never explaining the Greek-letter convention | Same new page as 14.1 |
| 14.3 | MISSING | — | No radiation-pressure-vs-gravity content anywhere | New page (see 14.9/14.10 recommendation — one page can cover 14.3–14.10 together) |
| 14.4 | MISSING | — | No stage-by-stage balance-change content for a Sun-like star | New page |
| 14.5 | MISSING | — | No electron-pressure/white-dwarf content anywhere | New page |
| 14.6 | MISSING | — | No balance-change content for a massive star | New page |
| 14.7 | MISSING | — | No neutron-pressure/neutron-star content anywhere | New page |
| 14.8 | MISSING | — | No mention of the Chandrasekhar Limit anywhere | New page |
| 14.9 | PARTIAL | `notes/naked-eye-sky.html` §`phenomena-grid`, tile `supernovae` (icon + one-line "a dying star's catastrophic explosion..." description); question tests naked-eye identification only | No stage sequence (nebula → main sequence → planetary nebula → red giant → white dwarf → black dwarf), no diagram of it, no question on the physics — only the unrelated "what does a supernova look like" fact exists nearby | New page covering 14.3–14.10 as one continuous story |
| 14.10 | PARTIAL | Same `supernovae` tile — covers only its own sub-part "d" (supernova) as a naked-eye description, not the stage sequence or physics | Same gap as 14.9 | Same new page |
| 14.11 | MISSING | — | No black-hole-evidence content anywhere | New page (could close out the 14.3–14.10 page, or be its own short section) |
| 15.1 | PARTIAL | `notes/naked-eye-sky.html` §`phenomena` Milky Way tile: "A faint, diffuse band of light arching across the sky... the combined glow of billions of stars in our Galaxy's disc, seen edge-on from inside it." (`src/nakedEyeSkyQuestions.js`/`naked-eye-sky.js`) | The tile drives only the page's own "Which is it?" tap game, which its own file header says bypasses `quiz-ui.js`'s normal question flow entirely — not in `src/allQuestions.js`, carries no spec/unit tag, so there is no genuine tracked question | Add one real quiz-ui question reusing this existing text, or merge 15.1 into whatever new page owns 15.2–15.14 |
| 15.2 | MISSING | — | No Galaxy size/shape, Sun's position, dust or star-formation-site content anywhere | New page (e.g. "Our Galaxy: the Milky Way") |
| 15.3 | MISSING | — | No "21 cm" content anywhere | Same new page |
| 15.4 | MISSING | — | "Local Group" doesn't appear anywhere on the site | Same new page |
| 15.5 | PARTIAL | `notes/naked-eye-sky.html` §`pointers` (Pegasus star-hop): "the Andromeda Galaxy, over two million light years away..." with a star-hop diagram and real quiz-ui questions | Only Andromeda is named; no LMC, SMC or Triangulum/M33; no "Local Group" framing at all | Extend the Pegasus/Andromeda material with the other two members and the Local Group concept, or fold into the new Galaxy page |
| 15.6 | MISSING | — | No classification terms (spiral/barred spiral/elliptical/irregular) anywhere | Same new page; overlaps 13.34 (telescope view of galaxies) — see Part 3 |
| 15.7 | MISSING | — | "Tuning Fork" not found anywhere | Same new page |
| 15.8 | MISSING | — | "Barred spiral"/"SBb" not found anywhere; the site states no galaxy type for the Milky Way at all | Same new page |
| 15.9 | MISSING | — | No AGN/radiation-beyond-visible content anywhere | New page (radio astronomy + AGN/quasars — overlaps 13.27, see Part 3) |
| 15.10 | MISSING | — | "AGN"/"active galactic" not found anywhere | Same new page |
| 15.11 | MISSING | — | "Seyfert" and "blazar" appear nowhere; "quasar" appears for 13.27 on `notes/radio-telescopes.html` (2026-11-14), but only as a radio discovery, not as an active galaxy | Same new page |
| 15.12 | MISSING | — | No content | Same new page |
| 15.13 | MISSING | — | "Supercluster" doesn't appear anywhere; overlaps the also-unbuilt 13.17 (clusters) — see Part 3 | Could be satisfied by one new treatment of "clusters" broadly alongside 15.2's globular clusters, or kept separate |
| 15.14 | MISSING | — | No galaxy-formation-theory content anywhere | New page |
| 16.1 | MISSING | — | No redshift content beyond a bare, unexplained formula row (see 16.3) | New page (e.g. "Redshift, Hubble's Law and the Big Bang") covering 16.1–16.9 |
| 16.2 | MISSING | — | No explanation that redshift = recession anywhere | Same new page |
| 16.3 | MISSING | — | `notes/data-sheet.html`'s equations table has the bare row `(λ − λ₀) / λ₀ = v / c` with its worked-example column literally reading "Coming soon" — a formula in a reference table, no explanation, no diagram, no question | Same new page |
| 16.4 | MISSING | — | No expanding-universe evidence anywhere | Same new page |
| 16.5 | MISSING | — | Same `data-sheet.html` table has `v = H0 x d`, also "Coming soon"; no numeric H0, no units for H0, stated anywhere on the site | Same new page |
| 16.6 | MISSING | — | No age-of-the-Universe figure or estimate anywhere | Same new page |
| 16.7 | MISSING | — | No Big Bang vs Steady State content | Same new page |
| 16.8 | MISSING | — | No quasar/CMB/Hubble-Deep-Field evidence content (note: 16.8a's "quasars as evidence" is a different angle on the same object as 15.11b's "quasars as an AGN type" — see Part 3) | Same new page |
| 16.9 | MISSING | — | No CMB-fluctuation/WMAP/Planck content | Same new page |
| 16.10 | MISSING | — | No dark matter/energy content anywhere | New page (could be the closing section of the redshift/Big Bang page, or its own short page) |
| 16.11 | MISSING | — | No content on detection difficulty | Same new page |
| 16.12 | MISSING | — | No future-of-the-Universe content | Same new page |

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
