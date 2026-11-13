/**
 * Eclipsing binaries for notes/eclipsing-binaries.html: two stars on a
 * circular orbit, seen at a chosen tilt, and the light curve their
 * eclipses make.
 *
 * Each star is a uniform disc. A square metre of star surface gives out
 * light in proportion to its temperature to the fourth power, so a star's
 * light is (radius^2) x (temperature^4), in the same units for both stars.
 * When the stars overlap on the sky, the overlap area of the star BEHIND
 * is hidden: the same area hides far more light when the hidden star is
 * the hotter one, which is why the hotter star's eclipse is the deeper dip.
 *
 * Reused rather than rewritten:
 *   - BinariesClusters.binaryPositions (src/binariesClusters.js), the
 *     orbit about the centre of mass from notes/binaries-and-clusters.html,
 *     for drawing the stars;
 *   - VariableStars (src/variableStars.js): Algol's period and brightest
 *     magnitude, and timing several cycles with its reading uncertainty,
 *     from notes/variable-stars.html.
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const BinariesClusters = isNode ? require('./binariesClusters') : window.BinariesClusters;
  const VariableStars = isNode ? require('./variableStars') : window.VariableStars;

  const SUN_TEMPERATURE_K = 5800;

  /** Light per square metre, relative to the Sun's surface: (T / 5800 K)^4. */
  function surfaceBrightness(temperatureK) {
    return Math.pow(temperatureK / SUN_TEMPERATURE_K, 4);
  }

  /** Area where two circles (radii r1, r2, centres d apart) overlap. */
  function circleOverlapArea(r1, r2, d) {
    if (d >= r1 + r2) return 0;
    const small = Math.min(r1, r2);
    if (d <= Math.abs(r1 - r2)) return Math.PI * small * small;
    const a1 = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
    const a2 = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
    const k = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
    return a1 + a2 - k;
  }

  const rad = (deg) => (deg * Math.PI) / 180;

  /**
   * Positions on the sky (x across, y up) and along the line of sight (z,
   * positive = further from us) of each star, relative to the centre of
   * mass. Phase 0: star A directly behind star B. Inclination 90 = edge-on.
   */
  function skyPositions(sys, phase) {
    const pos = BinariesClusters.binaryPositions(sys.massRatio, sys.separation, phase * 360 - 90);
    const i = rad(sys.inclinationDeg);
    // binaryPositions works in the orbit plane; here its y is towards us.
    const project = (p) => ({ x: p.x, y: -p.y * Math.cos(i), z: -p.y * Math.sin(i) });
    return { A: project(pos.star1), B: project(pos.star2) };
  }

  /** Separation of the two stars' centres on the sky. */
  function projectedSeparation(sys, phase) {
    const t = 2 * Math.PI * phase;
    const i = rad(sys.inclinationDeg);
    return sys.separation * Math.sqrt(Math.sin(t) ** 2 + (Math.cos(i) * Math.cos(t)) ** 2);
  }

  function starLight(star) {
    return star.radius * star.radius * surfaceBrightness(star.temperatureK);
  }

  /** Total light at this phase, as a fraction of both stars fully in view. */
  function fluxAt(sys, phase) {
    const lightA = starLight(sys.A);
    const lightB = starLight(sys.B);
    const d = projectedSeparation(sys, phase);
    const hidden = circleOverlapArea(sys.A.radius, sys.B.radius, d) / Math.PI;
    // Phase 0 (cos > 0): A is behind; phase 0.5: B is behind.
    const behind = Math.cos(2 * Math.PI * phase) > 0 ? sys.A : sys.B;
    const lost = hidden * surfaceBrightness(behind.temperatureK);
    return (lightA + lightB - lost) / (lightA + lightB);
  }

  /** Apparent magnitude at time t (days), primary eclipse of A at t = 0. */
  function magnitudeAt(sys, t) {
    const phase = (((t - (sys.zeroDay || 0)) / sys.periodDays) % 1 + 1) % 1;
    return sys.brightestMag - 2.5 * Math.log10(fluxAt(sys, phase));
  }

  /** What kind of eclipse happens when the given star ('A' or 'B') is behind. */
  function eclipseType(sys, behindId) {
    const dMin = sys.separation * Math.abs(Math.cos(rad(sys.inclinationDeg)));
    const behind = sys[behindId];
    const front = sys[behindId === 'A' ? 'B' : 'A'];
    if (dMin >= behind.radius + front.radius) return 'none';
    if (dMin > Math.abs(behind.radius - front.radius)) return 'partial';
    // Fully overlapping: a flat-bottomed dip either way.
    return behind.radius <= front.radius ? 'total' : 'annular';
  }

  /** Depth (magnitudes) of each eclipse, and which star is hidden at the deeper dip. */
  function dips(sys) {
    // (+ 0 turns a "no dip" -0 into a plain 0.)
    const depthA = -2.5 * Math.log10(fluxAt(sys, 0)) + 0;
    const depthB = -2.5 * Math.log10(fluxAt(sys, 0.5)) + 0;
    const deeper = depthA >= depthB ? 'A' : 'B';
    return {
      whenAHidden: depthA,
      whenBHidden: depthB,
      primaryDepth: Math.max(depthA, depthB),
      secondaryDepth: Math.min(depthA, depthB),
      hiddenAtPrimary: deeper,
      hotter: sys.A.temperatureK >= sys.B.temperatureK ? 'A' : 'B',
      typeA: eclipseType(sys, 'A'),
      typeB: eclipseType(sys, 'B'),
    };
  }

  /** The smallest tilt (degrees from face-on) at which the stars eclipse at all. */
  function minimumInclinationDeg(sys) {
    const ratio = (sys.A.radius + sys.B.radius) / sys.separation;
    return ratio >= 1 ? 0 : (Math.acos(ratio) * 180) / Math.PI;
  }

  /** Times of the primary (deeper) dips, and of the secondary dips, between t0 and t1. */
  function dipTimes(sys, t0, t1) {
    const { hiddenAtPrimary } = dips(sys);
    const offset = (sys.zeroDay || 0) + (hiddenAtPrimary === 'A' ? 0 : 0.5 * sys.periodDays);
    const times = (start) => {
      const out = [];
      for (let k = Math.ceil((t0 - start) / sys.periodDays); start + k * sys.periodDays <= t1; k += 1) out.push(start + k * sys.periodDays);
      return out;
    };
    return { primary: times(offset), secondary: times(offset + 0.5 * sys.periodDays) };
  }

  /**
   * The period from timing whole cycles between two primary dips, with the
   * range the reading uncertainty allows (each end read to
   * VariableStars.TIME_READING_DAYS) and half that range as the uncertainty.
   */
  function periodFromDips(t1, t2, cycles) {
    const timing = VariableStars.periodFromTiming(t1, t2, cycles);
    const e = 2 * VariableStars.TIME_READING_DAYS;
    const low = (timing.span - e) / cycles;
    const high = (timing.span + e) / cycles;
    return { ...timing, low, high, uncertaintyDays: (high - low) / 2 };
  }

  const algol = VariableStars.galleryById('algol');

  // Algol: a hot blue-white star (A) eclipsed by a larger, cooler, dimmer
  // companion (B). Radii and the separation in units of the Sun's radius.
  const PRESETS = {
    algol: {
      id: 'algol',
      name: 'Algol',
      periodDays: algol.periodDays,
      brightestMag: algol.brightest,
      separation: 14,
      inclinationDeg: 81.4,
      massRatio: 4.6,
      A: { radius: 2.9, temperatureK: 12500 },
      B: { radius: 3.5, temperatureK: 4500 },
    },
    // A simulated pair whose shallow dip is easy to see.
    demo: {
      id: 'demo',
      name: 'A simulated eclipsing binary',
      periodDays: 3.6,
      brightestMag: 6.0,
      separation: 14,
      inclinationDeg: 88,
      massRatio: 1.5,
      A: { radius: 2.8, temperatureK: 10000 },
      B: { radius: 4.2, temperatureK: 7000 },
    },
  };

  function preset(id) {
    const p = PRESETS[id];
    return { ...p, A: { ...p.A }, B: { ...p.B } };
  }

  const api = {
    SUN_TEMPERATURE_K,
    surfaceBrightness,
    circleOverlapArea,
    skyPositions,
    projectedSeparation,
    starLight,
    fluxAt,
    magnitudeAt,
    eclipseType,
    dips,
    minimumInclinationDeg,
    dipTimes,
    periodFromDips,
    PRESETS,
    preset,
  };

  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.EclipsingBinaries = api;
  }
})();
