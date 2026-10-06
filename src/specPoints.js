/**
 * Pearson Edexcel GCSE Astronomy (1AS0) specification points, Topics 1-6,
 * 9 and 10 — a registry separate from src/curriculum.js's own unit/
 * subtopic structure (u1-u6), which predates this file and was never
 * built topic-by-topic against the real spec. This file exists so that
 * curriculum.js's own `spec` field (see its header comment) has a real
 * target to point at and be checked against for these topics, the same
 * way Topics 7, 8 and 11 already point at spec ids that happen to be
 * hand-typed there without a central list.
 *
 * The wording in `text` below is paraphrased, not a verbatim quote of
 * the spec document; `code` and `depth` are taken from the spec as
 * given. `depth` uses the same three values as curriculum.js's own
 * subtopics ('know', 'understand', 'be able to') — not difficulty, see
 * that file's header.
 *
 * Topics 7, 8, 11-16 are out of scope for this file (7/8/11 already
 * have hand-typed spec ids in curriculum.js with no central registry;
 * 12-16 have no spec-tagged content yet at all — see the site inventory
 * report). Adding those as their own topics' worth of SPEC_POINTS,
 * the same way this file does for 1-6/9/10, is future work, not done
 * here.
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
