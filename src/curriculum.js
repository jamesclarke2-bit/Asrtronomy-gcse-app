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
 *
 * Where a subtopic has been checked against the real specification, it
 * also carries an optional `spec` array naming the matching spec point(s)
 * (e.g. `spec: ['8.4']`), so coverage can be mechanically audited against
 * the spec document later — an array because a spec point can need more
 * than one subtopic, or a subtopic can answer more than one spec point.
 * Most subtopics don't have it yet; retrofitting is ongoing. u3's Topic 7
 * ("Early models of the Solar System") and Topic 8 ("Planetary motion
 * and gravity") entries are the first fully-tagged example, matched
 * against the Edexcel GCSE Astronomy (1AS0) specification. 7.1-7.4 and
 * 8.1-8.5 are confirmed directly; 7.5-7.6 and 8.6-8.9 are a best-effort
 * placement (content is solid, exact decimal numbering less certain)
 * pending a check against the primary spec PDF.
 *
 * A subtopic can also carry `level: 'extension'`, for content that goes
 * beyond the GCSE spec entirely (A-level-reaching material, e.g.
 * sims/gravitational-potential.html's work/energy treatment of
 * gravitational potential). An extension subtopic never carries a
 * `spec` array — there's no spec point for it to answer — and is
 * excluded from spec-coverage accounting: Pages.computeUnitCoverage
 * (src/pages.js) leaves it out of both a unit's total subtopic count
 * and its covered count, so a page that only teaches extension content
 * can't make a unit look more (or differently) covered against the
 * actual GCSE spec than it really is. Everything without `level` is
 * ordinary GCSE-spec content, same as before this field existed.
 */

const UNITS = [
  {
    id: 'u1',
    title: 'Observations',
    subtopics: [
      {
        id: 'u1.1',
        title: 'Naked-eye phenomena',
        depth: 'know',
        notes:
          "the Sun, Moon, stars (including double stars, two stars that appear close together or genuinely orbit each other, distinct from a constellation or asterism's unrelated pattern), star clusters, galaxies and nebulae (as their own category — a galaxy is a separate star system, a nebula a cloud of gas and dust within our own), planets, comets, meteors, aurorae, supernovae, artificial satellites and aircraft, what each looks like and how to tell them apart (planets shine more steadily than twinkling stars; satellites move steadily in a straight line over minutes with no flashing lights, unlike an aircraft, which blinks and often shows colour; meteors streak across in under a second; comets drift slowly against the stars over nights); the Milky Way as a faint, diffuse band, best seen from a dark site",
      },
      {
        id: 'u1.2',
        title: 'Constellations and asterisms',
        depth: 'understand',
        notes:
          'a constellation is one of the 88 official regions of the sky; an asterism is any other recognisable pattern, often part of a constellation or spanning several; recognise Cassiopeia, Cygnus, Orion, the Plough, the Southern Cross, the Summer Triangle and the Square of Pegasus',
      },
      {
        id: 'u1.3',
        title: 'Pointer stars',
        depth: 'be able to',
        notes:
          "using the Plough's Pointers, Merak and Dubhe, to find Polaris (about five times their separation beyond Dubhe) and so due north",
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
        notes:
          'light pollution and skyglow (the orange background haze over urban areas, from sources like floodlighting, streetlamps and car park lighting), Dark Sky Parks, atmospheric seeing and transparency',
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
      {
        id: 'u1.18',
        title: 'Finding targets: star charts, planispheres and apps',
        depth: 'be able to',
        notes:
          'using a star chart, a rotating planisphere set to the date and time, or a sky-mapping app to locate and identify targets before or during an observing session',
      },
      {
        id: 'u1.19',
        title: 'Constellations across cultures',
        depth: 'understand',
        notes:
          "the 88 IAU constellations are one, largely Greco-Roman, tradition among many; other cultures group and name the same stars differently, e.g. Aboriginal Australian, Chinese and Polynesian astronomy",
      },
      {
        id: 'u1.20',
        title: 'Meteor showers and the radiant point',
        depth: 'understand',
        notes:
          "caused by Earth passing through debris left by a comet (or occasionally an asteroid); meteors appear to radiate from one point (the radiant) as a perspective effect, and showers are named after the constellation containing it, e.g. the Perseids, Geminids and Orionids",
      },
      {
        id: 'u1.21',
        title: 'Sidereal day vs solar day',
        depth: 'understand',
        notes:
          "the sidereal day (~23h 56m 04s) is how long Earth takes to rotate once relative to the fixed stars; the solar day (24h 00m, what a clock tracks) is how long it takes for the Sun to return to the same position, about 4 minutes longer — the same cause as the sidereal/synodic month gap, on a much shorter timescale: Earth's own orbital motion means it has to keep turning a little further each day to bring the Sun back to the meridian, so a star transits about 4 minutes earlier every day than it did the day before",
      },
    ],
  },
  {
    id: 'u2',
    title: 'Earth, Moon & Sun system',
    subtopics: [
      {
        id: 'u2.1',
        title: 'Earth structure',
        depth: 'know',
        notes:
          'an oblate spheroid (nearly spherical, slightly flattened at the poles), diameter ~12,742 km; internally layered into core (inner/outer, iron-nickel, drives the magnetic field), mantle (thickest layer, semi-solid rock that slowly flows) and crust (thin, cool, brittle outer shell); positions on the surface given by latitude (0-90° N or S of the equator, along parallels) and longitude (0-180° E or W of the Prime Meridian, along meridians); named reference lines and points: the equator, the Tropics of Cancer and Capricorn (~23.5° N/S, equal to the axial tilt), the Arctic and Antarctic Circles (~66.5° N/S), the Prime Meridian through Greenwich, and the North and South Poles',
      },
      {
        id: 'u2.2',
        title: 'Moon structure',
        depth: 'know',
        notes:
          "a near-sphere, mean diameter ~3,500 km (3,475 km more precisely); surface features and their origins: craters (meteoroid impacts, of all sizes and ages), maria (dark, smooth lava that flooded low-lying impact basins), terrae/highlands (light, rugged, older and more heavily cratered), mountain ranges such as the Apennines (uplifted rims of large impact basins, not volcanoes), and rilles (narrow channels in the maria, thought to be collapsed lava tubes or lava channels); the far side looks more heavily cratered mainly because it has almost no maria to have buried older craters",
      },
      {
        id: 'u2.3',
        title: 'Phases of the Moon',
        depth: 'understand',
        notes:
          "caused by the Moon's changing position relative to the Sun as seen from Earth (and so how much of its permanently half-lit surface faces us), not by Earth's shadow — that's a lunar eclipse, a separate and much rarer event",
      },
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
        notes:
          "cooler, magnetically active regions; tracking a sunspot's position over successive days to estimate the Sun's (differential) rotation period, distinct from the ~11-year solar cycle of rising and falling sunspot number — a common exam confusion; the butterfly diagram, showing sunspot latitude drifting from around 35° toward the equator over each cycle",
      },
      {
        id: 'u2.6',
        title: 'Historical sizes and distances',
        depth: 'understand',
        notes:
          "Eratosthenes' measurement of the Earth: the Sun's noon shadow angle at two places due north-south of each other, at the same moment, differs by the angle between them at Earth's centre (the Sun's rays being parallel), so angle / 360° = distance / circumference, e.g. 7.2° and ~800 km give ~40,000 km; Aristarchus' methods for the Moon and Sun: the width of Earth's shadow on the Moon during a lunar eclipse (~2.6 Moon diameters, plus ~1 for the shadow narrowing) gives the Moon's size relative to Earth's (~0.27), and the angle between the Moon and Sun at first quarter, when the Sun-Moon-Earth angle is 90°, gives their relative distances (he measured 87°, giving ~19×; the true ~89.85° gives ~390×)",
      },
      {
        id: 'u2.7',
        title: 'Tides',
        depth: 'understand',
        notes:
          "the Moon's gravity pulls the near side of Earth more strongly than its centre, and its centre more than the far side, raising two tidal bulges, one facing the Moon and one opposite; Earth's rotation carries each place through both, giving two high and two low tides most days, about 12 h 25 min apart and ~50 min later each day; the Sun raises smaller bulges (its tidal effect is ~0.46 of the Moon's, despite a ~180× stronger overall pull, because tides depend on the difference in pull across Earth); spring tides at new and full Moon, when the Sun and Moon are in line, give the largest tidal range; neap tides at first and last quarter, when they are at right angles, give the smallest",
      },
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
        notes:
          "Apparent Solar Time (AST, what a sundial reads) vs Mean Solar Time (MST, what a clock reads); the Equation of Time (AST - MST), caused by orbital eccentricity and axial tilt; Local Mean Time (LMT), mean solar time at a particular longitude, 4 minutes later for every degree west (LMT = GMT + longitude / 15 h), as each town kept before standard time; time zones, roughly 15° wide and usually whole hours from GMT, adopted once railways made local times unworkable; GMT/UT, mean solar time at Greenwich (longitude 0°), the reference for every zone; the annual variation in sunrise and sunset times, set by the Sun's changing declination, with the equation of time moving the earliest sunset and latest sunrise away from the winter solstice",
      },
      {
        id: 'u2.11',
        title: "The Sun's structure",
        depth: 'know',
        notes:
          'core, radiative zone and convective zone (energy transport outward from the core); photosphere, chromosphere and corona (the visible surface and outer atmosphere)',
      },
      {
        id: 'u2.12',
        title: 'Solar wind',
        depth: 'understand',
        notes:
          'a continuous stream of charged particles (electrons, protons and alpha particles) escaping the corona at roughly 300-800 km/s; influences planetary magnetospheres, causes aurorae, shapes cometary ion tails, and can drive geomagnetic storms that disrupt satellites, aircraft and power grids',
      },
      {
        id: 'u2.13',
        title: 'Van Allen belts',
        depth: 'know',
        notes:
          "two doughnut-shaped regions of charged particles trapped by Earth's magnetic field: an inner belt (mostly protons) and an outer belt (mostly electrons); shield the surface from radiation but pose a risk to satellites and astronauts",
      },
      {
        id: 'u2.14',
        title: 'The Maunder Minimum',
        depth: 'know',
        notes:
          'a 1645-1715 dip in the solar cycle (under 50 sunspots recorded in 1672-99, against a normal 40,000-50,000); coincided with the Little Ice Age; confirmed independently via C-14 and Be-10 isotope data',
      },
      {
        id: 'u2.15',
        title: "Earth's atmosphere",
        depth: 'know',
        notes:
          'composition by volume: nitrogen 78%, oxygen 21%, argon 1%, carbon dioxide 0.04%, variable water vapour (~1%), trace neon/helium/methane; thins out to a boundary with space at roughly 10,000 km; layered into troposphere (weather, aircraft), stratosphere (ozone layer, UV absorption), mesosphere (meteors burn up) and thermosphere (aurorae, ISS orbit)',
      },
      {
        id: 'u2.16',
        title: 'Atmospheric transmission window',
        depth: 'understand',
        notes:
          "which wavelengths reach the ground (mainly radio and optical, and some IR) versus get absorbed high up (UV, X-ray and gamma by the ozone layer and upper atmosphere; most IR by greenhouse gases); the reason ground-based astronomy is largely limited to optical/radio/near-IR, and why X-ray, gamma-ray and much of the IR/UV spectrum need a space telescope",
      },
      {
        id: 'u2.17',
        title: 'Sidereal vs synodic month',
        depth: 'understand',
        notes:
          'the sidereal month (~27.3 days) is how long the Moon takes to return to the same direction against the fixed stars; the synodic month (~29.53 days) is how long it takes to return to the same phase. The ~2.2-day gap exists because Earth also moves along its own orbit during that time, so the Moon needs a bit longer to catch back up to the same Sun-Earth-Moon alignment',
      },
      {
        id: 'u2.18',
        title: 'Apogee, perigee and supermoons',
        depth: 'understand',
        notes:
          "the Moon's orbit is slightly elliptical (eccentricity ~0.055, mean distance ~384,400 km): closest at perigee (~363,300 km), farthest at apogee (~405,500 km), and moving fastest near perigee; a supermoon is a full (or new) Moon within a few days of perigee — a perigee full Moon can look up to ~14% larger and ~30% brighter than an apogee one",
      },
      {
        id: 'u2.19',
        title: "Eclipse conditions: the Moon's tilted orbit",
        depth: 'understand',
        notes:
          "the Moon's orbit is tilted ~5.1° to the ecliptic, crossing it at two nodes; an eclipse is only possible when a new Moon (solar) or full Moon (lunar) falls within the ecliptic limit of a node — about 18.4° for at least a partial solar eclipse, 12.2° for a lunar one — so eclipses come in 'eclipse seasons' rather than every month",
      },
      {
        id: 'u2.20',
        title: 'Named lunar surface features',
        depth: 'be able to',
        notes:
          'identify on sight: the Sea of Tranquility, Ocean of Storms and Sea of Crises (maria), the craters Tycho, Copernicus and Kepler, and the Apennine mountain range',
      },
      {
        id: 'u2.21',
        title: 'Synchronous rotation',
        depth: 'understand',
        notes:
          "the Moon's rotation period equals its orbital period (~27.3 days, the sidereal month), so the same face always points towards Earth",
      },
      {
        id: 'u2.22',
        title: 'Libration',
        depth: 'understand',
        notes:
          "small apparent rocking of the Moon that lets us see about 59% of its surface over time: in longitude (its orbital speed varies around its elliptical orbit while its rotation stays steady), in latitude (its axis is tilted relative to its orbital plane), and diurnal (parallax from the observer's position on Earth's surface)",
      },
      {
        id: 'u2.23',
        title: "The Moon's internal structure",
        depth: 'know',
        notes:
          "crust, mantle and core, like Earth; mean crust ~34-43 km (GRAIL; Wieczorek et al. 2013), proportionally much thicker than Earth's; a small core under 25% of the Moon's radius, offset ~2 km towards the near side",
      },
      {
        id: 'u2.24',
        title: 'Near side and far side',
        depth: 'understand',
        notes:
          "the near side has large dark maria; the far side is almost devoid of them because its thicker crust (up to ~60 km in the far-side highlands, per GRAIL) kept lava from reaching the surface",
      },
      {
        id: 'u2.25',
        title: 'Exploring the far side',
        depth: 'know',
        notes:
          'first photographed by Luna 3 in 1959, then mapped in more detail from orbit by the Lunar Orbiter program, Apollo orbital photography and modern missions such as LRO',
      },
      {
        id: 'u2.26',
        title: 'Escape velocity and rockets',
        depth: 'understand',
        notes:
          "reaching the Moon means reaching (nearly) Earth's escape velocity, ~11.2 km/s; only rockets can supply the sustained thrust to do this in a vacuum, because they carry their own oxidiser and push by throwing exhaust backwards rather than pushing on air",
      },
      {
        id: 'u2.27',
        title: 'Origin of the Moon',
        depth: 'understand',
        notes:
          "the Giant Impact Hypothesis (a Mars-sized body, Theia, struck the early Earth a glancing blow; the debris formed the Moon), supported by near-identical oxygen isotope ratios, the lack of water and volatiles in lunar samples, and KREEP-rich rocks in the Ocean of Storms and Sea of Showers; alternatives: Capture Theory and Co-accretion Theory",
      },
      {
        id: 'u2.28',
        title: 'Sizes and distances in the Earth-Moon-Sun system',
        depth: 'know',
        notes:
          "the Sun's mean diameter is ~1.39 million km (Earth 12,742 km, Moon 3,475 km); the Moon is ~384,400 km away and the Sun ~149.6 million km (1 AU); the Sun is ~109× Earth's diameter and Earth ~3.7× the Moon's; the Sun is ~400× the Moon's diameter and ~400× as far away, so both appear ~0.5° across, the coincidence that makes total solar eclipses possible",
      },
      {
        id: 'u2.29',
        title: 'Precession',
        depth: 'understand',
        notes:
          "the Sun's and Moon's pull on Earth's equatorial bulge makes the direction of its axis slowly trace a circle, taking ~26,000 years, while the tilt stays ~23.4°; the celestial pole circles the ecliptic pole, so the pole star changes: Thuban ~2800 BCE, Polaris now (closest in AD 2100), Vega ~AD 14,000",
      },
    ],
  },
  {
    id: 'u3',
    title: 'Solar systems',
    subtopics: [
      {
        id: 'u3.1',
        title: 'Early geocentric models',
        depth: 'understand',
        spec: ['7.3'],
        notes:
          "early models placed Earth at the centre of the universe, with the Moon, Sun and planets moving around it against the 'fixed' stars; Ptolemy's geocentric model, accepted for over a thousand years, used a deferent (a planet's main circular path around Earth) and an equant (an off-centre point about which the planet appeared to move at a uniform rate)",
      },
      {
        id: 'u3.2',
        title: 'Epicycles',
        depth: 'understand',
        spec: ['7.4'],
        notes:
          "Ptolemy added epicycles — small circular loops riding on the main deferent — to account for planets' observed retrograde motion and changing brightness, which a simple single-circle geocentric model couldn't explain",
      },
      {
        id: 'u3.3',
        title: 'Using scale information about the Solar System',
        depth: 'be able to',
        spec: ['7.5', '11.8'],
        notes:
          "use given data — e.g. a table of the planets' mean distances from the Sun in AU, as on the exam data sheet (src/specData.js) — to compare relative distances and sizes across the Solar System, or build a scale diagram/model from it; convert a distance between km, AU, light years and parsecs using the data sheet's own conversion figures: 1 AU = 1.5 × 10⁸ km; 1 light year = 9.5 × 10¹² km; 1 parsec = 3.1 × 10¹³ km = 3.26 light years; the 'be able to use' skill that sits alongside 7.6's unit definitions (u3.4)",
      },
      {
        id: 'u3.4',
        title: 'The scale of the Solar System',
        depth: 'be able to',
        spec: ['7.6', '11.9'],
        notes:
          "use the astronomical unit (1 AU ≈ 1.5 × 10⁸ km, the Earth-Sun distance), the light year and the parsec as the specialist units used for distances within the Solar System and to other stars; calculate how long light takes to cross a given distance, time = distance / speed of light, using the data sheet's speed of light (3.0 × 10⁸ m/s) — e.g. sunlight takes about 8 minutes to reach Earth, and over 4 hours to reach Neptune",
      },
      {
        id: 'u3.5',
        title: 'Archaeoastronomy',
        depth: 'understand',
        spec: ['7.1', '7.2'],
        notes:
          "ancient civilisations used detailed observations of solar and lunar cycles for (a) agriculture — timing planting and harvest to the seasons; (b) religion — festivals and rituals tied to solstices, equinoxes and lunar phases; (c) time and calendar systems — the day, the (lunar) month and the year itself; and (d) aligning monuments to risings and settings, e.g. Stonehenge's solstice-sunrise alignment and the Great Pyramid of Giza's star-aligned shafts. Axial precession (u2.29) — Earth's axis slowly tracing a ~26,000-year circle — means those original alignments have since drifted: Thuban, not Polaris, was the pole star the ancient Egyptians aligned shafts to",
      },
      {
        id: 'u3.6',
        title: "Brahe's observations",
        depth: 'understand',
        spec: ['8.1'],
        notes:
          "Tycho Brahe's precise naked-eye observations, made before the telescope existed, provided the accurate positional data the geocentric-to-heliocentric transition needed",
      },
      {
        id: 'u3.7',
        title: "Copernicus and Kepler's mathematical modelling",
        depth: 'understand',
        spec: ['8.2'],
        notes:
          "Copernicus's 1543 heliocentric model placed the Sun, not Earth, at the centre, still using circular orbits; Kepler's later work fitted Brahe's precise data to elliptical orbits instead, completing the mathematical case for the heliocentric model",
      },
      {
        id: 'u3.15',
        title: "Galileo's telescopic evidence",
        depth: 'understand',
        spec: ['11.24'],
        notes:
          "two early-17th-century telescopic observations that supported the heliocentric model: (1) four moons visibly orbiting Jupiter, not Earth, showing not everything in the universe orbits Earth; (2) Venus showing a full set of phases, from thin crescent through to nearly full — in a strict Earth-centred model with Venus always between Earth and the Sun, only crescent phases are ever possible, so the full range Galileo saw meant Venus must orbit the Sun",
      },
      {
        id: 'u3.8',
        title: 'Gravity and stable elliptical orbits',
        depth: 'understand',
        spec: ['8.3'],
        notes:
          'gravity, pulling a planet continuously towards the Sun, is what keeps it in a closed elliptical orbit rather than flying off in a straight line or falling in',
      },
      {
        id: 'u3.9',
        title: "Kepler's laws of planetary motion",
        depth: 'understand',
        spec: ['8.4'],
        notes:
          '1) every orbit is an ellipse with the Sun at one focus; 2) a line from the Sun to an orbiting body sweeps out equal areas in equal times, so it moves fastest near the Sun and slowest when farthest away; 3) the square of the orbital period is proportional to the cube of the orbit’s mean radius, T² ∝ r³',
      },
      {
        id: 'u3.10',
        title: 'Perihelion, aphelion, apogee and perigee',
        depth: 'understand',
        spec: ['8.5'],
        notes:
          'for a solar orbit, perihelion is the closest point to the Sun and aphelion the farthest; for an Earth orbit, the equivalent terms are perigee (closest) and apogee (farthest)',
      },
      {
        id: 'u3.11',
        title: "Using Kepler's third law",
        depth: 'be able to',
        spec: ['8.6'],
        notes:
          "use T²/r³ = constant to calculate an orbital period from a mean orbital radius, or vice versa, given one body's own values as a reference (e.g. Earth: 1 year, 1 AU)",
      },
      {
        id: 'u3.12',
        title: "Kepler's third law and the mass of the central body",
        depth: 'understand',
        spec: ['8.7'],
        notes:
          "the constant in T²/r³ = constant (u3.11) is only the same ≈1 for every body here because they all orbit the Sun: in general the constant is 4π²/(GM), so it depends inversely on the central mass M — a planet at the same radius around a more massive star would have a shorter period and a smaller T²/r³ constant, and around a less massive star a longer period and a larger constant",
      },
      {
        id: 'u3.13',
        title: "Newton's explanation of Kepler's laws",
        depth: 'know',
        spec: ['8.8'],
        notes:
          "Newton showed that Kepler's three empirically-discovered laws all follow mathematically from one underlying cause: gravity obeying an inverse-square law",
      },
      {
        id: 'u3.14',
        title: "Newton's law of gravitation",
        depth: 'understand',
        spec: ['8.9'],
        notes:
          'the gravitational force between two bodies is proportional to the product of their masses and inversely proportional to the square of the distance between their centres — doubling the separation cuts the force to a quarter, tripling a mass triples the force',
      },
      {
        id: 'u3.16',
        title: 'Planets and dwarf planets: comparing key data',
        depth: 'be able to',
        spec: ['11.1', '11.6'],
        notes:
          'use given data — the exam data sheet’s own table (src/specData.js) — to compare the planets and dwarf planets by relative size, relative mass, temperature, moons and rings',
      },
      {
        id: 'u3.17',
        title: 'Small Solar System objects',
        depth: 'know',
        spec: ['11.1'],
        notes:
          'besides the planets and dwarf planets, the Solar System holds asteroids (small rocky bodies, mostly orbiting in the asteroid belt between Mars and Jupiter), meteoroids (much smaller fragments of rock or dust) and comets (small bodies of ice, dust and rock that develop a glowing coma and tail(s) as they near the Sun)',
      },
      {
        id: 'u3.18',
        title: 'Comet structure',
        depth: 'know',
        spec: ['11.2'],
        notes:
          'the nucleus (a solid core of ice, dust and rock, often called a ‘dirty snowball’), the coma (a glowing cloud of gas and dust released as the nucleus is heated near the Sun) and the tail(s) (gas and dust pushed away from the coma by the solar wind and radiation pressure); a comet can show two separate tails — a straighter, bluish ion tail and a curved, whitish dust tail — and both always point away from the Sun, not behind the comet’s direction of travel',
      },
      {
        id: 'u3.19',
        title: 'Short-period and long-period comets',
        depth: 'understand',
        spec: ['11.3', '11.4'],
        notes:
          'short-period comets (orbital period under ~200 years, e.g. Halley’s and Encke’s Comets) are thought to originate in the Kuiper Belt, in roughly the same plane as the planets; long-period comets (orbital periods of thousands to millions of years, on highly elongated orbits that can arrive from any direction) are thought to originate much farther out, in the roughly spherical Oort Cloud',
      },
      {
        id: 'u3.20',
        title: 'The Kuiper Belt, Oort Cloud and heliosphere',
        depth: 'know',
        spec: ['11.5'],
        notes:
          'the Kuiper Belt (a disc of icy bodies from roughly 30 to 50 AU, beyond Neptune, in the same plane as the planets); the heliosphere (the vast bubble the solar wind inflates around the Sun, with its outer edge, the heliopause, at roughly 120 AU — Voyager 1 crossed it in 2012); and the Oort Cloud (a far larger, roughly spherical shell of icy bodies thought to extend from a few thousand AU out to perhaps 100,000 AU, around a third of the way to the nearest star)',
      },
      {
        id: 'u3.21',
        title: 'Formation of gas giants',
        depth: 'know',
        spec: ['11.7'],
        notes:
          'brief overview only — covered in depth on the Topic 12 formation-of-planetary-systems page (not yet built): the leading model, core accretion, has a solid core of ice and rock grow large enough, far enough from the young Sun for ices to survive, to gravitationally capture a massive envelope of hydrogen and helium gas directly from the surrounding protoplanetary disc',
      },
      {
        id: 'u3.22',
        title: 'Meteoroids and meteorites',
        depth: 'know',
        spec: ['11.10'],
        notes:
          'a meteoroid is a small fragment of rock or metal in space, usually a piece broken off an asteroid or shed by a comet; one that survives the fall through the atmosphere and reaches the ground is a meteorite; meteorites are classified by structure/composition as stony (the most common, rocky, similar to asteroid material), iron (dense, metallic, from the cores of shattered differentiated asteroids) or stony-iron (a mix of both) — distinct from a meteor, the visible streak of light while still burning up in the atmosphere (u1.20)',
      },
      {
        id: 'u3.23',
        title: 'The ecliptic plane and Solar System debris',
        depth: 'understand',
        spec: ['11.11'],
        notes:
          'the ecliptic is the plane of Earth’s own orbit (u1.16); most Solar System material — the planets, the asteroid belt and the Kuiper Belt — formed from, and still roughly orbits within, that same flattened plane, which is why asteroids and short-period comets are usually found close to it, while long-period comets from the roughly spherical Oort Cloud can arrive from any angle',
      },
      {
        id: 'u3.24',
        title: 'Transits of Venus and measuring the AU',
        depth: 'understand',
        spec: ['11.12'],
        notes:
          'Edmond Halley proposed timing a transit of Venus — Venus passing directly across the Sun’s disc, as seen from Earth — from widely separated latitudes: parallax means observers at different latitudes see Venus cross along very slightly different paths (and so at slightly different times), and combining that small measured difference with the known geometry let 18th- and 19th-century astronomers triangulate the real Sun-Earth distance (the AU) for the first time',
      },
      {
        id: 'u3.25',
        title: "The origin of Earth's water",
        depth: 'know',
        spec: ['11.13'],
        notes:
          'brief overview only — covered in depth on the Topic 12 formation-of-planetary-systems page (not yet built): competing theories include delivery by water-rich asteroids and/or comets colliding with the early Earth, and outgassing of water vapour from volcanic activity as Earth itself cooled; current evidence (e.g. asteroid-like hydrogen isotope ratios in Earth’s oceans) favours asteroids as the larger contributor, with comets and outgassing both still thought to have played a part',
      },
      {
        id: 'u3.26',
        title: 'Gravitational potential energy as work',
        depth: 'understand',
        level: 'extension',
        notes:
          'beyond the GCSE spec — gravitational potential energy (per unit mass, gravitational potential V) defined as the work an external agent does bringing a mass in from infinity at constant speed, which is exactly the negative of the work gravity itself does over the same move (so V is negative everywhere, zero only at infinity); V(r) = -GM/r, the "potential well" a mass must climb out of to escape; near a surface, the familiar ΔU = mgh is only the small-height approximation to the exact ΔU = GMm(1/R - 1/(R+h))',
      },
      {
        id: 'u3.27',
        title: 'Orbital energy and escaping',
        depth: 'understand',
        level: 'extension',
        notes:
          'beyond the GCSE spec — a satellite’s kinetic, potential and total specific energy at any orbital radius; raising a circular orbit trades kinetic energy for potential energy (KE falls, PE and the total both rise — the total staying negative, less so the higher the orbit) rather than simply adding energy to both; escaping is the limit where total energy reaches exactly zero, the same condition escape speed (u2.26) is derived from',
      },
      {
        id: 'u3.28',
        title: 'Gravitational field maps and the zero-field point',
        depth: 'understand',
        level: 'extension',
        notes:
          'beyond the GCSE spec — field arrows/lines and equipotential contours for two (or more) masses, superposed; the zero-field point between two bodies, where the two pulls cancel and a test mass feels no net gravitational force at that instant — not the same point as a Lagrange point (u3.29), since it ignores the frame rotating with the two bodies entirely',
      },
      {
        id: 'u3.29',
        title: 'Lagrange points and the effective potential',
        depth: 'understand',
        level: 'extension',
        notes:
          'beyond the GCSE spec — in a frame rotating with two orbiting bodies, the effective potential (ordinary potential minus the centrifugal term) has five equilibrium points: L1-L3 collinear with the bodies (saddle points) and L4/L5 forming equilateral triangles with them (local maxima, "hills"); L1-L3 are always unstable, while L4/L5 are only stable when the larger/smaller mass ratio exceeds about 25 (Routh\'s criterion) — true for the Earth-Moon system (ratio ≈ 81) and overwhelmingly true for the Sun-Earth system (ratio ≈ 333,000), which is why dust and small bodies really do collect near real L4/L5 points; a body held near a stable L4/L5 is kept there by the Coriolis force, not by sitting in a dip of the effective potential, which is a hill at that point, not a valley',
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
      {
        id: 'u5.1',
        title: 'Telescopes',
        depth: 'know',
        // Best-effort placement, like 7.5-7.6 and 8.6-8.9 above: the
        // content is solid, but the exact spec numbering within
        // 11.19-11.25 is inferred from sequence (11.24 is already
        // confirmed elsewhere as Galileo's telescopic evidence, u3.15,
        // which this page only links to rather than re-teaching), not
        // checked against the primary spec PDF.
        spec: ['11.19', '11.20', '11.21', '11.22', '11.23', '11.25'],
        notes:
          "refracting designs (Galilean: a diverging eyepiece lens, giving an upright image but a narrow field of view — what Galileo himself used; Keplerian: a converging eyepiece lens, giving a wider field of view but an inverted image — the layout almost all modern refractors use) and reflecting designs (Newtonian: a parabolic primary mirror reflects light back up to a flat secondary mirror, out to an eyepiece on the side of the tube; Cassegrain: a parabolic primary mirror reflects light up to a convex secondary, back down through a hole in the primary to an eyepiece behind it); reflectors' advantages over refractors: no chromatic aberration (mirrors reflect every wavelength the same way, with nothing to focus differently by colour), mirrors can be made far larger than lenses (supported across their whole back, not just gripped at the rim), a long focal length folds into a short tube (most dramatically in the Cassegrain), and multiple mirrors can be combined",
      },
      {
        id: 'u5.2',
        title: 'Magnification and resolution',
        depth: 'be able to',
        spec: ['11.14', '11.15', '11.16', '11.17', '11.18'],
        notes:
          "magnification = f(objective) / f(eyepiece); light grasp (how much light a telescope collects) is proportional to the square of the objective diameter, so doubling the aperture gives 4x the light grasp; angular resolution improves with a larger objective diameter and is worse at longer wavelengths (the Rayleigh criterion, 1.22 x wavelength / diameter, gives the actual angle); the human eye's own limits — a small aperture (a fully dark-adapted pupil is only about 7mm) and poor low-light sensitivity — are the baseline every telescope improves on, e.g. a 100mm telescope collects roughly 200x the light of a dark-adapted eye",
      },
      {
        id: 'u5.3',
        title: 'Space probes',
        depth: 'know',
        notes: 'flyby, orbiter, lander and rover missions',
      },
      {
        id: 'u5.4',
        title: 'Solar observation methods',
        depth: 'know',
        notes:
          'telescope projection (safe; reveals sunspots and rotation); H-alpha filters (front-mounted only, isolating the 656.28nm line to reveal prominences, filaments, plage and spicules); X-ray imaging (must be done from space, since the atmosphere absorbs X-rays; bright patches are active regions linked to flares)',
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
