const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SEMI_MAJOR_AXIS_KM,
  PERIGEE_KM,
  APOGEE_KM,
  ECCENTRICITY,
  SUPERMOON_WINDOW_DAYS,
  trueAnomalyFromMean,
  distanceAtTrueAnomaly,
  getMoonOrbit,
} = require('../src/moonOrbitPanel');
const { getMoonPhase, phaseName } = require('../src/moonPhase');

test('orbit constants give the expected perigee and apogee', () => {
  assert.equal(SEMI_MAJOR_AXIS_KM, 384400);
  assert.ok(Math.abs(PERIGEE_KM - 363300) < 100, `perigee ${PERIGEE_KM}`);
  assert.ok(Math.abs(APOGEE_KM - 405500) < 100, `apogee ${APOGEE_KM}`);
});

test('distance from true anomaly: perigee at 0, apogee at 180', () => {
  assert.ok(Math.abs(distanceAtTrueAnomaly(0) - PERIGEE_KM) < 1e-6);
  assert.ok(Math.abs(distanceAtTrueAnomaly(180) - APOGEE_KM) < 1e-6);
  const semiLatusRectum = SEMI_MAJOR_AXIS_KM * (1 - ECCENTRICITY * ECCENTRICITY);
  assert.ok(Math.abs(distanceAtTrueAnomaly(90) - semiLatusRectum) < 1e-6);
});

test('true anomaly matches mean anomaly at perigee and apogee, and leads it in between', () => {
  assert.ok(Math.abs(trueAnomalyFromMean(0)) < 1e-9);
  assert.ok(Math.abs(trueAnomalyFromMean(180) - 180) < 1e-9);
  // The Moon moves fastest just after perigee, so its true angle from
  // perigee runs ahead of the uniform mean angle on the way out.
  for (const M of [20, 60, 90, 150]) {
    assert.ok(trueAnomalyFromMean(M) > M, `expected true > mean at M=${M}`);
  }
  for (const M of [210, 270, 330]) {
    assert.ok(trueAnomalyFromMean(M) < M, `expected true < mean at M=${M}`);
  }
});

// Real perigees (UTC), as widely published at the time of each supermoon.
// These check the date -> mean anomaly step against reality, not just
// the geometry.
const REAL_PERIGEES = [
  ['2016-11-14T11:23Z', 'November 2016 supermoon'],
  ['2018-01-01T21:54Z', 'January 2018 supermoon'],
  ['2019-02-19T09:06Z', 'February 2019 supermoon'],
  ['2023-08-30T15:53Z', 'August 2023 Super Blue Moon'],
  ['2024-10-17T00:51Z', 'October 2024 supermoon'],
];

for (const [iso, label] of REAL_PERIGEES) {
  test(`model places the ${label} perigee within a day of the real one`, () => {
    const { daysFromPerigee, distanceKm } = getMoonOrbit(new Date(iso));
    assert.ok(Math.abs(daysFromPerigee) < 1, `${daysFromPerigee} days from perigee`);
    assert.ok(distanceKm - PERIGEE_KM < 1000, `${distanceKm} km`);
  });
}

test('model places the real September 2019 apogee near apogee', () => {
  const { meanAnomalyDeg, distanceKm } = getMoonOrbit(new Date('2019-09-13T13:32Z'));
  assert.ok(Math.abs(meanAnomalyDeg - 180) < 10, `mean anomaly ${meanAnomalyDeg}`);
  assert.ok(APOGEE_KM - distanceKm < 1000, `${distanceKm} km`);
});

function isSupermoon(date) {
  const name = phaseName(getMoonPhase(date).theta);
  const { daysFromPerigee } = getMoonOrbit(date);
  return (name === 'Full Moon' || name === 'New Moon') && Math.abs(daysFromPerigee) <= SUPERMOON_WINDOW_DAYS;
}

test('the real 31 August 2023 Super Blue Moon counts as a supermoon', () => {
  assert.equal(isSupermoon(new Date('2023-08-31T12:00Z')), true);
});

test('the real 14 September 2019 "micromoon" full moon does not', () => {
  const date = new Date('2019-09-14T12:00Z');
  assert.equal(phaseName(getMoonPhase(date).theta), 'Full Moon');
  assert.equal(isSupermoon(date), false);
});
