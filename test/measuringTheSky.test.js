const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/measuringTheSky');
const { STARS, angularSeparation } = require('../src/starPatterns');
const { getSubtopic } = require('../src/curriculum');

test("Eratosthenes: 7.2° and 800 km give Earth's 40,000 km circumference", () => {
  assert.equal(M.eratosthenesCircumference(7.2, 800), 40000);
  // 7.2° is one fiftieth of a circle.
  assert.equal(M.eratosthenesCircumference(7.2, 1), 50);
  // Close to the real meridional circumference, pi x Earth's diameter.
  assert.ok(Math.abs(M.eratosthenesCircumference(7.2, 800) - Math.PI * M.EARTH_DIAMETER_KM) / 40000 < 0.01);
});

test("Eratosthenes' 250,000 stadia spans about 39,000-46,000 km for the proposed stadion lengths (157.5-185 m)", () => {
  const stadia = M.eratosthenesCircumference(7.2, 5000);
  assert.equal(stadia, 250000);
  assert.equal(Math.round((stadia * 0.1575) / 1000), 39);
  assert.equal(Math.round((stadia * 0.185) / 1000), 46);
});

test('Aristarchus, lunar eclipse: the shadow is ~2.6 Moons wide and narrows by ~1 Moon, so the Moon is ~0.27 of Earth', () => {
  const shadow = M.earthShadowAtMoon();
  assert.equal(Number(shadow.widthInMoons.toFixed(1)), 2.6);
  assert.ok(shadow.narrowingInMoons > 0.9 && shadow.narrowingInMoons < 1.1);
  const earthInMoons = shadow.widthInMoons + shadow.narrowingInMoons;
  assert.equal(Number(earthInMoons.toFixed(1)), Number((M.EARTH_DIAMETER_KM / M.MOON_DIAMETER_KM).toFixed(1)));
  assert.equal(Number((1 / earthInMoons).toFixed(2)), 0.27);
});

test('Aristarchus, lunar distance: half a degree across puts the Moon ~110 diameters away', () => {
  const angle = M.angularDiameterDeg(M.MOON_DIAMETER_KM, M.MOON_DISTANCE_KM);
  assert.ok(Math.abs(angle - 0.5) < 0.03);
  assert.equal(Math.round(M.MOON_DISTANCE_KM / M.MOON_DIAMETER_KM / 10) * 10, 110);
});

test('Aristarchus, quarter Moon: 87° gives ~19x; the true angle (~89.85°) gives ~390x', () => {
  assert.equal(Math.round(M.sunDistanceInMoonDistances(87)), 19);
  const trueAngle = M.trueQuarterAngleDeg();
  assert.equal(trueAngle.toFixed(2), '89.85');
  assert.equal(Math.round(M.sunDistanceInMoonDistances(trueAngle) / 10) * 10, 390);
});

test('the Earth-Moon-Sun figures quoted on the page', () => {
  assert.equal(Math.round(M.SUN_DIAMETER_KM / 10000) / 100, 1.39); // million km
  assert.equal(Math.round(M.SUN_DIAMETER_KM / M.MOON_DIAMETER_KM), 400);
  assert.equal(Math.round(M.SUN_DISTANCE_KM / M.MOON_DISTANCE_KM), 389);
  assert.equal(Math.round(M.SUN_DIAMETER_KM / M.EARTH_DIAMETER_KM), 109);
  assert.equal((M.EARTH_DIAMETER_KM / M.MOON_DIAMETER_KM).toFixed(1), '3.7');
  assert.equal(Math.round(M.MOON_DISTANCE_KM / M.EARTH_DIAMETER_KM), 30);
  // Both about half a degree across: the eclipse coincidence.
  const moon = M.angularDiameterDeg(M.MOON_DIAMETER_KM, M.MOON_DISTANCE_KM);
  const sun = M.angularDiameterDeg(M.SUN_DIAMETER_KM, M.SUN_DISTANCE_KM);
  assert.ok(Math.abs(moon - sun) < 0.05);
});

test("sizes match the eclipse model's shadow constants", () => {
  // src/eclipseGeometry.js keeps these inside its factory; its umbra
  // test values depend on the same IAU/mean figures.
  assert.equal(M.SUN_RADIUS_KM, 695700);
  assert.equal(M.MOON_RADIUS_KM, 1737.4);
  assert.equal(M.EARTH_RADIUS_KM, 6371);
  assert.equal(M.SUN_DISTANCE_KM, 149597870.7);
  assert.equal(M.MOON_DISTANCE_KM, require('../src/moonOrbitPanel').SEMI_MAJOR_AXIS_KM);
});

test('precession: the pole is at the J2000 pole in 2000 and always 23.44° from the ecliptic pole', () => {
  const pole2000 = M.celestialPoleAt(2000);
  assert.ok(pole2000.dec > 89.9999);
  for (let year = -4000; year <= 23000; year += 1000) {
    assert.ok(Math.abs(M.equatorialToEcliptic(M.celestialPoleAt(year)).lat - (90 - M.OBLIQUITY_DEG)) < 1e-9);
  }
  // One full cycle brings it back.
  assert.ok(angularSeparation(M.celestialPoleAt(0), M.celestialPoleAt(M.PRECESSION_PERIOD_YEARS)) < 1e-6);
  assert.equal(Math.round(M.PRECESSION_PERIOD_YEARS / 1000), 26);
});

function closestApproach(star, from, to) {
  let best = { year: from, sep: Infinity };
  for (let year = from; year <= to; year += 10) {
    const sep = angularSeparation(M.celestialPoleAt(year), star);
    if (sep < best.sep) best = { year, sep };
  }
  return best;
}

test('pole stars through time match the table on the page', () => {
  // [star, published year of closest approach, how close (°)], checked
  // to a few centuries and a fraction of a degree.
  const table = [
    ['thuban', -2830, 0.2],
    ['polaris', 2100, 0.45],
    ['errai', 4000, 2],
    ['alderamin', 7500, 2.5],
    ['vega', 14000, 5],
  ];
  table.forEach(([key, year, sep]) => {
    const found = closestApproach(STARS[key], year - 2000, year + 2000);
    assert.ok(Math.abs(found.year - year) <= 300, `${key}: model ${found.year}, published ${year}`);
    assert.ok(Math.abs(found.sep - sep) < 0.5, `${key}: model ${found.sep.toFixed(2)}°, table ${sep}°`);
  });
});

test('Polaris is the pole star today, and Vega is the brightest of the cycle', () => {
  assert.ok(angularSeparation(M.celestialPoleAt(2025), STARS.polaris) < 1);
  const candidates = ['thuban', 'kochab', 'polaris', 'errai', 'alderamin', 'deneb', 'vega'];
  const brightest = candidates.reduce((a, b) => (STARS[a].mag < STARS[b].mag ? a : b));
  assert.equal(brightest, 'vega');
});

test('the new subtopics follow on from the last u2 id', () => {
  assert.ok(getSubtopic('u2.27'));
  assert.equal(getSubtopic('u2.28').title, 'Sizes and distances in the Earth-Moon-Sun system');
  assert.equal(getSubtopic('u2.29').title, 'Precession');
  assert.equal(getSubtopic('u2.30'), undefined);
});
