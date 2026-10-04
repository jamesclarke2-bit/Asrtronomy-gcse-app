/**
 * Orbital mechanics: Kepler's three laws and Newton's law of gravitation,
 * as general-purpose, reusable calculations — not tied to the Moon, Mars
 * or any one page's sim. Deliberately standalone: no dependency on any
 * other src/ module, so any future page (or this one) can load just this.
 *
 * Covers GCSE Astronomy's u3.9-u3.14 (Kepler's laws, perihelion/aphelion/
 * apogee/perigee, orbital speed, Newton's explanation and law of
 * gravitation — see src/curriculum.js), plus the general, any-central-mass
 * form of Kepler's third law and a full elliptical-position solver for
 * any eccentricity, which GCSE itself doesn't require but a diagram
 * reasonably might.
 *
 * Units: the AU/year Kepler's-third-law helpers work in those units
 * directly, since T² = r³ exactly there for anything orbiting one
 * solar mass. Everything else (the general central-mass form, orbital
 * speed, positions) is plain SI — metres, seconds, kilograms, radians —
 * so a caller already in AU/years/degrees converts at the boundary
 * rather than this module silently guessing which unit it was given.
 *
 * The Kepler's-equation solver (eccentricAnomaly) is the one general
 * version of the Newton's-method solver that used to live only inside
 * src/moonOrbitPanel.js, hardcoded to the Moon's own eccentricity.
 * moonOrbitPanel.js now calls this module for that step instead of
 * solving it a second time — see its own comment.
 */
(function () {
  // CODATA 2018 value, to the precision GCSE-level calculations need.
  const G = 6.6743e-11; // m^3 kg^-1 s^-2
  const AU_KM = 1.495978707e8;
  const AU_M = AU_KM * 1000;
  const YEAR_DAYS = 365.25;
  const YEAR_SECONDS = YEAR_DAYS * 86400;
  const SOLAR_MASS_KG = 1.98847e30;
  const EARTH_MASS_KG = 5.9722e24;

  // --- Kepler's third law --------------------------------------------------
  //
  // In AU and years, for anything orbiting a single solar mass, Kepler's
  // third law reduces to the clean T² = r³ (no G or mass needed): that's
  // exactly what makes AU/years the natural units for Solar System work.

  function periodYearsFromSemiMajorAxisAU(semiMajorAxisAU) {
    return Math.sqrt(Math.pow(semiMajorAxisAU, 3));
  }

  function semiMajorAxisAUFromPeriodYears(periodYears) {
    return Math.pow(periodYears, 2 / 3);
  }

  // A function "returning the constant": T²/r³ is the same number for
  // every body orbiting the same central mass, so computing it from any
  // one body's own (period, radius) pair gives that shared constant —
  // ≈ 1 for anything orbiting the Sun when T is in years and r in AU
  // (see test/orbitalMechanics.test.js, checked against every planet and
  // dwarf planet in PLANETARY_DATA below).
  function tSquaredOverRCubed(period, meanRadius) {
    return Math.pow(period, 2) / Math.pow(meanRadius, 3);
  }

  // The general form, for any central mass, in SI units: T = 2π√(a³/GM).
  function periodFromSemiMajorAxis(semiMajorAxisM, centralMassKg) {
    return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisM, 3) / (G * centralMassKg));
  }

  function semiMajorAxisFromPeriod(periodS, centralMassKg) {
    return Math.cbrt((G * centralMassKg * Math.pow(periodS, 2)) / (4 * Math.PI * Math.PI));
  }

  // --- Elliptical orbit position: Kepler's equation -------------------------
  //
  // Kepler's equation, M = E - e sin E, has no closed-form solution for E
  // (the eccentric anomaly) given M (the mean anomaly — the angle that
  // *does* advance uniformly with time) and e (eccentricity), so it's
  // solved numerically, by Newton's method. Works for any 0 <= e < 1 (e=0
  // is a circle and converges on the first step; near-parabolic orbits
  // close to e=1 converge slowly, hence starting E from π rather than M
  // there, and the generous 100-iteration cap).

  function normalizeRad(angleRad) {
    const twoPi = 2 * Math.PI;
    return ((angleRad % twoPi) + twoPi) % twoPi;
  }

  function eccentricAnomaly(meanAnomalyRad, eccentricity) {
    const M = normalizeRad(meanAnomalyRad);
    let E = eccentricity < 0.8 ? M : Math.PI;
    for (let i = 0; i < 100; i += 1) {
      const delta = (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
      E -= delta;
      if (Math.abs(delta) < 1e-12) break;
    }
    return E;
  }

  // The true anomaly: the orbiting body's actual angle from periapsis,
  // which — unlike the mean anomaly — moves faster near periapsis and
  // slower near apoapsis (Kepler's second law in angle form).
  function trueAnomaly(meanAnomalyRad, eccentricity) {
    const E = eccentricAnomaly(meanAnomalyRad, eccentricity);
    return normalizeRad(
      2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
      )
    );
  }

  // The polar equation of an ellipse, measured from its focus.
  function radiusAtTrueAnomaly(trueAnomalyRad, semiMajorAxis, eccentricity) {
    return (semiMajorAxis * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(trueAnomalyRad));
  }

  // Full position solver: given how far round its orbit a body is (mean
  // anomaly, which is proportional to elapsed time), returns where it
  // actually is. Coordinates are in the orbital plane, focus at the
  // origin, periapsis along the +x axis.
  function positionAtMeanAnomaly(meanAnomalyRad, semiMajorAxis, eccentricity) {
    const nu = trueAnomaly(meanAnomalyRad, eccentricity);
    const r = radiusAtTrueAnomaly(nu, semiMajorAxis, eccentricity);
    return { x: r * Math.cos(nu), y: r * Math.sin(nu), r, trueAnomalyRad: nu };
  }

  // --- Perihelion and aphelion ----------------------------------------------

  function perihelionDistance(semiMajorAxis, eccentricity) {
    return semiMajorAxis * (1 - eccentricity);
  }

  function aphelionDistance(semiMajorAxis, eccentricity) {
    return semiMajorAxis * (1 + eccentricity);
  }

  // --- Orbital speed: the vis-viva equation ---------------------------------
  //
  // v = √(GM(2/r - 1/a)). At perihelion/aphelion this alone gives the
  // classic result v(peri)/v(apo) = (1+e)/(1-e), with the central mass
  // (and G) cancelling out of the ratio entirely.

  function orbitalSpeed(distance, semiMajorAxis, centralMassKg) {
    return Math.sqrt(G * centralMassKg * (2 / distance - 1 / semiMajorAxis));
  }

  // --- Newton's law of gravitation: the inverse-square force ratio ---------
  //
  // F = Gm₁m₂/r², so scaling either mass by a factor or the separation
  // by a factor scales the force by massFactor1 * massFactor2 /
  // separationFactor² — this returns that factor directly, without
  // needing the real masses, separation or G at all.

  function gravitationalForceRatio(changes) {
    const massFactor1 = (changes && changes.massFactor1) || 1;
    const massFactor2 = (changes && changes.massFactor2) || 1;
    const separationFactor = (changes && changes.separationFactor) || 1;
    return (massFactor1 * massFactor2) / (separationFactor * separationFactor);
  }

  // --- Reference data: every IAU-recognised planet and dwarf planet --------
  //
  // Real (period, semi-major axis) pairs, for exercising
  // tSquaredOverRCubed against real Solar System data rather than only
  // self-consistent made-up numbers. To 3-4 significant figures — plenty
  // for the ~7% tolerance real orbital eccentricity and rounding allow.
  //
  // This is the engine's own precise tier, for internal maths (the
  // Third Law graph's plotted points, etc.) where that extra precision
  // matters. It intentionally does NOT match src/specData.js's rounded
  // exam-data-sheet figures body-for-body — specData.js is the tier
  // student-facing text and question stems quote instead, and
  // test/specData.test.js checks the two agree within normal rounding so
  // they can't silently drift apart. One body here, Makemake, has no
  // entry in the exam sheet at all; leave it out of anything
  // student-facing, and never use it as a "does this match the data
  // sheet" test case.

  const PLANETARY_DATA = [
    { name: 'Mercury', kind: 'planet', semiMajorAxisAU: 0.387, periodYears: 0.241 },
    { name: 'Venus', kind: 'planet', semiMajorAxisAU: 0.723, periodYears: 0.615 },
    { name: 'Earth', kind: 'planet', semiMajorAxisAU: 1.0, periodYears: 1.0 },
    { name: 'Mars', kind: 'planet', semiMajorAxisAU: 1.524, periodYears: 1.881 },
    { name: 'Jupiter', kind: 'planet', semiMajorAxisAU: 5.203, periodYears: 11.86 },
    { name: 'Saturn', kind: 'planet', semiMajorAxisAU: 9.537, periodYears: 29.46 },
    { name: 'Uranus', kind: 'planet', semiMajorAxisAU: 19.19, periodYears: 84.01 },
    { name: 'Neptune', kind: 'planet', semiMajorAxisAU: 30.07, periodYears: 164.8 },
    { name: 'Ceres', kind: 'dwarf planet', semiMajorAxisAU: 2.767, periodYears: 4.6 },
    { name: 'Pluto', kind: 'dwarf planet', semiMajorAxisAU: 39.48, periodYears: 248.0 },
    { name: 'Haumea', kind: 'dwarf planet', semiMajorAxisAU: 43.13, periodYears: 283.3 },
    { name: 'Makemake', kind: 'dwarf planet', semiMajorAxisAU: 45.79, periodYears: 309.9 },
    { name: 'Eris', kind: 'dwarf planet', semiMajorAxisAU: 67.78, periodYears: 558.0 },
  ];

  const api = {
    G,
    AU_KM,
    AU_M,
    YEAR_DAYS,
    YEAR_SECONDS,
    SOLAR_MASS_KG,
    EARTH_MASS_KG,
    PLANETARY_DATA,
    periodYearsFromSemiMajorAxisAU,
    semiMajorAxisAUFromPeriodYears,
    tSquaredOverRCubed,
    periodFromSemiMajorAxis,
    semiMajorAxisFromPeriod,
    eccentricAnomaly,
    trueAnomaly,
    radiusAtTrueAnomaly,
    positionAtMeanAnomaly,
    perihelionDistance,
    aphelionDistance,
    orbitalSpeed,
    gravitationalForceRatio,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.OrbitalMechanics = api;
  }
})();
