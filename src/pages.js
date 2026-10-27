/**
 * Registry of every interactive simulator (sims/) and static reference
 * page (notes/) in the app, for the landing page (index.html) to list
 * grouped by curriculum unit and by teaching order. `units` mirrors
 * each page's own CURRICULUM_UNITS constant (solarPosition.js,
 * equation-of-time.js, coordinates.js, sun-declination.js, ...) — kept
 * here as plain data, rather than loading every page's script just to
 * read one constant, so this stays a cheap, dependency-free listing.
 *
 * href is relative to the repo root (where index.html lives).
 *
 * `kind: 'reference'` marks a page that cuts across every unit instead
 * of teaching towards particular ones — it carries `units: []` and is
 * listed in its own "Reference" section on index.html, outside every
 * unit group, the journey, and spec-coverage accounting.
 * Pages without a `kind` are ordinary unit-tagged pages.
 *
 * --- The journey: `phase`, `position` and `why` ---------------------
 *
 * index.html's "Unit cards" and the site-wide "Next on the recommended
 * path" link (nextPage.js) are both driven from three fields on each
 * ordinary (non-reference, non-extension — see isExtensionPage below)
 * page entry, so the journey can never drift out of step with the
 * registry itself:
 *
 *   - `phase`: one of the names in PHASES below, in teaching order.
 *   - `position`: a single integer, unique and consecutive across the
 *     *whole* journey (not just within a phase) — built pages and
 *     COMING_SOON steps share this same number line, so the two
 *     interleave correctly once merged (see buildJourney below).
 *   - `why`: one plain-English sentence on why this page comes where
 *     it does — usually what it builds on, occasionally what it sets
 *     up next. Checked against its actual neighbours by
 *     test/pages.test.js's "journey cross-references its real
 *     neighbours, not a stale one" test, so a reordering can't leave a
 *     "why" quietly pointing at a page that no longer sits next to it.
 *
 * A reference or extension page carries neither field (and is never
 * reachable from the journey at all); every other page must carry
 * both, and no two non-coming-soon entries may share a `position`
 * (test/pages.test.js enforces all of this).
 *
 * --- Coming soon: COMING_SOON ----------------------------------------
 *
 * Topics the spec covers but this app doesn't teach yet don't get a
 * fake PAGES entry (there's no page to link to) — instead each one is
 * one entry in COMING_SOON: `{ name, phase, position, why, specPoints,
 * topics }`. `specPoints` names the still-unbuilt spec point codes (as
 * notes/syllabus-map.html's own data, src/specPoints.js, already
 * tracks them) a built page for this step would need to cover;
 * `topics` instead names whole spec Topic numbers with no SPEC_POINTS
 * registry entries at all yet (see src/specPoints.js's own header) —
 * a coming-soon step carries whichever of the two actually applies,
 * never both. test/pages.test.js's "every spec point the syllabus map
 * marks not built yet is named in some coming-soon step" test is what
 * keeps this list from quietly going stale as pages get built: once a
 * step's content ships, the move is to turn it into a real PAGES entry
 * (with its own phase/position/why) and delete the matching
 * COMING_SOON entry, not leave both around.
 *
 * `buildJourney(pages, comingSoon, phases)` merges both lists, grouped
 * by phase and sorted by position, into the structure index.html's
 * home.js actually renders. `buildRecommendedPath(pages)` instead
 * reconstructs the older `[{phase, steps: [{href, why}]}]` shape from
 * the same per-page fields, for nextPage.js's site-wide "next page"
 * link, which only ever needs to walk the *built* pages in order.
 */

const PHASES = [
  'Look up',
  'Earth, Moon and Sun',
  'Time',
  'The Sun',
  'The Solar System and gravity',
  'Telescopes and exploring',
  'Stars and the Universe',
];

const PAGES = [
  {
    title: 'Sun Path Simulator',
    description: "Drag date, time and latitude to see how the Sun's position and path across the sky change.",
    href: 'sims/sun-path.html',
    units: ['u1.4', 'u1.6', 'u2.9', 'u2.10'],
    phase: 'Time',
    position: 14,
    why: "Puts Star Coordinates' toolkit to work on one object across a day and a year, and introduces the seasons.",
  },
  {
    title: 'Equation of Time',
    description:
      'Why a sundial and a clock rarely agree, and by how much across the year; apparent, mean and local mean time; time zones and GMT/UT; and how sunrise and sunset times change through the year.',
    href: 'sims/equation-of-time.html',
    units: ['u2.10'],
    phase: 'Time',
    position: 15,
    why: 'Goes deeper into the time ideas Sun Path just raised — why a sundial and a clock disagree.',
  },
  {
    title: 'Shadows and Sundials',
    description:
      "A shadow stick's traced path across the day, finding true north from its shortest shadow or from two equal-length tips either side of noon, a longitude-finding challenge using the Equation of Time, and a horizontal sundial's own unevenly-spaced hour lines.",
    href: 'sims/shadows-and-sundials.html',
    units: ['u2.30', 'u2.31', 'u2.32'],
    phase: 'Time',
    position: 16,
    why: "Puts the equation of time to practical use: finding true north and your own longitude from a shadow's own shortest length, and why a sundial reads differently from a watch.",
  },
  {
    title: 'Star Coordinates',
    description:
      'Right ascension, declination, hour angle and sidereal time — pick a star and watch how they all relate, and see why a sidereal day is about 4 minutes shorter than a solar one.',
    href: 'sims/coordinates.html',
    units: ['u1.7', 'u1.8', 'u1.9', 'u1.10', 'u1.11', 'u1.12', 'u1.13', 'u1.14', 'u1.21'],
    phase: 'Look up',
    position: 4,
    why: "A new, more technical toolkit, building on what you've just learned to look up and recognise: right ascension, declination, hour angle, sidereal time, and finding your latitude from Polaris — the toolkit planning an observing night, next, puts to use.",
  },
  {
    title: 'Observing the Sun',
    description:
      "How the Sun's position in the sky changes through the year, and how to observe it safely — declination and transit altitude, structure, sunspots, solar wind, and observation methods from pinhole projection to X-ray imaging.",
    href: 'sims/sun-declination.html',
    units: ['u1.11', 'u2.9', 'u2.5', 'u2.11', 'u2.12', 'u2.13', 'u2.14', 'u5.4'],
    phase: 'The Sun',
    position: 18,
    why: "The Sun's own structure and how to observe it safely, reusing the transit-altitude idea from Star Coordinates.",
  },
  {
    title: 'Retrograde Motion and Planetary Alignments',
    description: 'Pick Mercury, Venus or Mars and watch its whole cycle: retrograde loops, every conjunction and elongation, and when (or whether) it can be seen.',
    href: 'sims/solar-system-observation.html',
    units: ['u1.15', 'u1.16', 'u1.17'],
    phase: 'The Solar System and gravity',
    position: 23,
    why: "Now that you know why planets loop and drift (Kepler's Laws and Orbits and Gravity, just covered), here's how to actually track Mercury, Venus and Mars doing it for real.",
  },
  {
    title: 'Observing Techniques',
    description:
      'A planning reference for an observing session: dark adaptation and averted vision, finding targets with charts and apps, constellations across cultures, and meteor showers.',
    href: 'notes/observing-techniques.html',
    units: ['u1.5', 'u1.18', 'u1.19', 'u1.20', 'u1.22'],
    phase: 'Look up',
    position: 3,
    why: 'The how that goes with it: dark adaptation, star charts and apps, and catching a meteor shower.',
  },
  {
    title: 'The Naked-Eye Sky',
    description:
      "What you can see without a telescope and how to tell it apart — planets, stars, satellites, meteors, comets and aurorae — plus the Milky Way, star charts of seven key constellations and asterisms, and using the Plough's Pointers to find Polaris.",
    href: 'notes/naked-eye-sky.html',
    units: ['u1.1', 'u1.2', 'u1.3'],
    phase: 'Look up',
    position: 1,
    why: "Start here — no maths yet, just learning to recognise what's actually up there and the star patterns worth knowing.",
  },
  {
    title: 'Measuring the Sky',
    description:
      "How Eratosthenes measured the Earth and Aristarchus the Moon and Sun, using shadows and angles; the real sizes and distances of the Earth, Moon and Sun, and the 400× coincidence behind eclipses; and precession, which slowly changes the pole star.",
    href: 'notes/measuring-the-sky.html',
    units: ['u2.6', 'u2.28', 'u2.29'],
    phase: 'Earth, Moon and Sun',
    position: 12,
    why: "How the ancients first measured Earth, the Moon and the Sun — reusing Star Coordinates' meridian diagram directly.",
  },
  {
    title: 'Tides',
    description:
      "How the Moon's gravity, and to a lesser extent the Sun's, raises two tidal bulges; why most places get two high and two low tides a day; and spring and neap tides, with a diagram that follows the Moon's phase.",
    href: 'notes/tides.html',
    units: ['u2.7'],
    phase: 'Earth, Moon and Sun',
    position: 10,
    why: "Spring and neap tides, tied to the Moon's phase cycle covered earlier in this phase.",
  },
  {
    title: 'Archaeoastronomy: Precession and Monuments',
    description:
      "Why the pole star changes over millennia — Thuban, not Polaris, for the ancient Egyptians — and what that ~26,000-year wobble explains about two real monuments: Stonehenge's solstice-sunrise alignment and the Great Pyramid of Giza's star-aligned shafts.",
    href: 'notes/archaeoastronomy.html',
    units: ['u3.5', 'u2.29'],
    phase: 'Earth, Moon and Sun',
    position: 13,
    why: "Builds directly on Measuring the Sky's precession section — what that 26,000-year wobble meant for real ancient monuments.",
  },
  {
    title: 'Earth: Structure, Atmosphere and Motion',
    description:
      "Earth's shape and layered interior, latitude, longitude and the named reference lines on a labelled globe, the atmosphere's composition and layers, why it both helps and hinders astronomy, the transmission window that limits ground-based telescopes, and Earth's own rotation, revolution and tilt.",
    href: 'notes/earth-structure.html',
    units: ['u2.1', 'u2.9', 'u2.15', 'u2.16', 'u2.28'],
    phase: 'Earth, Moon and Sun',
    position: 6,
    why: 'Turns the lens on Earth itself: its structure, atmosphere, and the rotation and axial tilt everything later in this phase — and the seasons, later still — builds on.',
  },
  {
    title: 'From Earth-Centred to Sun-Centred',
    description:
      "How astronomy moved on from a thousand years of Earth at the centre: Ptolemy's epicycles (try the interactive diagram and watch a retrograde loop appear), Tycho Brahe's unprecedented observational precision, Kepler finding ellipses in Brahe's own Mars data, and the two telescope observations — Jupiter's moons and the phases of Venus — Galileo made that the old model couldn't explain.",
    href: 'notes/geocentric-to-heliocentric.html',
    units: ['u3.1', 'u3.2', 'u3.6', 'u3.7', 'u3.15'],
    phase: 'The Solar System and gravity',
    position: 20,
    why: "A new thread: how the Earth-centred model slowly gave way to the Sun-centred one, setting up why Kepler's laws, next, were worth discovering at all.",
  },
  {
    title: "Kepler's Laws of Planetary Motion",
    description:
      "An ellipse with the Sun at one focus, perihelion and aphelion, equal-area wedges swept out faster near the Sun and slower away from it, and the T² vs r³ graph for the eight planets — plus a central-mass control showing why the constant depends inversely on mass.",
    href: 'sims/kepler.html',
    units: ['u3.9', 'u3.10', 'u3.11', 'u3.12'],
    phase: 'The Solar System and gravity',
    position: 21,
    why: "From ancient models of the sky to the actual physics of orbits: why they're ellipses, why speed changes around one, and how period and distance relate.",
  },
  {
    title: 'Orbits and Gravity',
    description:
      "Newton's cannon: a real numerical simulation of gravity alone turning a launch speed into a falling arc, a circle, an ellipse or an escape — with the equal-area wedges emerging from the physics, not assumed. Plus an inverse-square widget for how gravity's strength changes with distance and mass, by ratio rather than formula.",
    href: 'sims/orbits-gravity.html',
    units: ['u3.8', 'u3.13', 'u3.14'],
    phase: 'The Solar System and gravity',
    position: 22,
    why: "Kepler described the three laws; this is Newton explaining why they're true — simulating gravity itself, rather than assuming the ellipse Kepler's page draws.",
  },
  {
    title: 'The Scale of the Solar System',
    description:
      "A logarithmic distance slider from the Moon out past Neptune to the nearest stars, the astronomical unit, light year and parsec explained side by side, and how long light takes to reach each planet.",
    href: 'notes/scale-of-the-solar-system.html',
    units: ['u3.3', 'u3.4'],
    phase: 'The Solar System and gravity',
    position: 24,
    why: "Puts the distance and period figures Kepler's page introduced to a different purpose: just how big the Solar System actually is, and why AU, light years and parsecs each earn their place.",
  },
  {
    title: 'Formulae and Data Sheet',
    description:
      "The exam's own Appendix 2 data sheet, reproduced in full: all six given equations (linked to the page that uses each, where one exists), the constants, and the planet and dwarf-planet table every Kepler's-third-law question draws on.",
    href: 'notes/data-sheet.html',
    // A reference page: it covers every unit's equations and constants
    // at once, so it isn't tagged towards any particular one, and
    // carries no phase/position/why — see the `kind: 'reference'` note
    // in the file header above.
    kind: 'reference',
    units: [],
  },
  {
    title: 'Moon Phases',
    description:
      "Two synced views: why phases happen (the Moon's position relative to the Sun) and what you'd actually see from Earth — plus the Moon's changing distance on its elliptical orbit, and when a full Moon counts as a supermoon.",
    href: 'sims/moon-phases.html',
    units: ['u2.3', 'u2.18'],
    phase: 'Earth, Moon and Sun',
    position: 7,
    why: 'Moves from Earth to the Moon: why its shape changes, and its elliptical orbit.',
  },
  {
    title: 'Sidereal vs Synodic Month',
    description:
      "Animate Earth orbiting the Sun and the Moon orbiting Earth to see why the Moon takes ~27.3 days to line up with the same star again, but ~29.53 days to repeat the same phase.",
    href: 'sims/sidereal-vs-synodic.html',
    units: ['u2.17'],
    phase: 'Earth, Moon and Sun',
    position: 9,
    why: 'A second way to measure the Moon’s cycle: against the stars rather than against the Sun, and why the two give different lengths.',
  },
  {
    title: 'Eclipses',
    description:
      "Why there isn't an eclipse every month: pick a date to see where the Moon sits on its tilted orbit relative to the line of nodes, and whether a solar or lunar eclipse is geometrically possible.",
    href: 'sims/eclipses.html',
    units: ['u2.8', 'u2.19'],
    phase: 'Earth, Moon and Sun',
    position: 11,
    why: 'Needs the lunar phase and orbital-tilt ideas from earlier in this phase to make sense of.',
  },
  {
    title: 'The Moon: Structure, Surface and Origin',
    description:
      "The Moon's layers and surface features, an interactive map for learning the seven named features on sight, synchronous rotation and libration, the near and far sides, what it takes to get there, and the Giant Impact Hypothesis.",
    href: 'notes/moon-structure.html',
    units: ['u2.2', 'u2.20', 'u2.21', 'u2.22', 'u2.23', 'u2.24', 'u2.25', 'u2.26', 'u2.27'],
    phase: 'Earth, Moon and Sun',
    position: 8,
    why: "Continues straight from Moon Phases to the Moon's physical self: surface features, formation and internal structure.",
  },
  {
    title: 'Telescopes: Magnification, Light Grasp and Resolution',
    description:
      "A telescope bench to build: a lens and a mirror focusing light, four real designs (Galilean, Keplerian, Newtonian, Cassegrain) with sliders that resize and move the actual optics, what you'd see through the eyepiece, and a simulated double star and star cluster that sharpen as the aperture grows.",
    href: 'notes/telescopes.html',
    units: ['u5.1', 'u5.2'],
    phase: 'Telescopes and exploring',
    position: 28,
    why: "The equipment that made everything above observable in the first place — including Galileo's own telescope, back on From Earth-Centred to Sun-Centred.",
  },
  {
    title: 'Bodies of the Solar System',
    description:
      "A to-scale size line-up and bar chart of the planets and dwarf planets, the larger named moons by planet, the four ringed planets drawn at relative size with Saturn's rings the most visible, Io's tidal heating (reusable diagram) from its 1:2:4 resonance with Europa and Ganymede, a temperature-against-distance chart, a planet-vs-dwarf-planet decision diagram, asteroids/meteoroids/comets, a comet-tail diagram and the Kuiper Belt/Oort Cloud on a logarithmic scale, transits of Venus and measuring the AU, and brief formation theories — a first draft pending teacher review.",
    href: 'notes/solar-system-bodies.html',
    units: ['u3.16', 'u3.17', 'u3.18', 'u3.19', 'u3.20', 'u3.21', 'u3.22', 'u3.23', 'u3.24', 'u3.25', 'u3.30', 'u3.31'],
    phase: 'The Solar System and gravity',
    position: 25,
    why: "Rounds out the Solar System itself: the same planet table compared directly, then everything smaller — asteroids, comets, meteorites — plus how a transit of Venus first measured the AU just introduced.",
  },
  {
    title: 'Gravitational Potential Energy and Orbital Energy',
    description:
      "Beyond the GCSE spec: A-level extension. Gravitational potential energy defined as work, a draggable V(r) = -GM/r potential well, mgh vs the exact formula, the g-r graph's shaded area as potential difference, a satellite's live kinetic/potential/total energy as its orbit is raised, and escaping as total energy reaching zero.",
    href: 'sims/gravitational-potential.html',
    units: ['u3.26', 'u3.27'],
    // An extension page (isExtensionPage): every unit above resolves to
    // a level:'extension' curriculum subtopic, so it carries no
    // phase/position/why — see isExtensionPage below.
  },
  {
    title: 'Gravitational Field Maps and Lagrange Points',
    description:
      "Beyond the GCSE spec: A-level extension. Drag two masses on a live field map — field arrows, equipotential contours and the zero-field point — with Earth-Moon, Sun-Earth (zoomed in near Earth) and equal-mass presets, plus a mass-ratio explorer where L4 and L5 flip between stable and unstable right before your eyes as the effective potential redraws.",
    href: 'sims/gravity-field-map.html',
    units: ['u3.28', 'u3.29'],
    // Also an extension page — see the note on gravitational-potential.html above.
  },
  {
    title: 'Privacy',
    description:
      "What this site is, what it stores on your own device (one local-storage entry of right/wrong practice-question counts), how to clear it, and that GitHub, as host, sees visitor IP addresses in its own logs.",
    href: 'notes/privacy.html',
    // A reference page: it's about the site itself, not any part of the
    // curriculum (see the `kind: 'reference'` note in the file header
    // above).
    kind: 'reference',
    units: [],
  },
  {
    title: 'Syllabus Map',
    description:
      "Every point in the Edexcel GCSE Astronomy (1AS0) specification, matched to the page that teaches it — built straight from the site's own data, so it can't drift. A coverage summary per topic, which points still need a page, and which 'be able to' points already have practice questions.",
    href: 'notes/syllabus-map.html',
    // A reference page: it maps the whole specification at once, not
    // any one unit (see the `kind: 'reference'` note in the file
    // header above).
    kind: 'reference',
    units: [],
  },
];

/**
 * Topics the spec covers but no page teaches yet — see this file's own
 * header for the shape of each entry and how the list is kept honest.
 * `position` shares one number line with every PAGES entry's own
 * `position`, so a coming-soon step can sit correctly between two
 * built pages once buildJourney merges them.
 */
const COMING_SOON = [
  {
    name: 'Why the sky is blue',
    phase: 'Look up',
    position: 2,
    why: "A naked-eye observation explained: why the daytime sky is blue and the night sky dark, from the same atmosphere The Naked-Eye Sky's stars shine through.",
    specPoints: ['1.6a'],
  },
  {
    name: 'Planning an observing night',
    phase: 'Look up',
    position: 5,
    why: "Needs Star Coordinates' toolkit to actually predict what's up and when, turning Observing Techniques' tools into a step-by-step plan: picking the best time, predicting what's up, and reading the conditions before you go out.",
    specPoints: ['6.12', '6.17', '6.20'],
  },
  {
    name: 'Finding longitude from the Moon and a clock',
    phase: 'Time',
    position: 17,
    why: 'A different way to find longitude at sea, before GPS, continuing Shadows and Sundials’ own longitude problem: comparing the Moon’s position against a known clock, or Harrison’s marine chronometer solving the same problem directly.',
    specPoints: ['4.20', '4.21'],
  },
  {
    name: 'Nuclear fusion in the Sun',
    phase: 'The Sun',
    position: 19,
    why: 'The engine room behind everything Observing the Sun just showed from the outside: how the Sun actually generates its light.',
    specPoints: ['10.4'],
  },
  {
    name: 'Formation of planetary systems',
    phase: 'The Solar System and gravity',
    position: 26,
    why: "The next natural question once you know the planets themselves: how gravity actually built them, and shaped their rings, resonances and atmospheres — Bodies of the Solar System's own formation theories are only a first draft.",
    specPoints: ['12.1a', '12.1c', '12.2a', '12.2b', '12.2c'],
  },
  {
    name: 'Exoplanets and life',
    phase: 'The Solar System and gravity',
    position: 27,
    why: "The same 'requirements for life' question Bodies of the Solar System raises for Titan, Europa and Enceladus, turned outward: how we actually find planets around other stars, and whether anyone's out there.",
    specPoints: ['12.4', '12.6', '12.7', '12.8'],
  },
  {
    name: 'Probes and Apollo',
    phase: 'Telescopes and exploring',
    position: 29,
    why: 'How we stopped just watching and went there — the Apollo missions, and the trade-offs of every kind of robotic probe since.',
    specPoints: ['11.26', '11.27', '11.28', '11.29', '11.30'],
  },
  {
    name: 'Stars, galaxies and the Universe',
    phase: 'Stars and the Universe',
    position: 30,
    why: "The whole rest of the sky this course hasn't reached yet: what stars are and how they live and die, our own Galaxy's structure, and the wider Universe beyond it.",
    // Topics 13-16 have no SPEC_POINTS registry entries at all yet
    // (src/specPoints.js's own header explains why), so there are no
    // point-level codes to name — `topics` instead, not `specPoints`.
    topics: [13, 14, 15, 16],
  },
];

/**
 * Merges PAGES' journey-eligible entries with COMING_SOON into the
 * structure index.html's home.js renders: one entry per phase (in
 * `phases` order, normally PHASES), each holding its `items` — built
 * pages and coming-soon steps together, in position order. Every item
 * carries `type: 'built'` (with the full `page` object) or
 * `type: 'comingSoon'` (with `name`, `why`, `specPoints`/`topics`) so
 * the renderer can tell them apart without re-deriving it.
 */
function buildJourney(pages, comingSoon, phases) {
  const builtItems = pages
    .filter((page) => typeof page.position === 'number')
    .map((page) => ({ type: 'built', phase: page.phase, position: page.position, page }));
  const comingSoonItems = comingSoon.map((step) => ({ type: 'comingSoon', phase: step.phase, position: step.position, step }));
  const allItems = [...builtItems, ...comingSoonItems].sort((a, b) => a.position - b.position);

  return phases
    .map((phase) => ({ phase, items: allItems.filter((item) => item.phase === phase) }))
    .filter((entry) => entry.items.length > 0);
}

/**
 * Reconstructs the older `[{phase, steps: [{href, why}]}]` shape — the
 * one nextPage.js (the site-wide "next on the recommended path" link)
 * and its tests expect — from the same per-page phase/position/why
 * fields buildJourney above reads, so there's still exactly one source
 * of truth. Only built pages appear; a coming-soon step has no href to
 * link to, so nextPage.js never needs to see it.
 */
function buildRecommendedPath(pages, phases) {
  return phases
    .map((phase) => ({
      phase,
      steps: pages
        .filter((page) => page.phase === phase && typeof page.position === 'number')
        .sort((a, b) => a.position - b.position)
        .map((page) => ({ href: page.href, why: page.why })),
    }))
    .filter((entry) => entry.steps.length > 0);
}

const RECOMMENDED_PATH = buildRecommendedPath(PAGES, PHASES);

/**
 * How much of each curriculum unit has a page teaching towards it, for
 * index.html's scope note. Takes `units` (normally Curriculum.UNITS)
 * as a parameter rather than requiring curriculum.js directly, so this
 * file stays plain data plus pure functions — see the file header.
 *
 * Subtopics tagged `level: 'extension'` (src/curriculum.js's own header
 * comment documents the field) are left out entirely — out of a unit's
 * total subtopic count, and out of its covered count even if some page
 * does declare that id — since they're beyond the GCSE spec this stat
 * is meant to describe coverage of.
 */
function computeUnitCoverage(units, pages) {
  return units.map((unit) => {
    const gcseSubtopicIds = new Set(unit.subtopics.filter((s) => s.level !== 'extension').map((s) => s.id));
    const coveredIds = new Set();
    pages.forEach((page) => {
      page.units.forEach((id) => {
        if (gcseSubtopicIds.has(id)) coveredIds.add(id);
      });
    });
    return { id: unit.id, title: unit.title, total: gcseSubtopicIds.size, covered: coveredIds.size };
  });
}

/**
 * Whether a page is "extension" content — entirely beyond the GCSE
 * spec — rather than appearing in index.html's journey. A page counts
 * as extension when every one of its declared units resolves (via
 * getSubtopic, normally Curriculum.getSubtopic — passed in rather than
 * required, same reasoning as computeUnitCoverage above) to a subtopic
 * tagged `level: 'extension'`. There's no separate flag on the page
 * entry itself to keep in sync by hand: a page's extension-ness is
 * entirely determined by which curriculum subtopics it declares.
 */
function isExtensionPage(page, getSubtopic) {
  return page.units.length > 0 && page.units.every((id) => {
    const subtopic = getSubtopic(id);
    return subtopic && subtopic.level === 'extension';
  });
}

/**
 * Whether a page is a cross-cutting reference page (see the `kind`
 * note in the file header above), rather than unit-tagged content.
 */
function isReferencePage(page) {
  return page.kind === 'reference';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PAGES, PHASES, COMING_SOON, RECOMMENDED_PATH,
    buildJourney, buildRecommendedPath,
    computeUnitCoverage, isExtensionPage, isReferencePage,
  };
} else if (typeof window !== 'undefined') {
  window.Pages = {
    PAGES, PHASES, COMING_SOON, RECOMMENDED_PATH,
    buildJourney, buildRecommendedPath,
    computeUnitCoverage, isExtensionPage, isReferencePage,
  };
}
