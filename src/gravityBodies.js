/**
 * Models for notes/gravity-forming-bodies.html (spec 12.1a, 12.1c, 12.2a,
 * 12.2b, 12.2c): gravity's regular motion, multi-body effects (Lagrange
 * points, a resonance), and three things gravity decides for a forming
 * planet or moon (the Roche limit, round or lumpy, keeping an atmosphere).
 *
 * Planet periods come from the exam data sheet (src/specData.js). The
 * Galilean moons' periods come from src/galileanMoons.js. Every other
 * figure here is general knowledge, labelled first draft on the page.
 */
(function () {
  const SpecData = typeof require !== 'undefined' ? require('./specData') : window.SpecData;
  const GalileanMoons = typeof require !== 'undefined' ? require('./galileanMoons') : window.GalileanMoons;

  // --- 12.1a Regular motion ------------------------------------------------
  const INNER_PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars'].map((name) => {
    const p = SpecData.PLANETARY_DATA.find((x) => x.name === name);
    return { name, distanceAU: p.distanceAU, periodYears: p.periodYears };
  });
  const MOON_PHASE_CYCLE_DAYS = 29.5;

  // --- 12.1c Lagrange points (Sun-Earth) and a resonance -------------------
  // L1 and L2 sit about 1.5 million km from the Earth, towards and away
  // from the Sun; L3 is on the far side of the Sun; L4 and L5 are 60
  // degrees ahead of and behind the Earth on its orbit.
  const L1_L2_FROM_EARTH_KM = 1.5e6;
  const LAGRANGE_POINTS = [
    { id: 'L1', where: 'between the Sun and the Earth' },
    { id: 'L2', where: 'just beyond the Earth, away from the Sun' },
    { id: 'L3', where: "on the far side of the Sun, on the Earth's orbit" },
    { id: 'L4', where: "60° ahead of the Earth on its orbit" },
    { id: 'L5', where: "60° behind the Earth on its orbit" },
  ];
  // Angle round the Sun (degrees, the Earth at 0) and distance in units of
  // the Earth's orbit, for a schematic drawing. L1/L2 are pushed well away
  // from the Earth so they can be seen; the real gap is about 1% of an AU.
  const LAGRANGE_DRAWING = {
    L1: { angleDeg: 0, r: 0.8 },
    L2: { angleDeg: 0, r: 1.2 },
    L3: { angleDeg: 180, r: 1.0 },
    L4: { angleDeg: 60, r: 1.0 },
    L5: { angleDeg: -60, r: 1.0 },
  };

  const RESONANCE_MOONS = ['Io', 'Europa', 'Ganymede'].map((name) => GalileanMoons.MOONS.find((m) => m.name === name));
  const RESONANCE_RATIO = [1, 2, 4];
  // Starting angles (degrees) that obey the real pattern: Io and Ganymede
  // together, Europa opposite. The three are never all on one side at once.
  const RESONANCE_START_DEG = [0, 180, 0];

  /**
   * Each moon's angle (degrees, 0-360) after `ioOrbits` orbits of Io,
   * drawn in an exact 1 : 2 : 4 ratio of periods.
   */
  function resonanceAngles(ioOrbits) {
    return RESONANCE_RATIO.map((k, i) => (((RESONANCE_START_DEG[i] + (360 * ioOrbits) / k) % 360) + 360) % 360);
  }

  /** Whole orbits completed by each moon after `ioOrbits` orbits of Io. */
  function resonanceOrbits(ioOrbits) {
    return RESONANCE_RATIO.map((k) => ioOrbits / k);
  }

  // --- 12.2a Roche limit ---------------------------------------------------
  // For a moon about as dense as its planet: about 2.5 planet radii
  // (the fluid-moon figure, 2.44, rounded).
  const ROCHE_PLANET_RADII = 2.5;
  const ROCHE_MIN = 1.2;
  const ROCHE_MAX = 5;

  function rocheState(distancePlanetRadii) {
    const inside = distancePlanetRadii < ROCHE_PLANET_RADII;
    // How stretched the moon is drawn: 1 far away, growing as it nears the limit.
    const stretch = inside ? null : 1 + 0.9 * (ROCHE_PLANET_RADII / distancePlanetRadii) ** 3;
    return { inside, stretch };
  }

  // --- 12.2b Round or lumpy ------------------------------------------------
  const ROUND_FROM_KM = 400; // icy bodies can be round from about here
  const ROUND_BY_KM = 600; // rocky bodies round from about here
  const SHAPE_MIN_KM = 10;
  const SHAPE_MAX_KM = 1500;
  const SHAPE_EXAMPLES = [
    { name: 'Phobos', diameterKm: 22 },
    { name: 'Vesta', diameterKm: 525 },
    { name: 'Ceres', diameterKm: 940 },
  ];

  /** 0 = fully lumpy, 1 = round; rises from 200 km to ROUND_BY_KM. */
  function roundness(diameterKm) {
    return Math.min(1, Math.max(0, (diameterKm - 200) / (ROUND_BY_KM - 200)));
  }

  function shapeVerdict(diameterKm) {
    if (diameterKm < ROUND_FROM_KM) return 'lumpy';
    if (diameterKm < ROUND_BY_KM) return 'in between';
    return 'round';
  }

  // --- 12.2c Holding an atmosphere -----------------------------------------
  const GAS_CONSTANT = 8.314; // J per mol per K
  const KEEP_FACTOR = 6; // kept for billions of years if escape speed > 6 × gas speed
  const BODIES = [
    // temperatureK: where gas escapes from. For a body with an atmosphere
    // that is its upper atmosphere, far hotter than the ground for Jupiter
    // and the Earth; the Moon has almost none, so it is its sunlit surface.
    { key: 'jupiter', name: 'Jupiter', escapeKms: 59.5, temperatureK: 1000, where: 'upper atmosphere' },
    { key: 'earth', name: 'Earth', escapeKms: 11.2, temperatureK: 1000, where: 'upper atmosphere' },
    { key: 'mars', name: 'Mars', escapeKms: 5.0, temperatureK: 250, where: 'upper atmosphere' },
    { key: 'titan', name: 'Titan', escapeKms: 2.6, temperatureK: 150, where: 'upper atmosphere' },
    { key: 'moon', name: 'the Moon', escapeKms: 2.4, temperatureK: 390, where: 'sunlit surface' },
  ];
  const GASES = [
    { key: 'hydrogen', name: 'Hydrogen', formula: 'H₂', molarMassG: 2 },
    { key: 'helium', name: 'Helium', formula: 'He', molarMassG: 4 },
    { key: 'nitrogen', name: 'Nitrogen', formula: 'N₂', molarMassG: 28 },
    { key: 'carbon-dioxide', name: 'Carbon dioxide', formula: 'CO₂', molarMassG: 44 },
  ];

  /** Typical speed (km/s) of a gas particle: faster when hotter and lighter. */
  function gasSpeedKms(temperatureK, molarMassG) {
    return Math.sqrt((3 * GAS_CONSTANT * temperatureK) / (molarMassG / 1000)) / 1000;
  }

  function atmosphere(bodyKey, gasKey) {
    const body = BODIES.find((b) => b.key === bodyKey);
    const gas = GASES.find((g) => g.key === gasKey);
    const speed = gasSpeedKms(body.temperatureK, gas.molarMassG);
    return { body, gas, speed, needed: KEEP_FACTOR * speed, kept: body.escapeKms > KEEP_FACTOR * speed };
  }

  // --- Identifying the effect ----------------------------------------------
  const EFFECTS = [
    { key: 'regular', name: 'Regular, predictable motion' },
    { key: 'lagrange', name: 'A Lagrange point' },
    { key: 'resonance', name: 'A resonance' },
    { key: 'roche', name: 'The Roche limit' },
    { key: 'shape', name: 'Gravity pulling a body round' },
    { key: 'atmosphere', name: 'Gravity holding an atmosphere' },
  ];

  const api = {
    INNER_PLANETS,
    MOON_PHASE_CYCLE_DAYS,
    L1_L2_FROM_EARTH_KM,
    LAGRANGE_POINTS,
    LAGRANGE_DRAWING,
    RESONANCE_MOONS,
    RESONANCE_RATIO,
    resonanceAngles,
    resonanceOrbits,
    ROCHE_PLANET_RADII,
    ROCHE_MIN,
    ROCHE_MAX,
    rocheState,
    ROUND_FROM_KM,
    ROUND_BY_KM,
    SHAPE_MIN_KM,
    SHAPE_MAX_KM,
    SHAPE_EXAMPLES,
    roundness,
    shapeVerdict,
    KEEP_FACTOR,
    BODIES,
    GASES,
    gasSpeedKms,
    atmosphere,
    EFFECTS,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.GravityBodies = api;
  }
})();
