const test = require('node:test');
const assert = require('node:assert/strict');
const PlanetaryMotion = require('../src/planetaryMotion');

function dayDate(daysSinceJ2000) {
  return new Date(Date.UTC(2000, 0, 1, 12, 0, 0) + daysSinceJ2000 * 86400000);
}

// Reference opposition day, found by scanning for a local maximum in
// elongation near where the two planets' periods predict one (see the
// synodic-period test below for how this and the surrounding scan
// were validated against the real ~780-day Mars synodic period).
const OPPOSITION_DAY = 2892;

test('orbital periods match their real approximate values', () => {
  assert.ok(Math.abs(PlanetaryMotion.PLANETS.earth.orbitalPeriodDays - 365.256) < 0.01);
  assert.ok(Math.abs(PlanetaryMotion.PLANETS.mars.orbitalPeriodDays - 686.98) < 0.01);
});

test('heliocentric position stays at a constant distance from the Sun (circular orbit)', () => {
  ['earth', 'mars'].forEach((key) => {
    const radius = PlanetaryMotion.PLANETS[key].orbitalRadiusAU;
    for (let d = 0; d < 2000; d += 137) {
      const { x, y } = PlanetaryMotion.heliocentricPosition(key, dayDate(d));
      assert.ok(Math.abs(Math.hypot(x, y) - radius) < 1e-9);
    }
  });
});

test('elongation is always within [0, 180] degrees', () => {
  for (let d = 0; d < 3000; d += 53) {
    const e = PlanetaryMotion.elongationDeg('mars', dayDate(d));
    assert.ok(e >= 0 && e <= 180, `elongation ${e} out of range at day ${d}`);
  }
});

test('Mars reaches opposition (elongation ~180deg) at the expected day', () => {
  const elongation = PlanetaryMotion.elongationDeg('mars', dayDate(OPPOSITION_DAY));
  assert.ok(elongation > 179, `expected near-180deg elongation at opposition, got ${elongation}`);

  // A local maximum: elongation a few days either side should be lower.
  const before = PlanetaryMotion.elongationDeg('mars', dayDate(OPPOSITION_DAY - 10));
  const after = PlanetaryMotion.elongationDeg('mars', dayDate(OPPOSITION_DAY + 10));
  assert.ok(before < elongation && after < elongation);
});

test('successive oppositions are separated by the real ~780-day Mars synodic period', () => {
  // 1 / (1/365.256 - 1/686.98) = 779.93 days — the classic "Mars
  // opposition every ~26 months" fact, and a check that's independent
  // of the exact phase/epoch chosen for either orbit.
  const nextOppositionElongation = PlanetaryMotion.elongationDeg('mars', dayDate(OPPOSITION_DAY + 780));
  assert.ok(nextOppositionElongation > 179, `expected the next opposition ~780 days later, got elongation ${nextOppositionElongation}`);
});

test('Mars undergoes retrograde apparent motion centred on opposition', () => {
  // Apparent longitude should be *decreasing* for a window around
  // opposition (Earth, on the faster inner orbit, overtaking Mars) and
  // increasing well before/after it.
  function apparentLonDelta(day) {
    const before = PlanetaryMotion.apparentGeocentricLongitude('mars', dayDate(day - 1));
    const after = PlanetaryMotion.apparentGeocentricLongitude('mars', dayDate(day + 1));
    let delta = after - before;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta;
  }

  assert.ok(apparentLonDelta(OPPOSITION_DAY) < 0, 'expected retrograde (decreasing) motion at opposition');
  assert.ok(apparentLonDelta(OPPOSITION_DAY - 100) > 0, 'expected normal prograde motion well before opposition');
  assert.ok(apparentLonDelta(OPPOSITION_DAY + 100) > 0, 'expected normal prograde motion well after opposition');
});

test('classifyAlignment reports opposition at the reference opposition day', () => {
  const result = PlanetaryMotion.classifyAlignment('mars', dayDate(OPPOSITION_DAY));
  assert.equal(result.type, 'opposition');
  assert.equal(result.subtype, null);
});

test('classifyAlignment reports conjunction roughly half a synodic period from opposition', () => {
  // Conjunction (elongation ~0) falls about 390 days (half of ~780)
  // from opposition for a roughly-circular-orbit outer planet.
  const result = PlanetaryMotion.classifyAlignment('mars', dayDate(OPPOSITION_DAY + 390));
  assert.equal(result.type, 'conjunction');
  // Mars is an outer planet, so it can never be an inferior conjunction.
  assert.equal(result.subtype, null);
});

test('classifyAlignment reports plain elongation with the actual angle in between', () => {
  const result = PlanetaryMotion.classifyAlignment('mars', dayDate(OPPOSITION_DAY + 200));
  assert.equal(result.type, 'elongation');
  assert.ok(result.elongationDeg > PlanetaryMotion.CONJUNCTION_THRESHOLD_DEG);
  assert.ok(result.elongationDeg < PlanetaryMotion.OPPOSITION_THRESHOLD_DEG);
});

test('apparentGeocentricLongitude is always a normalized 0-360 degree value', () => {
  for (let d = 0; d < 3000; d += 97) {
    const lon = PlanetaryMotion.apparentGeocentricLongitude('mars', dayDate(d));
    assert.ok(lon >= 0 && lon < 360, `longitude ${lon} out of range at day ${d}`);
  }
});
