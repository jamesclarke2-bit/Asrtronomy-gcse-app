# Topic 11 (11.13–11.30) and Topic 13 (13.1–13.34) coverage audit

Read-only audit. No page, note, sim, question bank or `src/specPoints.js` was edited to
produce this. Ratings: **COVERED** (page text, a diagram/sim where one would help, and at
least one practice question), **PARTIAL** (missing one of those, or a named sub-point, or
exact spec wording/maths — see Gap column), **MISSING** (not on the site, or only present in
a context the spec point doesn't actually ask about).

Audited against the repo at commit `5a63645` (branch `claude/solar-position-calculator-sr5fg1`
merged to `main`). `specPoints.js` has **no core/stretch field** — see note 1 below; "where"
below cites a `curriculum.js` subtopic id only when one exists and carries a `spec` tag for
that point.

## Totals

| Status | Topic 11 (of 18) | Topic 13 (of 34) | Total (of 52) |
|---|---|---|---|
| COVERED | 8 | 7 | 15 |
| PARTIAL | 6 | 5 | 11 |
| MISSING | 4 | 22 | 26 |

## Full table

| id | status | where | gap | recommendation |
|---|---|---|---|---|
| 11.13 | PARTIAL | `notes/solar-system-bodies.html` §`formation` ("Formation theories (brief)"), h3 "Where Earth's water came from"; question `earths-water-origin` in `src/solarSystemBodiesQuestions.js` (u3.25) | No diagram/visual for the competing-theories idea | Extend `solar-system-bodies.html` §formation with a small icon-row diagram (asteroid/comet/outgassing) |
| 11.14 | COVERED | `notes/telescopes.html` §`focusing`, tap-reveal "Why bother with either?"; §`resolving-power` light-grasp readout ("N× a dark-adapted human eye"); question `light-grasp-vs-eye` (`src/telescopeQuestions.js`, u5.2) | — | — |
| 11.15 | COVERED | `notes/telescopes.html` §`focusing` (h2 "How a lens and a mirror focus light", lens/mirror canvases); §`eyepiece-view`; `magnification-calculation` question exercises the fo/fe relationship (u5.1/u5.2) | — | — |
| 11.16 | PARTIAL | `notes/telescopes.html` §`focusing` (lens+mirror canvas directly demonstrates both) (u5.1) | No question isolates "convex lens / concave mirror collect and focus light" as its own fact | Add a short choice question to `src/telescopeQuestions.js` |
| 11.17 | COVERED | `notes/telescopes.html` §`focusing` tap-reveal "Why bother with either?"; §`bench` (live objective+eyepiece combination); every design question exercises this (u5.1) | — | — |
| 11.18 | COVERED | `notes/telescopes.html` §`bench` (h2 "The telescope bench", four-designs tap-reveal, per-design canvas); questions `choose-design-short-tube`, `why-galilean-upright`, `compare-tube-length-magnification` (u5.1) | — | — |
| 11.19 | COVERED | `notes/telescopes.html` §`resolving-power`; question `light-grasp-ratio`; `src/telescopeModel.js` `lightGraspRatio = (D1/D2)²` | — | — |
| 11.20 | PARTIAL | `notes/telescopes.html` glossary `aperture`: "the diameter of a telescope's (or eye's) main light-collecting opening" (u5.2) | No dedicated question; only ever used as a label on sliders | Add a one-line definition question |
| 11.21 | PARTIAL | `notes/telescopes.html` §`eyepiece-view` (h2 "Through the eyepiece", `true-field-readout`/`eyepiece-fit-readout`, live eyepiece-circle canvas) (u5.2) | No dedicated question; the page never states the definition as a sentence (see physics check 3 below) | Add a question; add one sentence stating the definition |
| 11.22 | COVERED | `notes/telescopes.html` §`resolving-power` (wavelength slider, double-star/cluster sims); questions `resolution-calculation`, `what-changes-resolution`; exam tip correctly flags "smaller angle = better" (u5.2) | — | — |
| 11.23 | COVERED | `notes/telescopes.html` §`bench` magnification readout; questions `magnification-calculation`, `compare-tube-length-magnification` (u5.1/u5.2) | — | — |
| 11.24 | COVERED | `notes/geocentric-to-heliocentric.html` §`galileo` (Jupiter's-moons canvas) and the Venus-phases canvas/tap-reveals just above it; 2 dedicated questions in `src/geocentricHeliocentricQuestions.js` (u3.15) | — | — |
| 11.25 | PARTIAL | `notes/telescopes.html` §`bench` tap-reveal "Why do reflectors beat refractors?" states all four (a–d) (u5.1) | Only (a) chromatic aberration has a dedicated question (`chromatic-aberration`); (b) long-focal-length-in-short-tube is indirectly tested by `choose-design-short-tube`; (c) large apertures and (d) multiple mirrors have no question at all | Add one question covering (c)/(d) |
| 11.26 | MISSING | — | No page; `src/pages.js` `COMING_SOON` lists "Probes and Apollo" (position 30) naming exactly 11.26–11.30, unbuilt; `curriculum.js` subtopic `u5.3` "Space probes" exists but has no `spec` field and is registered to no page | New page (see §2 below) |
| 11.27 | MISSING | — | Zero mention anywhere of New Horizons, Juno, Dawn, Deep Impact or Philae (see physics-check item 4 below — nothing to fact-check) | New page |
| 11.28 | PARTIAL | `notes/moon-structure.html` §`escape-velocity` (h2 "Getting there: escape velocity and rockets") explains escape velocity and why only rockets work in vacuum, in full | Tagged only to spec `9.4` in `curriculum.js` (subtopic with this exact title), not `11.28`; no diagram; no question | **Don't rebuild** — add `11.28` to that subtopic's `spec` array; add a question |
| 11.29 | MISSING | — | No content on advantages/disadvantages of manned missions | New page |
| 11.30 | MISSING | — | No content on the Apollo programme | New page |
| 13.1 | COVERED | `notes/magnitude.html` §`the-idea` (idea-diagram, "bright but far" two-panel diagram); multiple questions (u4.2) | — | — |
| 13.2 | COVERED | `notes/magnitude.html` §`the-idea` (absolute-magnitude-fixed-at-10pc readout); questions (u4.2) | — | — |
| 13.3 | COVERED | `notes/magnitude.html` §`distance-modulus` (calculator, worked examples); `notes/data-sheet.html` formula row; questions `distance-from-modulus`, `absolute-from-modulus`, `explain-distance-modulus`; formula algebraically equivalent to spec form (see physics check 5) (u4.2) | — | — |
| 13.4 | COVERED (2026-11-12) | `notes/reading-a-spectrum.html`, now split into 13.4a composition (line-matching puzzle), 13.4b temperature (peak and line strengths by star) and 13.4c radial velocity (Doppler slider), each with its own questions | — | — |
| 13.5 | MISSING | — | No spectral classification (O B A F G K M) | New page |
| 13.6 | MISSING | — | No colour/spectral-type/temperature relationship | New page |
| 13.7 | MISSING | — | No Hertzsprung–Russell diagram anywhere on the site | New page |
| 13.8 | MISSING | — | `curriculum.js` `u4.1` "Stellar evolution" is an unbuilt stub (no `spec` field, registered to no page) | New page |
| 13.9 | COVERED | `notes/magnitude.html` §`inverse-square` (lamp/squares diagram, table); questions `inverse-square-to-magnitude`, `bright-but-far-real-example` (u4.2) | — | — |
| 13.10 | COVERED | `notes/parallax.html` glossary `arcminute`/`arcsecond` (exact 60/60/3600 relationship); question `degrees-to-arcseconds` (u4.5) | — | — |
| 13.11 | COVERED | `notes/parallax.html` §`units` (parsec definition, AU/ly table); question `parsecs-to-light-years` (u4.5) | — | — |
| 13.12 | COVERED | `notes/parallax.html` (whole page: orbit/sky panels, geometry triangle); questions `distance-from-parallax`, `parallax-from-distance` etc. (u4.5) | — | — |
| 13.13 | MISSING | — | Needs an HR diagram (13.7), which doesn't exist | New page (after 13.7) |
| 13.14 | MISSING | — | No light curves (short/long-period, eclipsing binary, Cepheid, nova/supernova) anywhere | New page (see §2) |
| 13.15 | MISSING | — | No explanation of eclipsing-binary variability | New page |
| 13.16 | MISSING | — | No Cepheid period–luminosity distance method | New page |
| 13.17 | MISSING in substance | `notes/naked-eye-sky.html` `doubleStar`/`starCluster` phenomena-grid entries (`src/nakedEyeSkyQuestions.js`) describe what they look like by eye, not their gravitationally-bound structure | Naked-eye identification only — not the spec point | New page; link back to this as "what you'd actually see" |
| 13.18 | MISSING | — | No light curve to practice reading a period from | New page |
| 13.19 | PARTIAL | `sims/coordinates.html` §`sidereal-day-section` (h2 "Sidereal day vs solar day": definition, 23h56m, formula, exam tip); question in `src/coordinatesQuestions.js` tests the nightly 4-minute gain | The specific star-trail-photograph measurement method (maths skills 5a–5c: measuring an arc angle, converting to a rotation rate) is not covered at all | Extend `coordinates.html`'s sidereal-day section with a star-trail-photo mini-diagram and a question |
| 13.20 | COVERED (2026-11-12) | `notes/reading-a-spectrum.html` §`digital-sensors` (photons to charge to numbers to data file, exposure toggle); questions `digital-sensor-stages`, `exposure-time-count` | — | — |
| 13.21 | COVERED (2026-11-12) | `notes/reading-a-spectrum.html` §`spectrograph` and §`three-spectra` (spectrograph schematic, two views, Kirchhoff sim); four questions | — | — |
| 13.22 | PARTIAL | `notes/earth-structure.html` §`transmission-window` (h2 "The atmospheric transmission window", full SVG chart + legend); exam tip in §`exam-tips` ("X-ray telescopes have to be space-based") (u2.16) | No dedicated question | Add a question to `src/earthStructureQuestions.js` |
| 13.23 | MISSING | — | The "only optical and radio telescopes should be at sea level" framing (distinct from 13.28's altitude point) isn't stated | Fold into the radio/infrared page, cross-link from `#transmission-window` |
| 13.24 | MISSING | — | No content on how a radio telescope operates | New page |
| 13.25 | MISSING | — | No radio-telescope-resolution content | **Overlap** — see §3; link to `notes/telescopes.html` §`resolving-power` rather than re-deriving |
| 13.26 | MISSING | — | No aperture-synthesis content | New page |
| 13.27 | MISSING | — | No radio-astronomy-discoveries content (quasars, jets, Milky Way structure, protoplanetary discs) | New page |
| 13.28 | MISSING | — | No infrared-telescope-altitude content | New page |
| 13.29 | MISSING | — | No infrared-astronomy-discoveries content | New page |
| 13.30 | PARTIAL | `notes/earth-structure.html` §`atmosphere-and-astronomy`, tap-reveal "How it hinders" (scintillation/twinkling blurs fine detail) | No diagram specific to this point; no question | Add a question |
| 13.31 | PARTIAL | `notes/earth-structure.html` §`exam-tips` ("X-ray telescopes have to be space-based... however large") | States X-ray only, as a one-line exam-tip link, not a general explanation covering gamma-ray/UV | Extend into a full paragraph once the space-telescope page exists |
| 13.32 | MISSING | — | No space-telescope advantages/disadvantages content | New page |
| 13.33 | MISSING | — | No gamma/X-ray/UV-astronomy-discoveries content; the site's existing "corona"/"chromosphere" content (`sun-features.html` etc.) is about the Sun specifically, a different spec area, not this point | New page |
| 13.34 | PARTIAL | `notes/telescopes.html` §`resolving-power` (double-star canvas = (b) directly; star-cluster canvas loosely covers (d)) | (a) stars, (c) binary stars specifically, (e) globular clusters, (f) nebulae, (g) galaxies not addressed | Extend `#resolving-power` or fold into a new page once built |

## 1. specPoints.js registration

All 18 of Topic 11's points (`11.13`–`11.30`) **are** registered in `src/specPoints.js`, each
with a `depth` of `know`, `understand` or `be able to`. **`specPoints.js` has no core/stretch
field at all** — that distinction only exists in `curriculum.js`, via an individual
subtopic's optional `level: 'extension'` field, and none of the Topic 11 subtopics below carry
it, so nothing here is marked stretch in that sense.

None of Topic 13's 34 points are registered — `specPoints.js`'s own header says so explicitly
("Topics 13-16 are out of scope for this file... no spec-tagged content yet at all").

Which `curriculum.js` subtopics carry a Topic-11 `spec` tag, and which page registers them:

| subtopic | spec codes | page |
|---|---|---|
| `u3.25` | `11.13` | `notes/solar-system-bodies.html` |
| `u5.1` | `11.15`, `11.16`, `11.17`, `11.18`, `11.25` | `notes/telescopes.html` |
| `u5.2` | `11.14`, `11.19`, `11.20`, `11.21`, `11.22`, `11.23` | `notes/telescopes.html` |
| `u3.15` | `11.24` | `notes/geocentric-to-heliocentric.html` |
| `u5.3` | *(none)* | *(not registered to any page)* |

**Mis-registration found:** `11.28` is not tagged anywhere, yet its exact content
("Getting there: escape velocity and rockets") already exists on `notes/moon-structure.html`,
tagged only `9.4`. `u5.3` ("Space probes") exists as a stub with no `spec` field and no page —
`src/pages.js`'s own `COMING_SOON` entry already correctly lists `11.26`–`11.30` against the
not-yet-built "Probes and Apollo" page, so the gap is properly tracked there, just not yet in
`curriculum.js`.

## 2. Gaps and recommendations (new-page proposals only — nothing built)

- **11.13**: extend `solar-system-bodies.html` §formation with a small diagram. Not a new page.
- **11.16, 11.20, 11.21, 11.25(c/d), 13.22, 13.30**: add one question each to the existing page's
  question bank. Not new pages.
- **11.28**: re-tag the existing `moon-structure.html` section with `spec: ['9.4', '11.28']`;
  add one question. Not a new page.
- **13.19**: extend `coordinates.html`'s existing sidereal-day section with a star-trail-photo
  mini-diagram and question.
- **11.26–11.30** ("Probes and Apollo", matching the existing `COMING_SOON` entry exactly):
  fly-by/orbiter/impactor/lander trade-offs, the five named missions, escape velocity (link to
  `moon-structure.html`'s existing explanation rather than repeat it), manned-mission
  trade-offs, Apollo.
- **13.4–13.8, 13.13, 13.21** ("Stellar Spectra and the HR Diagram"): spectral information,
  classification, colour/temperature, the HR diagram itself, life-cycle positions,
  spectroscopic distance method.
- **13.14–13.18** ("Variable Stars and Standard Candles"): light curves, eclipsing-binary
  cause and period, Cepheid distances, cluster/binary structure (link `naked-eye-sky.html`'s
  existing doubleStar/starCluster entries as "what you'd see" rather than repeat them).
- **13.20, 13.23–13.29, 13.32, 13.33** ("Beyond Optical: Radio, Infrared and Space
  Telescopes"): link to `earth-structure.html`'s existing transmission-window diagram and exam
  tip as the canonical "why" (see overlap below) rather than redrawing it; link to
  `telescopes.html`'s resolution section for 13.25 rather than re-deriving it.

## 3. Overlaps

- **Resolution vs. aperture and wavelength**: taught correctly and thoroughly for optical
  telescopes at `notes/telescopes.html` §`resolving-power` (11.22). 13.25 needs the identical
  underlying argument for radio telescopes. **Canonical home: `telescopes.html`** — a future
  radio-telescope page should link to it rather than re-derive the relationship.
- **Atmosphere blocking radiation**: `notes/earth-structure.html` §`transmission-window` (13.22)
  and its §`exam-tips` X-ray note (part of 13.31) are the only existing treatment. **Canonical
  home: `earth-structure.html`** — any infrared/radio/space-telescope page should link back
  here rather than redraw the chart.
- **Escape velocity**: `notes/moon-structure.html` §`escape-velocity` already serves spec `9.4`
  and, in substance, `11.28`. One explanation, two spec codes — needs only a tag addition, not
  duplication.
- **Naked-eye double stars/clusters**: `notes/naked-eye-sky.html`'s phenomena-grid entries
  describe what a double star or cluster looks like by eye (an unrelated, already-covered spec
  area) — a useful "what you'd actually see" link for a future 13.17 page, not itself coverage
  of 13.17's gravitationally-bound-structure requirement.

## 4. Physics accuracy spot checks

1. **Light grasp ∝ D²** (not D): correct everywhere checked. `src/telescopeModel.js`:
   `lightGraspRatio(diameterMm, referenceDiameterMm) { return Math.pow(diameterMm /
   referenceDiameterMm, 2); }`. Every page readout, glossary entry and question (`light-grasp-ratio`,
   `light-grasp-vs-eye`) states and uses the square relationship correctly.
2. **Resolution direction**: correct everywhere checked. `resolutionArcsec` is proportional to
   `wavelength / diameter` (larger diameter or shorter wavelength → smaller, better, angle).
   The page's own exam tip explicitly flags the easy-to-get-backwards part: "resolution
   improves' means the resolvable angle gets *smaller*... even though 1 is the smaller number."
   The `what-changes-resolution` question's correct option is "a larger objective diameter, or
   observing at a shorter wavelength" — right way round. No page found stating it backwards.
3. **Magnification = fo/fe**: correct and consistent (`telescopeModel.js`, the bench readout,
   and three questions). **Field-of-view wording**: `curriculum.js`'s own internal paraphrase
   for 11.21 already uses almost the spec's exact words ("the circle of sky seen through the
   eyepiece, in degrees or arcminutes"), but **the student-facing page text never states this
   as a sentence** — the idea is only implicit in the live `true-field-readout`/
   `eyepiece-fit-readout` values. Worth adding the definition as an actual sentence (see 11.21
   above).
4. **Magnitude/distance-modulus consistency**: consistent, but stated as a different (though
   algebraically equivalent) rearrangement everywhere: spec gives `M = m + 5 − 5 log d`;
   `notes/data-sheet.html` gives `m − M = 5 log₁₀(d) − 5`; `src/magnitude.js`'s
   `distanceModulus(d) = 5 * Math.log10(d / 10)`. Rearranging the spec's form gives
   `m − M = 5 log d − 5`, identical to the data sheet's. No error, just never written in the
   exact `M = m + 5 − 5 log d` form anywhere on the site.
5. **13.10 (60 arcmin, 60 arcsec)**: taught explicitly. `notes/parallax.html` glossary:
   "Arcminute ('): 1/60 of a degree. 1 degree is 60 arcminutes." / "Arcsecond ("): 1/60 of an
   arcminute, or 1/3600 of a degree" — plus a dedicated question, `degrees-to-arcseconds`.
6. **New Horizons, Juno, Dawn, Deep Impact, Philae, Apollo**: the site makes **no claims about
   any of these** — a sitewide search (`grep -rliE` across every `.html` file) for each name,
   and for "flyby/fly-by/orbiter/impactor/lander probe", returns zero matches. Nothing to
   fact-check; this is simply unbuilt content (11.26, 11.27, 11.30).

## 5. Downloaded photographs

None found. A sitewide search for `.jpg`, `.jpeg`, `.png`, `.gif` and `.webp` files anywhere
in the repository returns zero results, and no `notes/*.html` or `sims/*.html` page contains an
`<img>` tag. Every diagram on the site is original inline SVG or `<canvas>` drawing, consistent
with CLAUDE.md's house rule 13 (no outside images).
