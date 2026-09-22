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
      {
        id: 'u1.7',
        title: 'Local sidereal time',
        depth: 'be able to',
        notes: 'calculating local sidereal time from date, time and longitude',
      },
      {
        id: 'u1.8',
        title: 'Hour angle',
        depth: 'be able to',
        notes:
          'HA = LST - RA; negative HA = east of the meridian (not yet transited), positive HA = west (already transited)',
      },
      {
        id: 'u1.9',
        title: 'Polar distance',
        depth: 'be able to',
        notes: 'angular distance from the north celestial pole: 90 - declination',
      },
      {
        id: 'u1.10',
        title: 'Circumpolarity',
        depth: 'be able to',
        notes: "whether an object ever sets, from its declination and the observer's latitude",
      },
      {
        id: 'u1.11',
        title: 'Maximum altitude at upper transit',
        depth: 'be able to',
        notes: 'altitude at transit = 90 - |latitude - declination|',
      },
      {
        id: 'u1.12',
        title: 'Altitude/azimuth from hour angle',
        depth: 'be able to',
        notes: 'from declination, hour angle and latitude, using the standard spherical-triangle formulas',
      },
      {
        id: 'u1.13',
        title: 'Finding latitude via Polaris',
        depth: 'be able to',
        notes: "Polaris's altitude approximates the observer's latitude, since it lies close to the north celestial pole",
      },
      {
        id: 'u1.14',
        title: 'Diurnal motion',
        depth: 'understand',
        notes: "the apparent daily rotation of the sky (rise, transit, set) caused by Earth's rotation",
      },
      {
        id: 'u1.15',
        title: 'Retrograde motion and planetary alignments',
        depth: 'understand',
        notes:
          "apparent retrograde loops, caused by Earth overtaking an outer planet on a faster inner orbit; conjunction, opposition and elongation as the possible Sun-Earth-planet alignments",
      },
      {
        id: 'u1.16',
        title: 'The ecliptic and the zodiacal band',
        depth: 'know',
        notes:
          "the ecliptic is the projection of Earth's orbital plane onto the sky; the Sun, Moon and planets are always found within the zodiacal band around it, home to the twelve zodiac constellations",
      },
      {
        id: 'u1.17',
        title: 'Transit and occultation',
        depth: 'know',
        notes:
          'transit: a nearer body crossing the disc of a farther one, e.g. Venus or Mercury crossing the Sun; occultation: a nearer body completely hiding a farther one, e.g. the Moon occulting a star or planet',
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
