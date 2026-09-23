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
    units: ['u1.4', 'u1.6', 'u2.9', 'u2.10', 'u3.3'],
  },
  {
    title: 'Equation of Time',
    description: 'Why a sundial and a clock rarely agree, and by how much across the year.',
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
    title: 'Earth: Structure, Atmosphere and Motion',
    description:
      "Earth's shape and layered interior, the atmosphere's composition and layers, why it both helps and hinders astronomy, the transmission window that limits ground-based telescopes, and Earth's own rotation, revolution and tilt.",
    href: 'notes/earth-structure.html',
    units: ['u2.1', 'u2.9', 'u2.15', 'u2.16'],
  },
];

const api = { PAGES };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else if (typeof window !== 'undefined') {
  window.Pages = api;
}
