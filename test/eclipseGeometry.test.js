const test = require('node:test');
const assert = require('node:assert/strict');
const {
  INCLINATION_DEG,
  SOLAR_LIMIT_DEG,
  LUNAR_LIMIT_DEG,
  distanceFromNearestNode,
  eclipticLatitude,
  argumentOfLatitude,
  nearestNewOrFullMoon,
  solarShadowFrom,
  getEclipseState,
} = require('../src/eclipseGeometry');
const { getMoonOrbit } = require('../src/moonOrbitPanel');
const { getSunPosition } = require('../src/solarPosition');

const atNoon = (iso) => new Date(`${iso}T12:00:00Z`);

test('ecliptic limits match the standard published values', () => {
  assert.equal(SOLAR_LIMIT_DEG, 18.4);
  assert.equal(LUNAR_LIMIT_DEG, 12.2);
  assert.equal(INCLINATION_DEG, 5.145);
});

test('distance from the nearest node, measured either side of either node', () => {
  assert.deepEqual(distanceFromNearestNode(0), { degrees: 0, node: 'ascending' });
  assert.deepEqual(distanceFromNearestNode(350), { degrees: 10, node: 'ascending' });
  assert.deepEqual(distanceFromNearestNode(180), { degrees: 0, node: 'descending' });
  assert.deepEqual(distanceFromNearestNode(200), { degrees: 20, node: 'descending' });
  assert.equal(distanceFromNearestNode(90).degrees, 90);
});

test('the Moon is furthest from the ecliptic, by the full tilt, halfway between nodes', () => {
  assert.ok(Math.abs(eclipticLatitude(90) - INCLINATION_DEG) < 1e-9);
  assert.ok(Math.abs(eclipticLatitude(270) + INCLINATION_DEG) < 1e-9);
  assert.ok(Math.abs(eclipticLatitude(0)) < 1e-9);
});

test("the Sun's ecliptic longitude is ~0 at the real March 2024 equinox", () => {
  const { apparentLongitude } = getSunPosition(new Date('2024-03-20T03:06Z'), 0, 0);
  assert.ok(Math.min(apparentLongitude, 360 - apparentLongitude) < 0.1, `${apparentLongitude}`);
});

// Real, published new/full Moon times (UTC).
const REAL_SYZYGIES = [
  ['2023-10-14T17:55Z', 'new'],
  ['2024-04-08T18:21Z', 'new'],
  ['2023-11-13T09:27Z', 'new'],
  ['2024-03-10T09:00Z', 'new'],
  ['2022-11-08T11:02Z', 'full'],
  ['2025-03-14T06:55Z', 'full'],
  ['2025-09-07T18:09Z', 'full'],
];

for (const [iso, type] of REAL_SYZYGIES) {
  test(`finds the real ${type} Moon of ${iso.slice(0, 10)} to within 4 hours`, () => {
    const actual = new Date(iso);
    const found = nearestNewOrFullMoon(new Date(actual.getTime() + 6 * 3600000));
    assert.equal(found.type, type);
    const errorHours = Math.abs(found.date - actual) / 3600000;
    assert.ok(errorHours < 4, `${errorHours.toFixed(1)} h out`);
  });
}

// --- The brief's validation dates ------------------------------------

test('14 October 2023 (real annular solar eclipse) is flagged eclipse-possible', () => {
  const state = getEclipseState(atNoon('2023-10-14'));
  assert.equal(state.kind, 'solar');
  assert.equal(state.eclipsePossible, true);
});

test('8 April 2024 (real total solar eclipse) is flagged eclipse-possible', () => {
  const state = getEclipseState(atNoon('2024-04-08'));
  assert.equal(state.kind, 'solar');
  assert.equal(state.eclipsePossible, true);
});

test('the new Moon a month after the October 2023 eclipse (13 Nov 2023) is not', () => {
  const state = getEclipseState(atNoon('2023-11-13'));
  assert.equal(state.onThisDate, true, 'should still be recognised as a new Moon');
  assert.ok(state.nodeDistanceAtSyzygyDeg > SOLAR_LIMIT_DEG);
  assert.equal(state.eclipsePossible, false);
});

test('the new Moon a month before the April 2024 eclipse (10 Mar 2024) is not', () => {
  const state = getEclipseState(atNoon('2024-03-10'));
  assert.equal(state.onThisDate, true, 'should still be recognised as a new Moon');
  assert.ok(state.nodeDistanceAtSyzygyDeg > SOLAR_LIMIT_DEG);
  assert.equal(state.eclipsePossible, false);
});

// --- Extra checks beyond the brief -----------------------------------

for (const iso of ['2022-11-08', '2025-03-14', '2025-09-07']) {
  test(`${iso} (real total lunar eclipse) is flagged eclipse-possible`, () => {
    const state = getEclipseState(atNoon(iso));
    assert.equal(state.kind, 'lunar');
    assert.equal(state.eclipsePossible, true);
  });
}

for (const iso of ['2023-11-27', '2024-02-24']) {
  test(`${iso} (an ordinary full Moon, no eclipse) is not`, () => {
    const state = getEclipseState(atNoon(iso));
    assert.equal(state.onThisDate, true, 'should still be recognised as a full Moon');
    assert.equal(state.eclipsePossible, false);
  });
}

// The autumn 2024 eclipse season: a real partial lunar eclipse on
// 18 September and a real annular solar eclipse on 2 October.
test('18 September 2024 (real partial lunar eclipse) is flagged eclipse-possible', () => {
  const state = getEclipseState(atNoon('2024-09-18'));
  assert.equal(state.kind, 'lunar');
  assert.equal(state.eclipsePossible, true);
});

test('2 October 2024 (real annular solar eclipse) is flagged eclipse-possible', () => {
  const state = getEclipseState(atNoon('2024-10-02'));
  assert.equal(state.kind, 'solar');
  assert.equal(state.eclipsePossible, true);
});

test('a date with no new or full Moon is never eclipse-possible', () => {
  // A week after the April 2024 eclipse: close to a node, but first quarter.
  const state = getEclipseState(atNoon('2024-04-15'));
  assert.equal(state.onThisDate, false);
  assert.equal(state.eclipsePossible, false);
});

// --- Shadow cones: what kind of eclipse ------------------------------

test("the Sun's distance matches the real 2024 perihelion and aphelion", () => {
  const perihelion = getSunPosition(new Date('2024-01-03T00:39Z'), 0, 0).distanceAu;
  const aphelion = getSunPosition(new Date('2024-07-05T05:06Z'), 0, 0).distanceAu;
  assert.ok(Math.abs(perihelion - 0.98331) < 0.0001, `${perihelion}`);
  assert.ok(Math.abs(aphelion - 1.01673) < 0.0001, `${aphelion}`);
});

test('14 October 2023 is annular: the Moon was far out, so its umbra fell short of Earth', () => {
  const { eclipseType, shadow } = getEclipseState(atNoon('2023-10-14'));
  assert.equal(eclipseType, 'annular');
  assert.ok(shadow.umbraLengthKm < shadow.surfaceDistanceKm, 'umbra should end before the surface');
});

test('8 April 2024 is total: the Moon was closer, so its umbra reached Earth', () => {
  const { eclipseType, shadow } = getEclipseState(atNoon('2024-04-08'));
  assert.equal(eclipseType, 'total');
  assert.ok(shadow.umbraLengthKm > shadow.surfaceDistanceKm, 'umbra should reach the surface');
});

test('the difference between those two eclipses comes from the Moon’s distance', () => {
  const october = getEclipseState(atNoon('2023-10-14')).shadow;
  const april = getEclipseState(atNoon('2024-04-08')).shadow;
  assert.ok(october.moonDistanceKm - april.moonDistanceKm > 20000, 'October Moon should be much farther');

  // Keep April 2024's exact alignment and Sun distance, and swap in only
  // October 2023's Moon distance: the same eclipse turns annular.
  const aprilSyzygy = nearestNewOrFullMoon(atNoon('2024-04-08')).date;
  const aprilInputs = {
    sunDistanceKm: getSunPosition(aprilSyzygy, 0, 0).distanceAu * 149597870.7,
    moonLatitudeDeg: eclipticLatitude(argumentOfLatitude(aprilSyzygy)),
  };
  assert.equal(solarShadowFrom({ ...aprilInputs, moonDistanceKm: april.moonDistanceKm }).type, 'total');
  assert.equal(solarShadowFrom({ ...aprilInputs, moonDistanceKm: october.moonDistanceKm }).type, 'annular');
});

test('2 October 2024 (real annular solar eclipse, Moon near apogee) is annular', () => {
  const { eclipseType } = getEclipseState(atNoon('2024-10-02'));
  assert.equal(eclipseType, 'annular');
  assert.ok(getMoonOrbit(nearestNewOrFullMoon(atNoon('2024-10-02')).date).distanceKm > 400000);
});

// Real partial solar eclipses: the shadow's axis missed Earth entirely.
for (const iso of ['2022-10-25', '2025-03-29', '2025-09-21']) {
  test(`${iso} (real partial solar eclipse) is partial`, () => {
    const { eclipseType, shadow } = getEclipseState(atNoon(iso));
    assert.equal(eclipseType, 'partial');
    assert.ok(Math.abs(shadow.gamma) > 1, 'axis should miss Earth');
  });
}

for (const iso of ['2022-11-08', '2025-03-14', '2025-09-07']) {
  test(`${iso} (real total lunar eclipse) is total`, () => {
    const { eclipseType, shadow } = getEclipseState(atNoon(iso));
    assert.equal(eclipseType, 'total');
    assert.ok(shadow.umbralMagnitude >= 1);
  });
}

test('25 March 2024 (real penumbral-only lunar eclipse) is penumbral', () => {
  const { eclipsePossible, eclipseType, shadow } = getEclipseState(atNoon('2024-03-25'));
  // Inside the widest ecliptic limit, but the real distances show the
  // Moon only reached the faint outer shadow.
  assert.equal(eclipsePossible, true);
  assert.equal(eclipseType, 'penumbral');
  assert.ok(shadow.umbralMagnitude < 0 && shadow.penumbralMagnitude > 0);
});

test('no shadow is computed when no eclipse is possible', () => {
  const state = getEclipseState(atNoon('2023-11-13'));
  assert.equal(state.shadow, null);
  assert.equal(state.eclipseType, 'none');
});
