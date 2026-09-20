/**
 * GCSE Astronomy curriculum
 * -------------------------
 * A first-pass draft of the six teaching units and their subtopics,
 * to be corrected against the real specification.
 *
 * Each subtopic is tagged by depth — 'know', 'understand' or
 * 'be able to' — rather than difficulty, since this GCSE isn't tiered.
 *
 * IDs are stable references other modules can use: a unit id ("u2")
 * for the whole unit, or a subtopic id ("u2.9") to pin a specific
 * point. Simulations declare which subtopic ids they cover (see
 * CURRICULUM_UNITS in src/solarPosition.js) so the app can show what
 * a given simulation is teaching towards.
 *
 * "Our place in the Galaxy" appears under both u4 and u6 on purpose:
 * u4.4 is about the Milky Way's own structure, u6.5 is about our
 * position within the wider observable Universe.
 */

const UNITS = [
  {
    id: 'u1',
    title: 'Observations',
    subtopics: [
      { id: 'u1.1', title: 'Naked-eye phenomena', depth: 'know' },
      { id: 'u1.2', title: 'Constellations and asterisms', depth: 'understand' },
      {
        id: 'u1.3',
        title: 'Pointer stars',
        depth: 'be able to',
        notes: "e.g. using the Plough's Pointers to find Polaris",
      },
      {
        id: 'u1.4',
        title: 'Coordinate systems',
        depth: 'understand',
        notes: 'horizontal (altitude/azimuth) and equatorial (right ascension/declination)',
      },
      {
        id: 'u1.5',
        title: 'Seeing conditions',
        depth: 'understand',
        notes: 'light pollution, atmospheric seeing and transparency',
      },
      {
        id: 'u1.6',
        title: 'Observational terminology',
        depth: 'know',
        notes: 'cardinal points, meridian, zenith, culmination',
      },
    ],
  },
  {
    id: 'u2',
    title: 'Earth, Moon & Sun system',
    subtopics: [
      { id: 'u2.1', title: 'Earth structure', depth: 'know' },
      { id: 'u2.2', title: 'Moon structure', depth: 'know' },
      { id: 'u2.3', title: 'Phases of the Moon', depth: 'understand' },
      {
        id: 'u2.4',
        title: 'Nuclear fusion',
        depth: 'know',
        notes: "hydrogen fusing to helium as the Sun's energy source",
      },
      {
        id: 'u2.5',
        title: 'Sunspots',
        depth: 'understand',
        notes: 'cooler, magnetically active regions; the solar cycle',
      },
      {
        id: 'u2.6',
        title: 'Historical sizes and distances',
        depth: 'understand',
        notes: "e.g. Eratosthenes' measurement of the Earth, Aristarchus' method for the Moon and Sun",
      },
      { id: 'u2.7', title: 'Tides', depth: 'understand', notes: 'spring and neap tides' },
      {
        id: 'u2.8',
        title: 'Eclipses',
        depth: 'understand',
        notes: 'solar and lunar eclipses; umbra and penumbra',
      },
      {
        id: 'u2.9',
        title: 'Seasons',
        depth: 'understand',
        notes: 'caused by axial tilt, not distance from the Sun',
      },
      {
        id: 'u2.10',
        title: 'Time',
        depth: 'understand',
        notes: 'solar time vs. clock time; the Equation of Time, caused by orbital eccentricity and axial tilt.',
      },
    ],
  },
  {
    id: 'u3',
    title: 'Solar systems',
    subtopics: [
      {
        id: 'u3.1',
        title: 'Historical models',
        depth: 'know',
        notes: 'geocentric vs heliocentric — Ptolemy, Copernicus, Galileo, Kepler',
      },
      {
        id: 'u3.2',
        title: 'Orbital mechanics',
        depth: 'be able to',
        notes: "Kepler's laws, including calculations relating orbital period and distance",
      },
      {
        id: 'u3.3',
        title: 'Formation of the Solar System',
        depth: 'understand',
        notes: 'solar nebula theory; formation of the Sun and planets',
      },
      {
        id: 'u3.4',
        title: 'Water on Earth theory',
        depth: 'understand',
        notes: 'competing theories, e.g. cometary/asteroid delivery vs volcanic outgassing',
      },
    ],
  },
  {
    id: 'u4',
    title: 'Stars',
    subtopics: [
      {
        id: 'u4.1',
        title: 'Stellar evolution',
        depth: 'understand',
        notes: 'life cycle by mass; the Hertzsprung-Russell diagram',
      },
      {
        id: 'u4.2',
        title: 'Brightness and magnitude calculations',
        depth: 'be able to',
        notes: 'apparent vs absolute magnitude',
      },
      {
        id: 'u4.3',
        title: 'Variable stars',
        depth: 'understand',
        notes: 'e.g. Cepheids and eclipsing binaries; use as standard candles',
      },
      {
        id: 'u4.4',
        title: 'Our place in the Galaxy',
        depth: 'know',
        notes: "the Milky Way's structure and the Solar System's location within it",
      },
    ],
  },
  {
    id: 'u5',
    title: 'Observational equipment',
    subtopics: [
      { id: 'u5.1', title: 'Telescopes', depth: 'know', notes: 'refracting and reflecting designs' },
      {
        id: 'u5.2',
        title: 'Magnification and resolution',
        depth: 'be able to',
        notes: 'including calculations from focal lengths and aperture',
      },
      {
        id: 'u5.3',
        title: 'Space probes',
        depth: 'know',
        notes: 'flyby, orbiter, lander and rover missions',
      },
    ],
  },
  {
    id: 'u6',
    title: 'Cosmology',
    subtopics: [
      {
        id: 'u6.1',
        title: 'Redshift',
        depth: 'understand',
        notes: 'Doppler shift applied to light from receding sources',
      },
      {
        id: 'u6.2',
        title: "Hubble's law",
        depth: 'be able to',
        notes: 'v = H0 x d; calculating recession velocity or distance',
      },
      {
        id: 'u6.3',
        title: 'Big Bang evidence',
        depth: 'know',
        notes: 'cosmic microwave background, redshift of galaxies, light-element abundances',
      },
      {
        id: 'u6.4',
        title: 'Dark matter and dark energy',
        depth: 'understand',
        notes: 'galaxy rotation curves; accelerating expansion',
      },
      {
        id: 'u6.5',
        title: 'Our place in the Galaxy',
        depth: 'understand',
        notes: "the Milky Way's location and scale among other galaxies in the observable Universe",
      },
    ],
  },
];

function getUnit(unitId) {
  return UNITS.find((unit) => unit.id === unitId);
}

function getSubtopic(subtopicId) {
  for (const unit of UNITS) {
    const subtopic = unit.subtopics.find((s) => s.id === subtopicId);
    if (subtopic) return { ...subtopic, unitId: unit.id, unitTitle: unit.title };
  }
  return undefined;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UNITS, getUnit, getSubtopic };
} else if (typeof window !== 'undefined') {
  window.Curriculum = { UNITS, getUnit, getSubtopic };
}
