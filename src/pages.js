/**
 * Registry of every interactive simulator (sims/) and static reference
 * page (notes/) in the app, for the landing page (index.html) to list
 * grouped by curriculum unit. `units` mirrors each page's own
 * CURRICULUM_UNITS constant (solarPosition.js, equation-of-time.js,
 * coordinates.js, sun-declination.js, ...) — kept here as plain data,
 * rather than loading every page's script just to read one constant,
 * so this stays a cheap, dependency-free listing.
 *
 * href is relative to the repo root (where index.html lives).
 */

const PAGES = [
  {
    title: 'Sun Path Simulator',
    description: "Drag date, time and latitude to see how the Sun's position and path across the sky change.",
    href: 'sims/sun-path.html',
    units: ['u1.4', 'u1.6', 'u2.9', 'u2.10'],
  },
  {
    title: 'Equation of Time',
    description:
      'Why a sundial and a clock rarely agree, and by how much across the year; apparent, mean and local mean time; time zones and GMT/UT; and how sunrise and sunset times change through the year.',
    href: 'sims/equation-of-time.html',
    units: ['u2.10'],
  },
  {
    title: 'Star Coordinates',
    description:
      'Right ascension, declination, hour angle and sidereal time — pick a star and watch how they all relate, and see why a sidereal day is about 4 minutes shorter than a solar one.',
    href: 'sims/coordinates.html',
    units: ['u1.7', 'u1.8', 'u1.9', 'u1.10', 'u1.11', 'u1.12', 'u1.13', 'u1.14', 'u1.21'],
  },
  {
    title: 'Observing the Sun',
    description:
      "How the Sun's position in the sky changes through the year, and how to observe it safely — declination and transit altitude, structure, sunspots, solar wind, and observation methods from pinhole projection to X-ray imaging.",
    href: 'sims/sun-declination.html',
    units: ['u1.11', 'u2.9', 'u2.5', 'u2.11', 'u2.12', 'u2.13', 'u2.14', 'u5.4'],
  },
  {
    title: 'Retrograde Motion and Planetary Alignments',
    description: 'Watch Mars loop backwards against the stars as Earth overtakes it, and see conjunction, opposition and elongation as one repeating cycle.',
    href: 'sims/solar-system-observation.html',
    units: ['u1.15', 'u1.16', 'u1.17'],
  },
  {
    title: 'Observing Techniques',
    description:
      'A planning reference for an observing session: dark adaptation and averted vision, finding targets with charts and apps, constellations across cultures, and meteor showers.',
    href: 'notes/observing-techniques.html',
    units: ['u1.5', 'u1.18', 'u1.19', 'u1.20'],
  },
  {
    title: 'The Naked-Eye Sky',
    description:
      "What you can see without a telescope and how to tell it apart — planets, stars, satellites, meteors, comets and aurorae — plus the Milky Way, star charts of seven key constellations and asterisms, and using the Plough's Pointers to find Polaris.",
    href: 'notes/naked-eye-sky.html',
    units: ['u1.1', 'u1.2', 'u1.3'],
  },
  {
    title: 'Measuring the Sky',
    description:
      "How Eratosthenes measured the Earth and Aristarchus the Moon and Sun, using shadows and angles; the real sizes and distances of the Earth, Moon and Sun, and the 400× coincidence behind eclipses; and precession, which slowly changes the pole star.",
    href: 'notes/measuring-the-sky.html',
    units: ['u2.6', 'u2.28', 'u2.29'],
  },
  {
    title: 'Tides',
    description:
      "How the Moon's gravity, and to a lesser extent the Sun's, raises two tidal bulges; why most places get two high and two low tides a day; and spring and neap tides, with a diagram that follows the Moon's phase.",
    href: 'notes/tides.html',
    units: ['u2.7'],
  },
  {
    title: 'Archaeoastronomy: Precession and Monuments',
    description:
      "Why the pole star changes over millennia — Thuban, not Polaris, for the ancient Egyptians — and what that ~26,000-year wobble explains about two real monuments: Stonehenge's solstice-sunrise alignment and the Great Pyramid of Giza's star-aligned shafts.",
    href: 'notes/archaeoastronomy.html',
    units: ['u3.5'],
  },
  {
    title: 'Earth: Structure, Atmosphere and Motion',
    description:
      "Earth's shape and layered interior, latitude, longitude and the named reference lines on a labelled globe, the atmosphere's composition and layers, why it both helps and hinders astronomy, the transmission window that limits ground-based telescopes, and Earth's own rotation, revolution and tilt.",
    href: 'notes/earth-structure.html',
    units: ['u2.1', 'u2.9', 'u2.15', 'u2.16'],
  },
  {
    title: 'From Earth-Centred to Sun-Centred',
    description:
      "How astronomy moved on from a thousand years of Earth at the centre: Ptolemy's epicycles (try the interactive diagram and watch a retrograde loop appear), Tycho Brahe's unprecedented observational precision, Kepler finding ellipses in Brahe's own Mars data, and the two telescope observations — Jupiter's moons and the phases of Venus — Galileo made that the old model couldn't explain.",
    href: 'notes/geocentric-to-heliocentric.html',
    units: ['u3.1', 'u3.2', 'u3.6', 'u3.7', 'u3.15'],
  },
  {
    title: "Kepler's Laws of Planetary Motion",
    description:
      "An ellipse with the Sun at one focus, perihelion and aphelion, equal-area wedges swept out faster near the Sun and slower away from it, and the T² vs r³ graph for the eight planets — plus a central-mass control showing why the constant depends inversely on mass.",
    href: 'sims/kepler.html',
    units: ['u3.9', 'u3.10', 'u3.11', 'u3.12'],
  },
  {
    title: 'Orbits and Gravity',
    description:
      "Newton's cannon: a real numerical simulation of gravity alone turning a launch speed into a falling arc, a circle, an ellipse or an escape — with the equal-area wedges emerging from the physics, not assumed. Plus an inverse-square widget for how gravity's strength changes with distance and mass, by ratio rather than formula.",
    href: 'sims/orbits-gravity.html',
    units: ['u3.8', 'u3.13', 'u3.14'],
  },
  {
    title: 'The Scale of the Solar System',
    description:
      "A logarithmic distance slider from the Moon out past Neptune to the nearest stars, the astronomical unit, light year and parsec explained side by side, and how long light takes to reach each planet.",
    href: 'notes/scale-of-the-solar-system.html',
    units: ['u3.3', 'u3.4'],
  },
  {
    title: 'Formulae and Data Sheet',
    description:
      "The exam's own Appendix 2 data sheet, reproduced in full: all six given equations (linked to the page that uses each, where one exists), the constants, and the planet and dwarf-planet table every Kepler's-third-law question draws on.",
    href: 'notes/data-sheet.html',
    // Only the units this page actually teaches towards, not every unit
    // its "coming soon" equation rows merely name — distance modulus,
    // redshift and Hubble's law (u4.2/u6.1/u6.2) aren't taught anywhere
    // yet, so tagging this page with them would wrongly claim they're
    // covered. Magnification now links to Telescopes (u5.2) instead.
    units: ['u1.21', 'u2.28', 'u3.4', 'u3.11'],
  },
  {
    title: 'Moon Phases',
    description:
      "Two synced views: why phases happen (the Moon's position relative to the Sun) and what you'd actually see from Earth — plus the Moon's changing distance on its elliptical orbit, and when a full Moon counts as a supermoon.",
    href: 'sims/moon-phases.html',
    units: ['u2.3', 'u2.18'],
  },
  {
    title: 'Sidereal vs Synodic Month',
    description:
      "Animate Earth orbiting the Sun and the Moon orbiting Earth to see why the Moon takes ~27.3 days to line up with the same star again, but ~29.53 days to repeat the same phase.",
    href: 'sims/sidereal-vs-synodic.html',
    units: ['u2.17'],
  },
  {
    title: 'Eclipses',
    description:
      "Why there isn't an eclipse every month: pick a date to see where the Moon sits on its tilted orbit relative to the line of nodes, and whether a solar or lunar eclipse is geometrically possible.",
    href: 'sims/eclipses.html',
    units: ['u2.8', 'u2.19'],
  },
  {
    title: 'The Moon: Structure, Surface and Origin',
    description:
      "The Moon's layers and surface features, an interactive map for learning the seven named features on sight, synchronous rotation and libration, the near and far sides, what it takes to get there, and the Giant Impact Hypothesis.",
    href: 'notes/moon-structure.html',
    units: ['u2.2', 'u2.20', 'u2.21', 'u2.22', 'u2.23', 'u2.24', 'u2.25', 'u2.26', 'u2.27'],
  },
  {
    title: 'Telescopes: Magnification, Light Grasp and Resolution',
    description:
      "Why a telescope beats the naked eye, live magnification/light-grasp/resolution readouts with a simulated double star and star cluster that sharpen as the aperture grows, the four classic telescope designs, and why reflectors took over from refractors.",
    href: 'notes/telescopes.html',
    units: ['u5.1', 'u5.2'],
  },
  {
    title: 'Bodies of the Solar System',
    description:
      "A sortable table and bar chart comparing the planets and dwarf planets, asteroids/meteoroids/comets, a comet-tail diagram and the Kuiper Belt/Oort Cloud on a logarithmic scale, meteorites, the ecliptic plane, transits of Venus and measuring the AU, and brief formation theories — a first draft pending teacher review.",
    href: 'notes/solar-system-bodies.html',
    units: ['u3.16', 'u3.17', 'u3.18', 'u3.19', 'u3.20', 'u3.21', 'u3.22', 'u3.23', 'u3.24', 'u3.25'],
  },
  {
    title: 'Gravitational Potential Energy and Orbital Energy',
    description:
      "Beyond the GCSE spec: A-level extension. Gravitational potential energy defined as work, a draggable V(r) = -GM/r potential well, mgh vs the exact formula, the g-r graph's shaded area as potential difference, a satellite's live kinetic/potential/total energy as its orbit is raised, and escaping as total energy reaching zero.",
    href: 'sims/gravitational-potential.html',
    units: ['u3.26', 'u3.27'],
  },
];

/**
 * A suggested order to work through every page above, grouped into
 * rough phases. This is editorial judgement about how a student would
 * actually progress — deliberately not alphabetical and not spec
 * order — so it's kept separate from PAGES itself, which stays plain,
 * unordered data grouped only by curriculum unit.
 *
 * Each step's href must name a real PAGES entry exactly once across
 * the whole path (test/pages.test.js checks this), and `why` is a
 * one-line reason for that page's place in the sequence — what it
 * builds on, or why it comes before/after its neighbours — shown
 * alongside that page's own title and description on index.html.
 */
const RECOMMENDED_PATH = [
  {
    phase: 'Naked-eye observing, first',
    steps: [
      {
        href: 'notes/naked-eye-sky.html',
        why: "Start here — no maths yet, just learning to recognise what's actually up there and the star patterns worth knowing.",
      },
      {
        href: 'notes/observing-techniques.html',
        why: 'The how that goes with it: dark adaptation, star charts and apps, and catching a meteor shower.',
      },
    ],
  },
  {
    phase: 'Coordinates, the Sun and time',
    steps: [
      {
        href: 'sims/coordinates.html',
        why: 'The toolkit most of what follows leans on: right ascension, declination, hour angle, sidereal time, and finding your latitude from Polaris.',
      },
      {
        href: 'sims/sun-path.html',
        why: 'Puts that toolkit to work on one object across a day and a year, and introduces the seasons.',
      },
      {
        href: 'sims/equation-of-time.html',
        why: 'Goes deeper into the time ideas Sun Path just raised — why a sundial and a clock disagree.',
      },
      {
        href: 'sims/sun-declination.html',
        why: "The Sun's own structure and how to observe it safely, reusing the transit-altitude idea from Star Coordinates.",
      },
      {
        href: 'sims/solar-system-observation.html',
        why: 'Carries the same sky-motion thinking from stars and the Sun out to the planets.',
      },
    ],
  },
  {
    phase: 'Earth itself',
    steps: [
      {
        href: 'notes/earth-structure.html',
        why: 'Turns the lens on Earth itself, tying the seasons back to its axial tilt.',
      },
      {
        href: 'notes/measuring-the-sky.html',
        why: "How the ancients first measured Earth, the Moon and the Sun — reusing Star Coordinates' meridian diagram directly.",
      },
      {
        href: 'notes/archaeoastronomy.html',
        why: "Builds directly on Measuring the Sky's precession section — what that 26,000-year wobble meant for real ancient monuments.",
      },
      {
        href: 'notes/geocentric-to-heliocentric.html',
        why: 'Another piece of astronomy’s history: how the Earth-centred model slowly gave way to the Sun-centred one, setting up why Kepler’s laws, next, were worth discovering at all.',
      },
      {
        href: 'sims/kepler.html',
        why: 'From ancient models of the sky to the actual physics of orbits: why they’re ellipses, why speed changes around one, and how period and distance relate.',
      },
      {
        href: 'sims/orbits-gravity.html',
        why: "Kepler described the three laws; this is Newton explaining why they're true — simulating gravity itself, rather than assuming the ellipse Kepler's page draws.",
      },
      {
        href: 'notes/data-sheet.html',
        why: 'The reference page Kepler’s third law questions just started drawing on — worth bookmarking, since every exam question gives you these same equations and figures.',
      },
      {
        href: 'notes/scale-of-the-solar-system.html',
        why: 'Puts that same data-sheet distance table to a different use: just how big the Solar System actually is, and why AU, light years and parsecs each earn their place.',
      },
      {
        href: 'notes/solar-system-bodies.html',
        why: "Rounds out the Solar System itself: the same data-sheet planet table compared directly, then everything smaller — asteroids, comets, meteorites — plus how a transit of Venus first measured the AU just introduced.",
      },
    ],
  },
  {
    phase: 'The Moon system',
    steps: [
      {
        href: 'sims/moon-phases.html',
        why: 'Moves on to the Moon: why its shape changes, and its elliptical orbit.',
      },
      {
        href: 'sims/sidereal-vs-synodic.html',
        why: "The same sidereal-vs-solar distinction as Star Coordinates' day version, one level up: two different \"months\".",
      },
      {
        href: 'notes/tides.html',
        why: 'Spring and neap tides, tied directly to the phase just covered.',
      },
      {
        href: 'sims/eclipses.html',
        why: 'Needs the phase and tilted-orbit ideas from the last three pages to make sense of.',
      },
      {
        href: 'notes/moon-structure.html',
        why: 'Closes out the Moon cluster: its surface features, formation and internal structure.',
      },
    ],
  },
  {
    phase: 'Observational equipment',
    steps: [
      {
        href: 'notes/telescopes.html',
        why: "Finishes with the equipment that made everything above observable in the first place — including Galileo's own telescope, back on From Earth-Centred to Sun-Centred.",
      },
    ],
  },
];

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
 * spec — rather than appearing in index.html's main Recommended path.
 * A page counts as extension when every one of its declared units
 * resolves (via getSubtopic, normally Curriculum.getSubtopic — passed
 * in rather than required, same reasoning as computeUnitCoverage above)
 * to a subtopic tagged `level: 'extension'`. There's no separate flag
 * on the page entry itself to keep in sync by hand: a page's
 * extension-ness is entirely determined by which curriculum subtopics
 * it declares.
 */
function isExtensionPage(page, getSubtopic) {
  return page.units.length > 0 && page.units.every((id) => {
    const subtopic = getSubtopic(id);
    return subtopic && subtopic.level === 'extension';
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PAGES, RECOMMENDED_PATH, computeUnitCoverage, isExtensionPage };
} else if (typeof window !== 'undefined') {
  window.Pages = { PAGES, RECOMMENDED_PATH, computeUnitCoverage, isExtensionPage };
}
