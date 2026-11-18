/**
 * Models for notes/exoplanets-life.html (spec 12.4, 12.6, 12.7, 12.8).
 *
 * Detection: a transit light curve (the fraction of a star's disc a
 * planet covers, exactly, for a planet crossing the middle of the disc),
 * a star's wobble on the sky (astrometry) and its speed towards and away
 * from us (radial velocity), for three example planets round a Sun-like
 * star. Habitable zone: from a main-sequence star's luminosity (src/
 * hrDiagram.js, the same main sequence as the HR diagram page), zone
 * edges at 0.95 and 1.67 times √L astronomical units. Drake equation: the
 * product of seven factors, each chosen from a range of guesses.
 *
 * Planet sizes, masses, star speeds, zone edges and Drake factor ranges
 * are general knowledge, labelled first draft on the page.
 */
(function () {
  const HrDiagram = typeof require !== 'undefined' ? require('./hrDiagram') : window.HrDiagram;

  // --- 12.4 Detection ------------------------------------------------------
  // radius: planet radius / Sun's radius; mass: Earth masses; starSpeedMs:
  // the Sun-like star's speed round the shared centre (m/s), for the planet
  // at its own distance.
  const PLANETS = [
    { key: 'earth', name: 'Earth-sized', radius: 0.0092, mass: 1, starSpeedMs: 0.09 },
    { key: 'neptune', name: 'Neptune-sized', radius: 0.035, mass: 17, starSpeedMs: 0.3 },
    { key: 'jupiter', name: 'Jupiter-sized', radius: 0.1, mass: 318, starSpeedMs: 12.5 },
  ];

  /** Area where two circles overlap: radii 1 and k, centres d apart. */
  function overlapArea(d, k) {
    if (d >= 1 + k) return 0;
    if (d <= 1 - k) return Math.PI * k * k;
    const clamp = (v) => Math.min(1, Math.max(-1, v));
    const a = Math.acos(clamp((d * d + 1 - k * k) / (2 * d)));
    const b = Math.acos(clamp((d * d + k * k - 1) / (2 * d * k)));
    return a + k * k * b - 0.5 * Math.sqrt(Math.max(0, (-d + 1 + k) * (d + 1 - k) * (d - 1 + k) * (d + 1 + k)));
  }

  // Time 0-1 across the transit window: the planet moves from 1.4 star
  // radii on one side to 1.4 on the other.
  const TRANSIT_SPAN = 1.4;
  function transitX(t) {
    return -TRANSIT_SPAN + 2 * TRANSIT_SPAN * t;
  }

  /** Star's brightness (1 = full) at time t (0-1) as the planet crosses. */
  function transitBrightness(t, radiusRatio) {
    return 1 - Math.max(0, overlapArea(Math.abs(transitX(t)), radiusRatio)) / Math.PI;
  }

  /** The deepest dip, as a percentage of the star's light. */
  function transitDepthPercent(radiusRatio) {
    return 100 * radiusRatio * radiusRatio;
  }

  /**
   * Over one orbit (t from 0 to 1): the star's speed along our line of
   * sight (positive = away from us), and its position on the sky
   * (side-to-side and up-down, as a fraction of its wobble).
   */
  function starMotion(t, planetKey) {
    const p = PLANETS.find((x) => x.key === planetKey);
    const ang = 2 * Math.PI * t;
    return {
      awayMs: p.starSpeedMs * Math.sin(ang),
      sky: { x: Math.cos(ang), y: Math.sin(ang) },
    };
  }

  function lineShiftWord(awayMs) {
    if (Math.abs(awayMs) < 1e-9) return 'none';
    return awayMs > 0 ? 'red' : 'blue';
  }

  const METHODS = [
    { key: 'transit', name: 'Transit', measures: "the planet's size", bestAt: 'big planets close to their star, with orbits we see edge-on' },
    { key: 'astrometry', name: 'Astrometry', measures: "the planet's mass", bestAt: 'massive planets far from their star, round nearby stars' },
    { key: 'radial-velocity', name: 'Radial velocity', measures: "the planet's mass (at least)", bestAt: 'massive planets close to their star' },
  ];

  // --- 12.6 Habitable zone -------------------------------------------------
  const ZONE_INNER = 0.95;
  const ZONE_OUTER = 1.67;
  const STAR_T_MIN = 3000;
  const STAR_T_MAX = 10000;
  const SUN_T = 5800;
  const PLANET_DISTANCES_AU = [0.015, 0.1, 0.4, 1, 3, 7, 20];

  function starLuminosity(temperatureK) {
    return HrDiagram.luminosityFromMagnitude(HrDiagram.mainSequenceMagnitude(temperatureK));
  }

  function habitableZone(temperatureK) {
    const s = Math.sqrt(starLuminosity(temperatureK));
    return { innerAU: ZONE_INNER * s, outerAU: ZONE_OUTER * s };
  }

  function zoneVerdict(distanceAU, temperatureK) {
    const z = habitableZone(temperatureK);
    if (distanceAU < z.innerAU) return 'too hot';
    if (distanceAU > z.outerAU) return 'too cold';
    return 'in the zone';
  }

  // --- 12.7 Drake equation -------------------------------------------------
  const DRAKE_FACTORS = [
    { key: 'R', symbol: 'R*', meaning: 'new stars formed in our Galaxy each year', choices: [1, 2, 3, 5, 10] },
    { key: 'fp', symbol: 'fp', meaning: 'fraction of those stars with planets', choices: [0.1, 0.2, 0.5, 1] },
    { key: 'ne', symbol: 'ne', meaning: 'planets per system that could support life', choices: [0.1, 0.2, 0.5, 1, 2] },
    { key: 'fl', symbol: 'fl', meaning: 'fraction of those where life actually starts', choices: [0.001, 0.01, 0.1, 0.5, 1] },
    { key: 'fi', symbol: 'fi', meaning: 'fraction of those where intelligent life develops', choices: [0.001, 0.01, 0.1, 0.5, 1] },
    { key: 'fc', symbol: 'fc', meaning: 'fraction of those that send signals we could detect', choices: [0.01, 0.1, 0.2, 0.5, 1] },
    { key: 'L', symbol: 'L', meaning: 'years such a civilisation keeps sending signals', choices: [100, 1000, 10000, 100000, 1000000, 10000000] },
  ];
  // Indexes into each factor's choices.
  const DRAKE_PRESETS = {
    low: { R: 0, fp: 1, ne: 0, fl: 0, fi: 0, fc: 0, L: 0 },
    middle: { R: 1, fp: 2, ne: 3, fl: 2, fi: 2, fc: 1, L: 2 },
    high: { R: 4, fp: 3, ne: 4, fl: 4, fi: 4, fc: 4, L: 5 },
  };

  function drakeValues(indexes) {
    return Object.fromEntries(DRAKE_FACTORS.map((f) => [f.key, f.choices[indexes[f.key]]]));
  }

  /** The running product after each factor, ending with N. */
  function drakeSteps(values) {
    let n = 1;
    return DRAKE_FACTORS.map((f) => {
      n *= values[f.key];
      return { key: f.key, value: values[f.key], running: n };
    });
  }

  function drakeN(values) {
    return drakeSteps(values).slice(-1)[0].running;
  }

  // --- 12.8 SETI ----------------------------------------------------------
  /** Years from sending a message to getting a reply, at the speed of light. */
  function replyYears(distanceLightYears) {
    return 2 * distanceLightYears;
  }

  const api = {
    PLANETS,
    overlapArea,
    TRANSIT_SPAN,
    transitX,
    transitBrightness,
    transitDepthPercent,
    starMotion,
    lineShiftWord,
    METHODS,
    ZONE_INNER,
    ZONE_OUTER,
    STAR_T_MIN,
    STAR_T_MAX,
    SUN_T,
    PLANET_DISTANCES_AU,
    starLuminosity,
    habitableZone,
    zoneVerdict,
    DRAKE_FACTORS,
    DRAKE_PRESETS,
    drakeValues,
    drakeSteps,
    drakeN,
    replyYears,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.Exoplanets = api;
  }
})();
