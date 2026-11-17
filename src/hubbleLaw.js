/**
 * Hubble's law, v = H0 × d, and the age and size estimates that follow
 * from it, for notes/hubble-law.html (spec 16.4-16.6).
 *
 * H0 (68 km/s per Mpc), c (3.0 × 10⁸ m/s) and the parsec (3.1 × 10¹³ km)
 * are the data sheet's own figures, read from src/specData.js.
 *
 * GALAXIES is made-up practice data, not real measurements: distances in
 * Mpc and recession velocities in km/s, scattered round the data sheet's
 * H0. Every velocity carries the same error bar, ±VELOCITY_ERROR_KM_S,
 * standing for galaxies' own motions through space on top of the
 * expansion; because that error is the same size near and far, a wider
 * range of distances pins the gradient down to a smaller percentage
 * uncertainty, which is the point the page makes with it.
 */
(function () {
  const SpecData = typeof require !== 'undefined' ? require('./specData') : window.SpecData;

  const H0 = SpecData.CONSTANTS.hubbleConstantKmPerSPerMpc;
  const C_KM_PER_S = SpecData.CONSTANTS.speedOfLightMPerS / 1000;
  const PARSEC_KM = SpecData.CONSTANTS.parsecKm;
  const MPC_KM = PARSEC_KM * 1e6;
  const SECONDS_PER_YEAR = 365 * 24 * 3600;

  const VELOCITY_ERROR_KM_S = 800;

  // [distance (Mpc), offset from H0 × d (km/s)]: fixed, so every visitor
  // sees the same graph.
  const RAW = [
    [6, 350], [11, -420], [16, 260], [21, -150], [27, 480], [33, -380], [38, 210],
    [55, -460], [80, 390], [105, -300], [130, 440], [155, -250], [180, 300],
  ];
  const GALAXIES = RAW.map(([d, off], i) => ({
    id: `G${i + 1}`,
    distanceMpc: d,
    velocityKmS: H0 * d + off,
    errorKmS: VELOCITY_ERROR_KM_S,
  }));

  const NEAR_LIMIT_MPC = 40;
  const DATA_SETS = {
    near: {
      label: 'Nearby galaxies only (up to 40 Mpc)',
      galaxies: GALAXIES.filter((g) => g.distanceMpc <= NEAR_LIMIT_MPC),
      axis: { maxDistanceMpc: 40, maxVelocityKmS: 4000, distanceStep: 10, velocityStep: 1000 },
    },
    wide: {
      label: 'Nearby and distant galaxies (up to 180 Mpc)',
      galaxies: GALAXIES,
      axis: { maxDistanceMpc: 200, maxVelocityKmS: 14000, distanceStep: 50, velocityStep: 2000 },
    },
  };

  function velocity(distanceMpc, h0 = H0) {
    return h0 * distanceMpc;
  }

  function distance(velocityKmS, h0 = H0) {
    return velocityKmS / h0;
  }

  /** Least-squares gradient of a line through the origin. */
  function bestGradient(galaxies) {
    const num = galaxies.reduce((s, g) => s + g.velocityKmS * g.distanceMpc, 0);
    const den = galaxies.reduce((s, g) => s + g.distanceMpc * g.distanceMpc, 0);
    return num / den;
  }

  /**
   * The steepest and shallowest lines through the origin that still pass
   * through every error bar.
   */
  function gradientRange(galaxies) {
    const steepest = Math.min(...galaxies.map((g) => (g.velocityKmS + g.errorKmS) / g.distanceMpc));
    const shallowest = Math.max(...galaxies.map((g) => (g.velocityKmS - g.errorKmS) / g.distanceMpc));
    return { steepest, shallowest };
  }

  /** Does the line v = gradient × d pass through every error bar? */
  function passesAllBars(galaxies, gradient) {
    return galaxies.every((g) => Math.abs(gradient * g.distanceMpc - g.velocityKmS) <= g.errorKmS + 1e-9);
  }

  /** Uncertainty as half the range, and as a percentage of the best value. */
  function uncertainty(steepest, shallowest, best = (steepest + shallowest) / 2) {
    const half = (steepest - shallowest) / 2;
    return { value: best, half, percent: (100 * half) / best };
  }

  /** Age ≈ 1 ÷ H0, with each step of the unit conversion. */
  function ageSteps(h0 = H0) {
    const perSecond = h0 / MPC_KM;
    const seconds = 1 / perSecond;
    const years = seconds / SECONDS_PER_YEAR;
    return { h0, mpcKm: MPC_KM, perSecond, seconds, secondsPerYear: SECONDS_PER_YEAR, years, billionYears: years / 1e9 };
  }

  /** Size ≈ c × age: in km and in light years (numerically the age in years). */
  function sizeEstimate(h0 = H0) {
    const { seconds, years } = ageSteps(h0);
    return { km: C_KM_PER_S * seconds, lightYears: years, billionLightYears: years / 1e9 };
  }

  const api = {
    H0,
    C_KM_PER_S,
    PARSEC_KM,
    MPC_KM,
    SECONDS_PER_YEAR,
    VELOCITY_ERROR_KM_S,
    GALAXIES,
    DATA_SETS,
    velocity,
    distance,
    bestGradient,
    gradientRange,
    passesAllBars,
    uncertainty,
    ageSteps,
    sizeEstimate,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.HubbleLaw = api;
  }
})();
