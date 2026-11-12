/**
 * Pearson Edexcel GCSE Astronomy (1AS0) specification points, Topics 1-16
 * — a registry separate from src/curriculum.js's own unit/subtopic
 * structure (u1-u6), which predates this file and was never built
 * topic-by-topic against the real spec. This file exists so that
 * curriculum.js's own `spec` field (see its header comment) has a real
 * target to point at and be checked against.
 *
 * The wording in `text` below is paraphrased, not a verbatim quote of
 * the spec document; `code` is taken from the spec as given. `depth`
 * uses the same three values as curriculum.js's own subtopics ('know',
 * 'understand', 'be able to') — not difficulty, see that file's header.
 * For Topics 1-12, `depth` was taken directly from the spec document's
 * own tag for that point; Topic 13 was registered from a paraphrased
 * spec-text summary that doesn't always carry its own explicit
 * know/understand/be-able-to verb, so each of its `depth` values was
 * inferred by matching that point's phrasing against how an
 * identically-phrased Topic 11 point was already tagged (e.g. a plain
 * "X is Y" statement matches 11.16/11.20/11.21's 'know'; an explicit
 * skill verb like "use" or "determine" matches 11.23's 'be able to') —
 * worth checking against the exam board's own depth tag if that's
 * available, rather than treated as equally authoritative as 1-12's.
 *
 * Topics 14-16 were registered from the same paraphrased spec-text
 * summary as Topic 13, with their `depth` taken directly from the
 * exam board's own verb for each point (not inferred by phrasing-match,
 * unlike Topic 13 — see docs/topic-11-16-audit.md).
 *
 * A spec point that bundles several distinct things under one code in
 * the real spec document (e.g. 1.6's "sky colour, skyglow, twinkling",
 * or 12.1's five lettered parts and 12.2's three) is split here into
 * its own lettered sub-code per part, rather than kept as a single
 * point — otherwise one curriculum subtopic tagging only one of
 * several parts would read as covering all of them. See
 * SPEC_POINT_GROUPS below for how a coverage report rolls those
 * sub-codes back up under their shared parent code.
 */

const SPEC_POINTS = [
  // --- Topic 1: Planet Earth -----------------------------------------------
  { code: '1.1', topic: 1, depth: 'know', text: "Earth is an oblate spheroid" },
  { code: '1.2', topic: 1, depth: 'be able to', text: "use Earth's mean diameter (13,000 km)" },
  { code: '1.3', topic: 1, depth: 'understand', text: "Earth's internal divisions (crust, mantle, outer core, inner core)" },
  { code: '1.4', topic: 1, depth: 'be able to', text: 'use latitude and longitude' },
  { code: '1.5', topic: 1, depth: 'be able to', text: 'use surface divisions as reference points (equator, tropics, polar circles, prime meridian, poles)' },
  { code: '1.6a', topic: 1, depth: 'understand', text: 'atmosphere effects on observation: sky colour', group: '1.6' },
  { code: '1.6b', topic: 1, depth: 'understand', text: 'atmosphere effects on observation: skyglow', group: '1.6' },
  { code: '1.6c', topic: 1, depth: 'understand', text: 'atmosphere effects on observation: twinkling', group: '1.6' },

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
  { code: '7.1a', topic: 7, depth: 'understand', group: '7.1', text: 'ancient civilisations used observations of solar and lunar cycles for agriculture' },
  { code: '7.1b', topic: 7, depth: 'understand', group: '7.1', text: 'ancient civilisations used observations of solar and lunar cycles for religion' },
  { code: '7.1c', topic: 7, depth: 'understand', group: '7.1', text: 'ancient civilisations used observations of solar and lunar cycles for time and calendars' },
  { code: '7.1d', topic: 7, depth: 'understand', group: '7.1', text: 'ancient civilisations used observations of solar and lunar cycles for aligning monuments' },
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
  // 11.25 is a multi-part spec point, split into its own lettered
  // sub-codes (matching 1.6/7.1/12.1/12.2's own convention, not Topic
  // 11's usual un-split one — see SPEC_POINT_GROUPS below) so a page
  // can be tagged to exactly the sub-part(s) it actually teaches rather
  // than claiming credit for all four by tagging the bare parent code.
  {
    code: '11.25a',
    topic: 11,
    depth: 'understand',
    group: '11.25',
    text: 'advantages of reflectors over refractors: no chromatic aberration',
  },
  {
    code: '11.25b',
    topic: 11,
    depth: 'understand',
    group: '11.25',
    text: 'advantages of reflectors over refractors: very long focal lengths',
  },
  {
    code: '11.25c',
    topic: 11,
    depth: 'understand',
    group: '11.25',
    text: 'advantages of reflectors over refractors: large apertures',
  },
  {
    code: '11.25d',
    topic: 11,
    depth: 'understand',
    group: '11.25',
    text: 'advantages of reflectors over refractors: multiple mirrors can be combined',
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
  // 12.1 and 12.2 are each a multi-part spec point, split into their own
  // lettered sub-codes rather than kept as one point — see
  // SPEC_POINT_GROUPS below, and its header comment, for why: a single
  // curriculum tag against '12.1' could claim credit for all five of its
  // parts (a)-(e) while a page taught only one. Each sub-code's `group`
  // field names its parent, kept in sync with SPEC_POINT_GROUPS by
  // test/specPoints.test.js.
  {
    code: '12.1a',
    topic: 12,
    depth: 'be able to',
    group: '12.1',
    text: "identify gravity's operation in the Solar System: regular motion caused by gravity",
  },
  {
    code: '12.1b',
    topic: 12,
    depth: 'be able to',
    group: '12.1',
    text: "identify gravity's operation in the Solar System: tidal forces (ring systems, asteroid belts, internal heating)",
  },
  {
    code: '12.1c',
    topic: 12,
    depth: 'be able to',
    group: '12.1',
    text: "identify gravity's operation in the Solar System: multi-body interactions (shifting orbits, chaos, resonances, Lagrange points)",
  },
  {
    code: '12.1d',
    topic: 12,
    depth: 'be able to',
    group: '12.1',
    text: "identify gravity's operation in the Solar System: collisions (impact craters, changes to orbits and tilts)",
  },
  {
    code: '12.1e',
    topic: 12,
    depth: 'be able to',
    group: '12.1',
    text: "identify gravity's operation in the Solar System: the solar wind's effects (on comets, planetary atmospheres and the heliosphere)",
  },
  {
    code: '12.2a',
    topic: 12,
    depth: 'be able to',
    group: '12.2',
    text: 'identify interactions in forming planets and moons: the Roche limit',
  },
  {
    code: '12.2b',
    topic: 12,
    depth: 'be able to',
    group: '12.2',
    text: 'identify interactions in forming planets and moons: round or irregular shape',
  },
  {
    code: '12.2c',
    topic: 12,
    depth: 'be able to',
    group: '12.2',
    text: 'identify interactions in forming planets and moons: holding an atmosphere',
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

  // --- Topic 13: Exploring starlight -------------------------------------------
  // Same convention as Topic 11's own multi-part points (11.18, 11.26-11.27):
  // a point with several lettered sub-parts in the real spec (13.14,
  // 13.34) is kept as ONE code with all its parts folded into one `text`.
  // The exceptions are 13.4, split into 13.4a/b/c (like 11.25), and 13.7,
  // split into 13.7a-e, so a page and its questions can be tagged to the
  // exact sub-part each one teaches — see SPEC_POINT_GROUPS below.
  { code: '13.1', topic: 13, depth: 'understand', text: 'the astronomical magnitude scale; apparent magnitude is how bright a star looks as viewed from Earth' },
  { code: '13.2', topic: 13, depth: 'understand', text: 'absolute magnitude' },
  { code: '13.3', topic: 13, depth: 'be able to', text: 'the distance modulus formula M = m + 5 - 5 log d (d in parsecs); determine M or m given the distance' },
  { code: '13.4a', topic: 13, depth: 'understand', group: '13.4', text: 'what can be learned from a stellar spectrum: chemical composition' },
  { code: '13.4b', topic: 13, depth: 'understand', group: '13.4', text: 'what can be learned from a stellar spectrum: temperature' },
  { code: '13.4c', topic: 13, depth: 'understand', group: '13.4', text: 'what can be learned from a stellar spectrum: radial velocity' },
  { code: '13.5', topic: 13, depth: 'understand', text: 'classify stars by spectral type' },
  { code: '13.6', topic: 13, depth: 'understand', text: "how a star's colour and spectral type relate to its surface temperature" },
  {
    code: '13.7a',
    topic: 13,
    depth: 'be able to',
    group: '13.7',
    text: 'sketch a simple Hertzsprung-Russell diagram with labelled axes, showing the position of main sequence stars',
  },
  {
    code: '13.7b',
    topic: 13,
    depth: 'be able to',
    group: '13.7',
    text: 'sketch a simple Hertzsprung-Russell diagram with labelled axes, showing the position of the Sun',
  },
  {
    code: '13.7c',
    topic: 13,
    depth: 'be able to',
    group: '13.7',
    text: 'sketch a simple Hertzsprung-Russell diagram with labelled axes, showing the position of red and blue giants',
  },
  {
    code: '13.7d',
    topic: 13,
    depth: 'be able to',
    group: '13.7',
    text: 'sketch a simple Hertzsprung-Russell diagram with labelled axes, showing the position of white dwarfs',
  },
  {
    code: '13.7e',
    topic: 13,
    depth: 'be able to',
    group: '13.7',
    text: 'sketch a simple Hertzsprung-Russell diagram with labelled axes, showing the position of supergiants',
  },
  { code: '13.8', topic: 13, depth: 'understand', text: "how a star's life cycle relates to its position on the HR diagram, for Sun-like stars and for much more massive ones" },
  { code: '13.9', topic: 13, depth: 'understand', text: 'the inverse-square relationship between distance and brightness/intensity' },
  { code: '13.10', topic: 13, depth: 'understand', text: '1 degree = 60 arcminutes, 1 arcminute = 60 arcseconds' },
  { code: '13.11', topic: 13, depth: 'understand', text: 'the parsec' },
  { code: '13.12', topic: 13, depth: 'be able to', text: 'determine distances using heliocentric parallax' },
  { code: '13.13', topic: 13, depth: 'understand', text: 'use an HR diagram to determine distances to stars' },
  {
    code: '13.14',
    topic: 13,
    depth: 'understand',
    text: 'light curves of variable stars: short/long period, eclipsing binary, Cepheid, and novae/supernovae',
  },
  { code: '13.15', topic: 13, depth: 'understand', text: "causes of variability in an eclipsing binary's light curve" },
  { code: '13.16', topic: 13, depth: 'understand', text: 'how Cepheid variables are used to determine distances' },
  { code: '13.17', topic: 13, depth: 'understand', text: 'the structure of gravitationally bound groupings such as binary stars and clusters' },
  { code: '13.18', topic: 13, depth: 'understand', text: "deduce the period of an eclipsing binary from its light curve" },
  { code: '13.19', topic: 13, depth: 'be able to', text: 'use star trail photographs to determine the length of the sidereal day' },
  {
    code: '13.20',
    topic: 13,
    depth: 'know',
    text: 'modern observations are recorded with digital sensors converting light to electrical signals, processed and stored as data files',
  },
  { code: '13.21', topic: 13, depth: 'understand', text: 'how astronomers obtain and study patterns of spectral lines in light from astronomical objects' },
  { code: '13.22', topic: 13, depth: 'know', text: 'the atmosphere blocks almost all radiation except visible light and radio waves' },
  { code: '13.23', topic: 13, depth: 'know', text: 'only optical and radio telescopes should be at sea level' },
  { code: '13.24', topic: 13, depth: 'understand', text: 'how a simple radio telescope operates' },
  { code: '13.25', topic: 13, depth: 'understand', text: 'why radio telescopes need extremely large apertures to maintain useful resolution' },
  { code: '13.26', topic: 13, depth: 'understand', text: 'how multiple radio telescopes work together as an aperture synthesis array' },
  {
    code: '13.27',
    topic: 13,
    depth: 'know',
    text: "radio astronomy's role in the discovery of quasars, jets from black holes, the Milky Way's structure and protoplanetary discs",
  },
  { code: '13.28', topic: 13, depth: 'understand', text: "why some infrared telescopes can operate at high altitude on Earth's surface" },
  {
    code: '13.29',
    topic: 13,
    depth: 'know',
    text: "infrared astronomy's role in the discovery of protostars, dust and molecular clouds, and hotspots on moons",
  },
  { code: '13.30', topic: 13, depth: 'understand', text: "the atmosphere's detrimental effect on image quality" },
  { code: '13.31', topic: 13, depth: 'understand', text: 'why telescopes outside the optical and radio windows must be above the atmosphere' },
  {
    code: '13.32',
    topic: 13,
    depth: 'understand',
    text: 'advantages and disadvantages of space telescopes and detectors, including orbital observing platforms',
  },
  {
    code: '13.33',
    topic: 13,
    depth: 'understand',
    text: "gamma ray, X-ray and ultraviolet astronomy's role in the discovery of gamma ray bursts, black hole accretion discs, and the corona/chromosphere structure of young stars",
  },
  {
    code: '13.34',
    topic: 13,
    depth: 'understand',
    text: 'how a telescope alters the appearance of stars, double stars, binary stars, open clusters, globular clusters, nebulae and galaxies',
  },

  // --- Topic 14: Stellar evolution ---------------------------------------
  { code: '14.1', topic: 14, depth: 'be able to', text: 'use the Messier and NGC (New General Catalogue) catalogues of nebulae, clusters and galaxies' },
  { code: '14.2', topic: 14, depth: 'be able to', text: 'use the Bayer system for naming the brightest stars in a constellation' },
  { code: '14.3', topic: 14, depth: 'understand', text: 'the balance between radiation pressure and gravity in a main sequence star' },
  { code: '14.4', topic: 14, depth: 'understand', text: "how that radiation-pressure/gravity balance changes through a Sun-like star's life cycle" },
  { code: '14.5', topic: 14, depth: 'understand', text: 'the balance between electron pressure and gravity in a white dwarf' },
  {
    code: '14.6',
    topic: 14,
    depth: 'understand',
    text: 'how the radiation-pressure/gravity balance changes through the life cycle of a star much more massive than the Sun',
  },
  { code: '14.7', topic: 14, depth: 'understand', text: 'the balance between neutron pressure and gravity in a neutron star' },
  { code: '14.8', topic: 14, depth: 'understand', text: "how the Chandrasekhar Limit affects the final stages of a star's life cycle" },
  {
    code: '14.9',
    topic: 14,
    depth: 'understand',
    text: "stages and timescales of a Sun-like star's life cycle: emission/absorption nebula, main sequence star, planetary nebula, red giant, white dwarf, black dwarf",
  },
  {
    code: '14.10',
    topic: 14,
    depth: 'understand',
    text: 'stages and timescales of a much more massive star\'s life cycle: emission/absorption nebula, main sequence star, red supergiant, supernova, neutron star, black hole',
  },
  { code: '14.11', topic: 14, depth: 'understand', text: 'how astronomers study and gather evidence for black holes' },

  // --- Topic 15: Our place in the Galaxy ----------------------------------
  { code: '15.1', topic: 15, depth: 'understand', text: "the Milky Way's appearance from Earth, through binoculars or a small telescope" },
  {
    code: '15.2',
    topic: 15,
    depth: 'know',
    text: "the size and shape of our Galaxy, and where the Sun, dust, sites of star formation and globular clusters sit within it",
  },
  { code: '15.3', topic: 15, depth: 'understand', text: "how 21 cm radio waves, not visible light, are used to map our Galaxy's structure and rotation" },
  { code: '15.4', topic: 15, depth: 'know', text: 'the Local Group is the group of galaxies gravitationally linked to the Milky Way' },
  {
    code: '15.5',
    topic: 15,
    depth: 'know',
    text: "the Local Group's composition and scale: the Andromeda Galaxy (M31), the Large and Small Magellanic Clouds (LMC and SMC), and the Triangulum Galaxy (M33)",
  },
  { code: '15.6', topic: 15, depth: 'be able to', text: 'classify galaxies by the Hubble classification: spiral, barred spiral, elliptical, irregular' },
  { code: '15.7', topic: 15, depth: 'know', text: "how Hubble placed the different galaxy types on his 'Tuning Fork' diagram" },
  { code: '15.8', topic: 15, depth: 'know', text: 'the Milky Way is a barred spiral (SBb) galaxy' },
  { code: '15.9', topic: 15, depth: 'know', text: 'some galaxies emit large quantities of radiation beyond visible light' },
  { code: '15.10', topic: 15, depth: 'know', text: 'an Active Galactic Nucleus (AGN) is powered by matter falling onto a supermassive black hole' },
  { code: '15.11', topic: 15, depth: 'know', text: 'types of active galaxy: Seyfert galaxies, quasars, blazars' },
  { code: '15.12', topic: 15, depth: 'know', text: 'information about AGNs comes from many regions of the electromagnetic spectrum' },
  { code: '15.13', topic: 15, depth: 'understand', text: 'why galaxies are grouped into larger clusters and superclusters' },
  { code: '15.14', topic: 15, depth: 'understand', text: 'main theories for the formation and evolution of galaxies' },

  // --- Topic 16: Cosmology -------------------------------------------------
  { code: '16.1', topic: 16, depth: 'know', text: 'galaxies outside the Local Group show redshift: light shifted to longer wavelengths' },
  { code: '16.2', topic: 16, depth: 'understand', text: 'redshift is caused by galaxies receding from us' },
  { code: '16.3', topic: 16, depth: 'be able to', text: "use (wavelength shift)/(emitted wavelength) = v/c to find a galaxy's recession velocity from its redshift" },
  { code: '16.4', topic: 16, depth: 'understand', text: 'the evidence that confirmed the discovery of the expanding universe' },
  { code: '16.5', topic: 16, depth: 'be able to', text: "use Hubble's law, v = H0 x d, to relate a galaxy's recession velocity to its distance" },
  { code: '16.6', topic: 16, depth: 'understand', text: 'estimating the age and size of the Universe from the Hubble constant' },
  { code: '16.7', topic: 16, depth: 'understand', text: 'how the expanding universe supports both the Big Bang theory and the Steady State theory' },
  {
    code: '16.8',
    topic: 16,
    depth: 'understand',
    text: 'the main observational evidence for the Big Bang: quasars (QSOs), cosmic microwave background (CMB) radiation, the Hubble Deep Field image',
  },
  {
    code: '16.9',
    topic: 16,
    depth: 'understand',
    text: "why fluctuations in the CMB radiation matter for theories of the Universe's evolution, including WMAP and Planck",
  },
  { code: '16.10', topic: 16, depth: 'understand', text: 'the significance and possible nature of dark matter and dark energy' },
  { code: '16.11', topic: 16, depth: 'understand', text: 'the difficulties in detecting dark matter and dark energy' },
  { code: '16.12', topic: 16, depth: 'understand', text: "current models predict different possible future evolutionary paths for the Universe" },
];

/**
 * Every topic's own title, 1-16 — exactly the section headers above
 * (this registry's own Topics 1-16), needed anywhere a page lists
 * every topic by name (e.g. notes/syllabus-map.html).
 */
const TOPIC_NAMES = {
  1: 'Planet Earth',
  2: 'The lunar disc',
  3: 'The Earth-Moon-Sun system',
  4: 'Time and the Earth-Moon-Sun cycles',
  5: 'Solar System observation',
  6: 'Celestial observation',
  7: 'Early models of the Solar System',
  8: 'Planetary motion and gravity',
  9: 'Exploring the Moon',
  10: 'Solar astronomy',
  11: 'Exploring the Solar System',
  12: 'Formation of planetary systems',
  13: 'Exploring starlight',
  14: 'Stellar evolution',
  15: 'Our place in the Galaxy',
  16: 'Cosmology',
};

/**
 * Which spec points are actually a group of lettered sub-codes, keyed
 * by the parent code a reader would recognise from the spec document
 * (e.g. "12.1"), listing its children in the order given there. A
 * curriculum subtopic tags one or more of the children directly (e.g.
 * `spec: ['12.1b']`), never the bare parent code — getSpecPoint below
 * only resolves real SPEC_POINTS entries, which no longer include '12.1'
 * or '12.2' themselves, so a curriculum entry that tried to tag the
 * parent would fail test/curriculum.test.js's registry check. A
 * coverage report walks this object's keys as one row each, rolling
 * each parent's children up via getGroupCoverageStatus below, rather
 * than listing every child as its own row alongside the ordinary,
 * unsplit points.
 */
const SPEC_POINT_GROUPS = {
  '1.6': ['1.6a', '1.6b', '1.6c'],
  '7.1': ['7.1a', '7.1b', '7.1c', '7.1d'],
  '11.25': ['11.25a', '11.25b', '11.25c', '11.25d'],
  '12.1': ['12.1a', '12.1b', '12.1c', '12.1d', '12.1e'],
  '12.2': ['12.2a', '12.2b', '12.2c'],
  '13.4': ['13.4a', '13.4b', '13.4c'],
  '13.7': ['13.7a', '13.7b', '13.7c', '13.7d', '13.7e'],
};

function getSpecPoint(code) {
  return SPEC_POINTS.find((point) => point.code === code);
}

/**
 * For a group's parent code, how much of it a given set of tagged spec
 * codes covers: 'covered' only when every child is tagged, 'not
 * covered' when none is, 'partly covered' otherwise. `taggedCodes` can
 * be any iterable of spec code strings (e.g. every code a curriculum
 * audit found tagged somewhere) — it doesn't need to be a Set already.
 */
function getGroupCoverageStatus(parentCode, taggedCodes) {
  const children = SPEC_POINT_GROUPS[parentCode];
  if (!children) return undefined;
  const tagged = taggedCodes instanceof Set ? taggedCodes : new Set(taggedCodes);
  const coveredCount = children.filter((code) => tagged.has(code)).length;
  if (coveredCount === 0) return 'not covered';
  if (coveredCount === children.length) return 'covered';
  return 'partly covered';
}

const SPEC_POINT_CODES = SPEC_POINTS.map((point) => point.code);

// Every topic this file's own registry actually has SPEC_POINTS entries
// for — all of 1-16, now that Topic 14-16 are registered too. Used
// anywhere that distinction matters without hardcoding the set a
// second time.
const REGISTERED_TOPICS = [...new Set(SPEC_POINTS.map((point) => point.topic))].sort((a, b) => a - b);

const specPointsApi = { SPEC_POINTS, SPEC_POINT_CODES, SPEC_POINT_GROUPS, TOPIC_NAMES, REGISTERED_TOPICS, getSpecPoint, getGroupCoverageStatus };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = specPointsApi;
} else if (typeof window !== 'undefined') {
  window.SpecPoints = specPointsApi;
}
