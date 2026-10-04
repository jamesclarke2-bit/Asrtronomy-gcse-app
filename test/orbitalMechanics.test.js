const test = require('node:test');
const assert = require('node:assert/strict');
const OM = require('../src/orbitalMechanics');

test('tSquaredOverRCubed is within 7% of 1.0 for every planet and dwarf planet', () => {
  OM.PLANETARY_DATA.forEach((body) => {
    const k = OM.tSquaredOverRCubed(body.periodYears, body.semiMajorAxisAU);
    assert.ok(Math.abs(k - 1) <= 0.07, `${body.name} (${body.kind}): T²/r³ = ${k.toFixed(4)}`);
  });
});

test('PLANETARY_DATA includes all 8 planets and all 5 IAU dwarf planets', () => {
  const names = OM.PLANETARY_DATA.map((b) => b.name);
  ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].forEach((n) =>
    assert.ok(names.includes(n), `missing planet ${n}`)
  );
  ['Ceres', 'Pluto', 'Haumea', 'Makemake', 'Eris'].forEach((n) =>
    assert.ok(names.includes(n), `missing dwarf planet ${n}`)
  );
  assert.equal(OM.PLANETARY_DATA.filter((b) => b.kind === 'planet').length, 8);
  assert.equal(OM.PLANETARY_DATA.filter((b) => b.kind === 'dwarf planet').length, 5);
});

test("Kepler's third law round-trips: radius -> period -> radius, for Earth", () => {
  const period = OM.periodYearsFromSemiMajorAxisAU(1);
  assert.ok(Math.abs(period - 1) < 1e-9);
  assert.ok(Math.abs(OM.semiMajorAxisAUFromPeriodYears(period) - 1) < 1e-9);
});

test("Halley's Comet: a ~76-year period gives a semi-major axis of about 17.9 AU", () => {
  const a = OM.semiMajorAxisAUFromPeriodYears(76);
  assert.ok(Math.abs(a - 17.9) < 0.1, `got ${a.toFixed(2)} AU`);
});

test('the general central-mass form of Kepler\'s third law agrees with the AU/year form, for the Sun and Earth', () => {
  const periodS = OM.periodFromSemiMajorAxis(OM.AU_M, OM.SOLAR_MASS_KG);
  assert.ok(Math.abs(periodS / OM.YEAR_SECONDS - 1) < 0.01, `${(periodS / OM.YEAR_SECONDS).toFixed(4)} years`);
  const semiMajorAxisM = OM.semiMajorAxisFromPeriod(OM.YEAR_SECONDS, OM.SOLAR_MASS_KG);
  assert.ok(Math.abs(semiMajorAxisM / OM.AU_M - 1) < 0.01);
});

test('perihelion and aphelion distances from semi-major axis and eccentricity', () => {
  // Earth: a = 1 AU, e = 0.0167.
  const a = 1;
  const e = 0.0167;
  assert.ok(Math.abs(OM.perihelionDistance(a, e) - 0.9833) < 1e-6);
  assert.ok(Math.abs(OM.aphelionDistance(a, e) - 1.0167) < 1e-6);
});

test('eccentricAnomaly and trueAnomaly: a circular orbit (e=0) has true = mean = eccentric anomaly', () => {
  [0, Math.PI / 4, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((M) => {
    assert.ok(Math.abs(OM.eccentricAnomaly(M, 0) - M) < 1e-9);
    assert.ok(Math.abs(OM.trueAnomaly(M, 0) - M) < 1e-9);
  });
});

test('trueAnomaly matches meanAnomaly exactly at periapsis (0) and apoapsis (π), for any eccentricity', () => {
  [0.1, 0.3, 0.5, 0.7, 0.9].forEach((e) => {
    assert.ok(Math.abs(OM.trueAnomaly(0, e)) < 1e-9, `e=${e}`);
    assert.ok(Math.abs(OM.trueAnomaly(Math.PI, e) - Math.PI) < 1e-9, `e=${e}`);
  });
});

test('trueAnomaly runs ahead of meanAnomaly just after periapsis, for an eccentric orbit', () => {
  // A body moves fastest just after periapsis (Kepler's 2nd law), so its
  // true angle outpaces the uniformly-advancing mean angle there.
  const e = 0.5;
  [Math.PI / 6, Math.PI / 3, (2 * Math.PI) / 3].forEach((M) => {
    assert.ok(OM.trueAnomaly(M, e) > M, `M=${M}`);
  });
});

test('radiusAtTrueAnomaly: perihelion at true anomaly 0, aphelion at π', () => {
  const a = 10;
  const e = 0.4;
  assert.ok(Math.abs(OM.radiusAtTrueAnomaly(0, a, e) - OM.perihelionDistance(a, e)) < 1e-9);
  assert.ok(Math.abs(OM.radiusAtTrueAnomaly(Math.PI, a, e) - OM.aphelionDistance(a, e)) < 1e-9);
});

test("Earth's perihelion-to-aphelion speed ratio is (1+e)/(1-e), about 1.034", () => {
  const e = 0.0167;
  const a = OM.AU_M;
  const vPeri = OM.orbitalSpeed(OM.perihelionDistance(a, e), a, OM.SOLAR_MASS_KG);
  const vApo = OM.orbitalSpeed(OM.aphelionDistance(a, e), a, OM.SOLAR_MASS_KG);
  const ratio = vPeri / vApo;
  assert.ok(Math.abs(ratio - (1 + e) / (1 - e)) < 1e-9);
  assert.ok(Math.abs(ratio - 1.034) < 0.001, `got ${ratio.toFixed(4)}`);
  assert.ok(vPeri > vApo, 'faster at perihelion than aphelion');
});

test('orbital speed at 1 AU around the Sun: absolute perihelion/aphelion km/s for e=0.3 and e=0.5 (sims/kepler.html\'s assumed orbit)', () => {
  // Not just the ratio (already checked above) — the actual km/s values
  // sims/kepler.html displays, so a unit or constant mistake that
  // happens to preserve the ratio still gets caught.
  const a = OM.AU_M;
  const expected = {
    0.3: { peri: 40.6, apo: 21.9 },
    0.5: { peri: 51.6, apo: 17.2 },
  };
  Object.entries(expected).forEach(([eStr, { peri, apo }]) => {
    const e = Number(eStr);
    const vPeri = OM.orbitalSpeed(OM.perihelionDistance(a, e), a, OM.SOLAR_MASS_KG) / 1000;
    const vApo = OM.orbitalSpeed(OM.aphelionDistance(a, e), a, OM.SOLAR_MASS_KG) / 1000;
    assert.ok(Math.abs(vPeri - peri) < 0.1, `e=${e} perihelion: got ${vPeri.toFixed(2)} km/s, expected ~${peri}`);
    assert.ok(Math.abs(vApo - apo) < 0.1, `e=${e} aphelion: got ${vApo.toFixed(2)} km/s, expected ~${apo}`);
  });
});

test("sims/kepler.html's comet presets (Halley's and Encke's) satisfy Kepler's third law, T²/r³ ≈ 1", () => {
  // Mirrors the COMETS constant plotted on kepler.html's Third Law
  // graph and the Halley/Encke preset figures — approximate, not from
  // the exam data sheet, but still real enough to sit close to the
  // planets' own T²/r³ ≈ 1 line.
  const comets = [
    { name: "Halley's Comet", distanceAU: 17.8, periodYears: 75 },
    { name: "Encke's Comet", distanceAU: 2.2, periodYears: 3.3 },
  ];
  comets.forEach(({ name, distanceAU, periodYears }) => {
    const k = OM.tSquaredOverRCubed(periodYears, distanceAU);
    assert.ok(Math.abs(k - 1) <= 0.03, `${name}: T²/r³ = ${k.toFixed(4)}`);
  });
});

test("numerically stepping an eccentric orbit sweeps equal areas in equal times (Kepler's 2nd law)", () => {
  // Equal steps in mean anomaly ARE equal steps in time (mean anomaly is
  // defined to advance uniformly), so if the area the focus-to-body line
  // sweeps each step is the same regardless of where in the orbit that
  // step falls, that numerically demonstrates the law.
  const a = 10;
  const e = 0.6; // deliberately eccentric, so a bug would show up clearly
  const steps = 360;

  function triangleArea(p1, p2) {
    return 0.5 * Math.abs(p1.x * p2.y - p2.x * p1.y);
  }

  const areas = [];
  for (let i = 0; i < steps; i += 1) {
    const m1 = (2 * Math.PI * i) / steps;
    const m2 = (2 * Math.PI * (i + 1)) / steps;
    const p1 = OM.positionAtMeanAnomaly(m1, a, e);
    const p2 = OM.positionAtMeanAnomaly(m2, a, e);
    areas.push(triangleArea(p1, p2));
  }

  const min = Math.min(...areas);
  const max = Math.max(...areas);
  // The chord-triangle approximation of the true swept sector area has a
  // little error of its own, worse the fewer/wider the steps, so this
  // isn't exact — but with 360 steps on e=0.6 it should be well under 1%.
  assert.ok((max - min) / min < 0.01, `areas varied by ${(((max - min) / min) * 100).toFixed(2)}%: min ${min}, max ${max}`);

  // Sanity check the geometry itself: periapsis (fastest, most tightly
  // curved) should be noticeably closer to the focus than apoapsis.
  const periPos = OM.positionAtMeanAnomaly(0, a, e);
  const apoPos = OM.positionAtMeanAnomaly(Math.PI, a, e);
  assert.ok(periPos.r < apoPos.r);
});

test('gravitationalForceRatio: doubling the separation divides the force by 4', () => {
  assert.ok(Math.abs(OM.gravitationalForceRatio({ separationFactor: 2 }) - 0.25) < 1e-12);
});

test('gravitationalForceRatio: tripling one mass multiplies the force by 3', () => {
  assert.ok(Math.abs(OM.gravitationalForceRatio({ massFactor1: 3 }) - 3) < 1e-12);
  assert.ok(Math.abs(OM.gravitationalForceRatio({ massFactor2: 3 }) - 3) < 1e-12);
});

test('gravitationalForceRatio: combines independently, and an unchanged system has a ratio of 1', () => {
  assert.equal(OM.gravitationalForceRatio({}), 1);
  assert.equal(OM.gravitationalForceRatio(), 1);
  // Both masses tripled, separation doubled: (3*3)/2^2 = 2.25.
  const combined = OM.gravitationalForceRatio({ massFactor1: 3, massFactor2: 3, separationFactor: 2 });
  assert.ok(Math.abs(combined - 2.25) < 1e-12);
});
