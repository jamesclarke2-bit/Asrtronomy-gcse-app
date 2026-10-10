/**
 * Pearson Edexcel GCSE Astronomy (1AS0) specification points, Topics 1-12
 * — a registry separate from src/curriculum.js's own unit/subtopic
 * structure (u1-u6), which predates this file and was never built
 * topic-by-topic against the real spec. This file exists so that
 * curriculum.js's own `spec` field (see its header comment) has a real
 * target to point at and be checked against.
 *
 * The wording in `text` below is paraphrased, not a verbatim quote of
 * the spec document; `code` and `depth` are taken from the spec as
 * given. `depth` uses the same three values as curriculum.js's own
 * subtopics ('know', 'understand', 'be able to') — not difficulty, see
 * that file's header.
 *
 * Topics 13-16 are out of scope for this file (no spec-tagged content
 * yet at all — see the site inventory report). Adding those as their
 * own topics' worth of SPEC_POINTS, the same way this file does for
 * 1-12, is future work, not done here.
 */

const SPEC_POINTS = [
  // --- Topic 1: Planet Earth -----------------------------------------------
  { code: '1.1', topic: 1, depth: 'know', text: "Earth is an oblate spheroid" },
  { code: '1.2', topic: 1, depth: 'be able to', text: "use Earth's mean diameter (13,000 km)" },
  { code: '1.3', topic: 1, depth: 'understand', text: "Earth's internal divisions (crust, mantle, outer core, inner core)" },
  { code: '1.4', topic: 1, depth: 'be able to', text: 'use latitude and longitude' },
  { code: '1.5', topic: 1, depth: 'be able to', text: 'use surface divisions as reference points (equator, tropics, polar circles, prime meridian, poles)' },
  { code: '1.6', topic: 1, depth: 'understand', text: 'atmosphere effects on observation (sky colour, skyglow, twinkling)' },

  // --- Topic 2: The lunar disc ----------------------------------------------
  { code: '2.1', topic: 2, depth: 'know', text: 'shape of the Moon' },
  { code: '2.2', topic: 2, depth: 'be able to', text: "use the Moon's mean diameter (3,500 km)" },
  { code: '2.3', topic: 2, depth: 'be able to', text: 'recognise craters, maria, terrae, mountains, valleys' },
  { code: '2.4', topic: 2, depth: 'understand', text: 'structure and origin of those features' },
  { code: '2.5', topic: 2, depth: 'be able to', text: 'identify the seven named lunar features' },
  { code: '2.6', topic: 2, depth: 'be able to', text: "use the Moon's rotation and orbital periods" },
  { code: '2.7', topic: 2, depth: 'understand', text: "the synchronous nature of the Moon's orbit" },
  { code: '2.8', topic: 2, depth: 'understand', text: 'causes of libration and its effect on visibility' },

  // --- Topic 3: The Earth-Moon-Sun system -----------------------------------
  { code: '3.1', topic: 3, depth: 'be able to', text: 'use relative sizes of Earth, Moon and Sun' },
  { code: '3.2', topic: 3, depth: 'be able to', text: 'use relative distances between them' },
  { code: '3.3', topic: 3, depth: 'understand', text: 'how Eratosthenes and Aristarchus found sizes and distances' },
  { code: '3.4', topic: 3, depth: 'be able to', text: "use the Sun's mean diameter (1.4 x 10^6 km)" },
  { code: '3.5', topic: 3, depth: 'understand', text: 'Sun and Moon effects in spring and neap tides' },
  { code: '3.6', topic: 3, depth: 'understand', text: "precession's effect on the appearance of Sun, Moon and stars, and archaeoastronomy" },
  { code: '3.7', topic: 3, depth: 'be able to', text: 'use data on the rate of precession' },
  { code: '3.8', topic: 3, depth: 'understand', text: 'appearance of the Sun in solar eclipses, including umbral contacts' },
  { code: '3.9', topic: 3, depth: 'understand', text: 'appearance of the Moon in lunar eclipses, including umbral contacts' },
  { code: '3.10', topic: 3, depth: 'understand', text: 'causes of solar and lunar eclipses' },

  // --- Topic 4: Time and the Earth-Moon-Sun cycles --------------------------
  { code: '4.1', topic: 4, depth: 'understand', text: 'sidereal vs synodic days' },
  { code: '4.2', topic: 4, depth: 'understand', text: "the Sun's role in apparent solar time (AST)" },
  { code: '4.3', topic: 4, depth: 'understand', text: 'the Mean Sun, mean solar time (MST) and local mean time (LMT)' },
  { code: '4.4', topic: 4, depth: 'be able to', text: 'use Equation of Time = AST - MST' },
  { code: '4.5', topic: 4, depth: 'understand', text: 'annual variation of the Equation of Time' },
  { code: '4.6', topic: 4, depth: 'understand', text: 'causes of that variation' },
  { code: '4.7', topic: 4, depth: 'understand', text: 'finding local noon with shadows and a shadow stick' },
  { code: '4.8', topic: 4, depth: 'understand', text: 'structure and use of sundials' },
  { code: '4.9', topic: 4, depth: 'understand', text: 'the lunar phase cycle' },
  { code: '4.10', topic: 4, depth: 'understand', text: 'sidereal vs synodic months' },
  { code: '4.11', topic: 4, depth: 'understand', text: 'annual variation in sunrise and sunset times' },
  { code: '4.12', topic: 4, depth: 'understand', text: 'significance of equinoxes and solstices' },
  { code: '4.13', topic: 4, depth: 'understand', text: "variation in the Sun's apparent motion through the year" },
  { code: '4.14', topic: 4, depth: 'understand', text: 'relationship between sidereal and synodic time' },
  { code: '4.15', topic: 4, depth: 'understand', text: 'difference in local time at different longitudes' },
  { code: '4.16', topic: 4, depth: 'understand', text: 'the use of time zones' },
  { code: '4.17', topic: 4, depth: 'be able to', text: 'use time-zone data' },
  { code: '4.18', topic: 4, depth: 'know', text: 'mean time on the prime meridian is GMT, the same as UT' },
  { code: '4.19', topic: 4, depth: 'be able to', text: 'use shadow-stick data and the Equation of Time to find longitude' },
  { code: '4.20', topic: 4, depth: 'understand', text: 'astronomical methods of finding longitude, including lunar distance' },
  { code: '4.21', topic: 4, depth: 'understand', text: "the horological method (Harrison's marine chronometer)" },

  // --- Topic 5: Solar System observation ------------------------------------
  { code: '5.1', topic: 5, depth: 'understand', text: 'pinhole projection to observe the Sun safely' },
  { code: '5.2', topic: 5, depth: 'understand', text: "the Sun's annual path is the ecliptic" },
  { code: '5.3', topic: 5, depth: 'understand', text: 'changing positions of planets in the night sky' },
  { code: '5.4', topic: 5, depth: 'understand', text: 'planetary motion lies within the zodiacal band' },
  { code: '5.5', topic: 5, depth: 'understand', text: 'retrograde motion of planets' },
  { code: '5.6', topic: 5, depth: 'understand', text: 'First Point of Aries and First Point of Libra' },
  { code: '5.7', topic: 5, depth: 'understand', text: 'meteors and meteor showers, including finding the radiant' },
  { code: '5.8', topic: 5, depth: 'understand', text: 'conjunction (superior and inferior), opposition, elongation, transit, occultation' },

  // --- Topic 6: Celestial observation ----------------------------------------
  {
    code: '6.1',
    topic: 6,
    depth: 'be able to',
    text: 'recognise naked-eye phenomena (Sun, Moon, stars including double stars, clusters, galaxies and nebulae, planets, comets, meteors, aurorae, supernovae, satellites, aircraft)',
  },
  {
    code: '6.2',
    topic: 6,
    depth: 'be able to',
    text: 'recognise and draw seven constellations/asterisms (Cassiopeia, Cygnus, Orion, Plough, Southern Cross, Summer Triangle, Square of Pegasus)',
  },
  {
    code: '6.3',
    topic: 6,
    depth: 'understand',
    text: "asterisms as pointers (Arcturus and Polaris from the Plough; Sirius, Aldebaran and the Pleiades from Orion's Belt; Fomalhaut and Andromeda from the Square of Pegasus)",
  },
  { code: '6.4', topic: 6, depth: 'understand', text: 'why names differ among cultures' },
  { code: '6.5', topic: 6, depth: 'be able to', text: 'use star charts, planispheres and apps' },
  { code: '6.6', topic: 6, depth: 'understand', text: 'causes and effects of light pollution' },
  { code: '6.7', topic: 6, depth: 'understand', text: 'celestial sphere, celestial poles, celestial equator' },
  { code: '6.8', topic: 6, depth: 'understand', text: 'the equatorial coordinate system (RA and declination)' },
  { code: '6.9', topic: 6, depth: 'understand', text: 'the horizon coordinate system (altitude and azimuth)' },
  { code: '6.10', topic: 6, depth: 'understand', text: 'how latitude links equatorial and horizon coordinates at the meridian' },
  { code: '6.11', topic: 6, depth: 'understand', text: 'how the meridian defines local sidereal time and hour angle' },
  { code: '6.12', topic: 6, depth: 'be able to', text: 'use coordinates to find the best time or object to observe' },
  { code: '6.13', topic: 6, depth: 'understand', text: 'cardinal points, culmination, meridian, zenith, circumpolarity' },
  { code: '6.14', topic: 6, depth: 'understand', text: "diurnal motion due to Earth's rotation" },
  { code: '6.15', topic: 6, depth: 'be able to', text: 'use declination to decide whether a star is circumpolar' },
  { code: '6.16', topic: 6, depth: 'understand', text: 'apparent motion of circumpolar stars, upper and lower transit' },
  { code: '6.17', topic: 6, depth: 'be able to', text: 'use rising and setting times to predict position' },
  { code: '6.18', topic: 6, depth: 'be able to', text: 'find latitude using Polaris' },
  { code: '6.19', topic: 6, depth: 'understand', text: 'dark adaptation and averted vision' },
  { code: '6.20', topic: 6, depth: 'understand', text: 'factors affecting visibility (rising and setting, seeing, weather, landscape)' },
  { code: '6.21', topic: 6, depth: 'understand', text: 'the naked-eye appearance of the Milky Way' },

  // --- Topic 9: Exploring the Moon -------------------------------------------
  { code: '9.1', topic: 9, depth: 'understand', text: "the Moon's internal divisions compared with Earth's" },
  { code: '9.2', topic: 9, depth: 'understand', text: 'differences in appearance between near and far sides' },
  { code: '9.3', topic: 9, depth: 'understand', text: 'how far-side information was gathered' },
  { code: '9.4', topic: 9, depth: 'understand', text: 'reaching the Moon needs escape velocity, only possible with rockets' },
  { code: '9.5', topic: 9, depth: 'understand', text: 'Giant Impact Hypothesis and alternatives (Capture, Co-accretion)' },

  // --- Topic 10: Solar astronomy ----------------------------------------------
  { code: '10.1', topic: 10, depth: 'understand', text: 'safe Sun observation (telescopic projection, H-alpha filter)' },
  { code: '10.2', topic: 10, depth: 'know', text: "location and relative temperatures of the Sun's internal divisions" },
  { code: '10.3', topic: 10, depth: 'understand', text: 'role of those divisions in energy production and transfer' },
  { code: '10.4', topic: 10, depth: 'understand', text: 'the proton-proton cycle' },
  { code: '10.5', topic: 10, depth: 'know', text: 'location, temperature and density of the chromosphere and corona' },
  { code: '10.6', topic: 10, depth: 'understand', text: 'structure, origin and evolution of sunspots' },
  { code: '10.7', topic: 10, depth: 'be able to', text: 'use sunspot data to find the mean solar rotation period' },
  { code: '10.8', topic: 10, depth: 'be able to', text: 'use sunspot data on the solar cycle' },
  { code: '10.9', topic: 10, depth: 'understand', text: "the Sun's appearance across the electromagnetic spectrum" },
  { code: '10.10', topic: 10, depth: 'understand', text: 'nature, composition and origin of the solar wind' },
  {
    code: '10.11',
    topic: 10,
    depth: 'understand',
    text: 'effects of the solar wind (aurorae, comet tails, geomagnetic storms, satellites, aircraft, manned missions)',
  },
  { code: '10.12', topic: 10, depth: 'know', text: 'shape and position of the magnetosphere, including Van Allen belts' },

  // --- Topic 7: Early models of the Solar System ------------------------------
  {
    code: '7.1',
    topic: 7,
    depth: 'understand',
    text: 'ancient civilisations used observations of solar and lunar cycles for agriculture, religion, time and calendars, and aligning monuments',
  },
  { code: '7.2', topic: 7, depth: 'understand', text: "monuments' present alignments differ from the original because of precession" },
  { code: '7.3', topic: 7, depth: 'understand', text: 'early geocentric models' },
  { code: '7.4', topic: 7, depth: 'understand', text: 'the advantage of epicycles (Ptolemy)' },
  { code: '7.5', topic: 7, depth: 'be able to', text: 'use information about the scale of the Solar System' },
  { code: '7.6', topic: 7, depth: 'be able to', text: 'use the astronomical unit (1 AU = 1.5 x 10^8 km), light year and parsec' },

  // --- Topic 8: Planetary motion and gravity ----------------------------------
  { code: '8.1', topic: 8, depth: 'understand', text: "Brahe's observational work in the move from geocentric to heliocentric models" },
  { code: '8.2', topic: 8, depth: 'understand', text: 'the mathematical modelling of Copernicus and Kepler in that move' },
  { code: '8.3', topic: 8, depth: 'understand', text: 'gravity creating stable elliptical orbits' },
  { code: '8.4', topic: 8, depth: 'understand', text: "Kepler's laws" },
  { code: '8.5', topic: 8, depth: 'understand', text: 'aphelion, perihelion, apogee and perigee' },
  { code: '8.6', topic: 8, depth: 'be able to', text: "use Kepler's third law (T squared over r cubed is constant)" },
  { code: '8.7', topic: 8, depth: 'understand', text: 'the constant depends inversely on the mass of the central body' },
  { code: '8.8', topic: 8, depth: 'know', text: "Newton explained Kepler's laws with his law of universal gravitation" },
  {
    code: '8.9',
    topic: 8,
    depth: 'understand',
    text: 'gravitational force is proportional to the product of the masses and inversely proportional to the square of the separation',
  },

  // --- Topic 11: Exploring the Solar System -----------------------------------
  {
    code: '11.1',
    topic: 11,
    depth: 'be able to',
    text: 'use data on the names and relative locations of planets, dwarf planets and small Solar System objects',
  },
  { code: '11.2', topic: 11, depth: 'understand', text: 'comet structure (nucleus, coma, tails)' },
  { code: '11.3', topic: 11, depth: 'understand', text: 'short-period comet orbits and their origin in the Kuiper Belt' },
  { code: '11.4', topic: 11, depth: 'understand', text: 'long-period comet orbits and their origin in the Oort Cloud' },
  { code: '11.5', topic: 11, depth: 'understand', text: 'location and nature of the Kuiper Belt, Oort Cloud and heliosphere' },
  {
    code: '11.6',
    topic: 11,
    depth: 'understand',
    text: "planets' principal characteristics (relative size, relative mass, surface temperature, atmospheric composition, satellites, rings)",
  },
  { code: '11.7', topic: 11, depth: 'understand', text: 'main theories for the formation and position of the gas giants' },
  { code: '11.8', topic: 11, depth: 'be able to', text: 'use information about the size of the Solar System' },
  { code: '11.9', topic: 11, depth: 'be able to', text: 'use the AU, light year and parsec' },
  { code: '11.10', topic: 11, depth: 'understand', text: 'origin and structure of meteoroids and meteorites' },
  { code: '11.11', topic: 11, depth: 'know', text: "most bodies orbit in or near the ecliptic plane" },
  { code: '11.12', topic: 11, depth: 'understand', text: 'transits of Venus (Halley) used to find the AU' },
  { code: '11.13', topic: 11, depth: 'understand', text: "main theories for the origin of water on Earth" },
  { code: '11.14', topic: 11, depth: 'know', text: 'the eye is limited by its small aperture and poor low-light sensitivity' },
  {
    code: '11.15',
    topic: 11,
    depth: 'understand',
    text: 'the objective captures and focuses light, and the eyepiece magnifies the image',
  },
  { code: '11.16', topic: 11, depth: 'know', text: 'convex lenses and concave mirrors collect and focus light' },
  { code: '11.17', topic: 11, depth: 'understand', text: 'simple telescopes combine an objective with an eyepiece' },
  {
    code: '11.18',
    topic: 11,
    depth: 'understand',
    text: 'basic design of Galilean, Keplerian, Newtonian and Cassegrain telescopes (no detailed ray diagrams)',
  },
  { code: '11.19', topic: 11, depth: 'understand', text: "light grasp is proportional to the area of the objective, so the square of its diameter" },
  { code: '11.20', topic: 11, depth: 'know', text: 'aperture is related to the diameter of the objective' },
  {
    code: '11.21',
    topic: 11,
    depth: 'know',
    text: 'field of view is the circle of sky seen through the eyepiece, in degrees or arcminutes',
  },
  {
    code: '11.22',
    topic: 11,
    depth: 'understand',
    text: "resolution depends on the objective's diameter and is reduced at a longer observing wavelength",
  },
  { code: '11.23', topic: 11, depth: 'be able to', text: 'use magnification = focal length of objective / focal length of eyepiece' },
  { code: '11.24', topic: 11, depth: 'understand', text: "Galileo's early telescopic observations and the Sun-centred model" },
  {
    code: '11.25',
    topic: 11,
    depth: 'understand',
    text: 'advantages of reflectors over refractors (chromatic aberration, very long focal lengths, large apertures, multiple mirrors)',
  },
  {
    code: '11.26',
    topic: 11,
    depth: 'understand',
    text: 'advantages and disadvantages of fly-by, orbiter, impactor and lander probes',
  },
  {
    code: '11.27',
    topic: 11,
    depth: 'know',
    text: 'an example of each (New Horizons; Juno or Dawn; Deep Impact; Philae) with target and major discoveries',
  },
  { code: '11.28', topic: 11, depth: 'understand', text: 'a probe must reach escape velocity, which needs rockets' },
  { code: '11.29', topic: 11, depth: 'understand', text: 'advantages and disadvantages of manned missions' },
  { code: '11.30', topic: 11, depth: 'understand', text: 'main features of the Apollo programme' },

  // --- Topic 12: Formation of planetary systems -------------------------------
  {
    code: '12.1',
    topic: 12,
    depth: 'be able to',
    text:
      "identify gravity's operation in the Solar System: (a) regular motion, (b) tidal forces (rings, asteroid belts, internal heating), " +
      '(c) multi-body interactions (shifting orbits, chaos, resonances, Lagrange points), (d) collisions, (e) the solar wind\'s effects',
  },
  {
    code: '12.2',
    topic: 12,
    depth: 'be able to',
    text:
      'identify interactions in forming planets and moons: (a) the Roche limit, (b) round or irregular shape, (c) holding an atmosphere',
  },
  { code: '12.3', topic: 12, depth: 'understand', text: 'main theories for the formation of gas giants' },
  { code: '12.4', topic: 12, depth: 'understand', text: 'exoplanet detection methods (transit, astrometry, radial velocity)' },
  {
    code: '12.5',
    topic: 12,
    depth: 'understand',
    text: 'the requirements for life, and life on Titan, Europa, Enceladus and outside the Solar System',
  },
  { code: '12.6', topic: 12, depth: 'understand', text: 'Goldilocks (habitable) zones' },
  { code: '12.7', topic: 12, depth: 'understand', text: 'the Drake equation' },
  { code: '12.8', topic: 12, depth: 'understand', text: 'SETI by radio, and the benefits and dangers of finding extraterrestrial life' },
];

function getSpecPoint(code) {
  return SPEC_POINTS.find((point) => point.code === code);
}

const SPEC_POINT_CODES = SPEC_POINTS.map((point) => point.code);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SPEC_POINTS, SPEC_POINT_CODES, getSpecPoint };
} else if (typeof window !== 'undefined') {
  window.SpecPoints = { SPEC_POINTS, SPEC_POINT_CODES, getSpecPoint };
}
