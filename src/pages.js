/**
 * Registry of every interactive page in the app, for the landing page
 * (index.html) to list grouped by curriculum unit. `units` mirrors each
 * page's own CURRICULUM_UNITS constant (solarPosition.js,
 * equation-of-time.js, coordinates.js, sun-declination.js) — kept here
 * as plain data, rather than loading every page's script just to read
 * one constant, so this stays a cheap, dependency-free listing.
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
    title: 'Sun Declination and Transit Altitude',
    description: "What's the Sun's altitude at transit at latitude X on date Y? The classic exam question, explored directly.",
    href: 'sims/sun-declination.html',
    units: ['u1.11', 'u2.9'],
  },
  {
    title: 'Retrograde Motion and Planetary Alignments',
    description: 'Watch Mars loop backwards against the stars as Earth overtakes it, and see conjunction, opposition and elongation as one repeating cycle.',
    href: 'sims/solar-system-observation.html',
    units: ['u1.15', 'u1.16', 'u1.17'],
  },
];

const api = { PAGES };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else if (typeof window !== 'undefined') {
  window.Pages = api;
}
