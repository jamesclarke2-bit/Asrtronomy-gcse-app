const test = require('node:test');
const assert = require('node:assert/strict');
const {
  INCLINATION_DEG,
  SOLAR_LIMIT_DEG,
  LUNAR_LIMIT_DEG,
  distanceFromNearestNode,
  eclipticLatitude,
  nearestNewOrFullMoon,
  getEclipseState,
} = require('../src/eclipseGeometry');
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
