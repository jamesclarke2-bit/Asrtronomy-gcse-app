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
    description: 'Right ascension, declination, hour angle and sidereal time — pick a star and watch how they all relate.',
    href: 'sims/coordinates.html',
    units: ['u1.7', 'u1.8', 'u1.9', 'u1.10', 'u1.11', 'u1.12', 'u1.13', 'u1.14'],
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
    title: 'Earth: Structure, Atmosphere and Motion',
    description:
      "Earth's shape and layered interior, latitude, longitude and the named reference lines on a labelled globe, the atmosphere's composition and layers, why it both helps and hinders astronomy, the transmission window that limits ground-based telescopes, and Earth's own rotation, revolution and tilt.",
    href: 'notes/earth-structure.html',
    units: ['u2.1', 'u2.9', 'u2.15', 'u2.16'],
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
];

const api = { PAGES };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else if (typeof window !== 'undefined') {
  window.Pages = api;
}
