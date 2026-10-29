const test = require('node:test');
const assert = require('node:assert/strict');
const SunRotation = require('../src/sunRotation');

// --- spotXPosition: x = R cos(latitude) sin(longitude) -------------------

test('spotXPosition: a spot on the central meridian sits at x = 0, whatever its latitude', () => {
  assert.equal(SunRotation.spotXPosition(0, 0, 100), 0);
  assert.equal(SunRotation.spotXPosition(45, 0, 100), 0);
});

test('spotXPosition: at the equator, the east and west limbs are at -R and +R', () => {
  assert.ok(Math.abs(SunRotation.spotXPosition(0, -90, 100) - -100) < 1e-9);
  assert.ok(Math.abs(SunRotation.spotXPosition(0, 90, 100) - 100) < 1e-9);
});

test('spotXPosition: a higher latitude compresses the x range by cos(latitude)', () => {
  const equatorLimb = SunRotation.spotXPosition(0, 90, 100);
  const sixtyLimb = SunRotation.spotXPosition(60, 90, 100);
  assert.ok(Math.abs(sixtyLimb - 50) < 1e-9, 'cos(60°) = 0.5, so the limb sits at half the radius');
  assert.ok(sixtyLimb < equatorLimb, 'higher latitude reaches less far across the disc');
});

test('spotYPosition: depends only on latitude, not on longitude or day', () => {
  assert.ok(Math.abs(SunRotation.spotYPosition(0, 100) - 0) < 1e-9);
  assert.ok(Math.abs(SunRotation.spotYPosition(30, 100) - 50) < 1e-9, 'sin(30°) = 0.5');
  assert.ok(Math.abs(SunRotation.spotYPosition(-30, 100) - -50) < 1e-9, 'a southern latitude gives a negative y');
});

// --- Differential rotation law -------------------------------------------
// omega = 14.71 - 2.40 sin^2(phi) - 1.79 sin^4(phi) deg/day (sidereal),
// giving sidereal periods of about 24.5, 25.7 and 30.2 days at 0, 30 and
// 60 degrees latitude.

test('siderealPeriodDays: about 24.5 days at the equator', () => {
  assert.ok(Math.abs(SunRotation.siderealPeriodDays(0) - 24.5) < 0.1);
});

test('siderealPeriodDays: about 25.7 days at 30 degrees latitude', () => {
  assert.ok(Math.abs(SunRotation.siderealPeriodDays(30) - 25.7) < 0.1);
});

test('siderealPeriodDays: about 30.2 days at 60 degrees latitude', () => {
  assert.ok(Math.abs(SunRotation.siderealPeriodDays(60) - 30.2) < 0.1);
});

test('differential rotation: a higher latitude always rotates slower (longer sidereal period)', () => {
  const p0 = SunRotation.siderealPeriodDays(0);
  const p30 = SunRotation.siderealPeriodDays(30);
  const p60 = SunRotation.siderealPeriodDays(60);
  assert.ok(p0 < p30 && p30 < p60);
});

// --- Sidereal vs synodic period --------------------------------------------
// 1/synodic = 1/sidereal - 1/365.25

test('synodicPeriodDays: a mean sidereal period of 25.38 days gives a synodic period of about 27.27 days', () => {
  assert.ok(Math.abs(SunRotation.synodicPeriodDays(25.38) - 27.27) < 0.05);
});

test('synodicPeriodDays: an equatorial sidereal period of 24.5 days gives a synodic period of about 26.3 days', () => {
  assert.ok(Math.abs(SunRotation.synodicPeriodDays(24.5) - 26.3) < 0.05);
});

test('synodicPeriodDays: always longer than the sidereal period that produced it, since Earth orbits the same way the Sun spins', () => {
  [0, 30, 60].forEach((lat) => {
    const sidereal = SunRotation.siderealPeriodDays(lat);
    const synodic = SunRotation.synodicPeriodDays(sidereal);
    assert.ok(synodic > sidereal, `latitude ${lat}: synodic (${synodic}) should exceed sidereal (${sidereal})`);
  });
});

// --- Limb-to-limb crossing: half a synodic period --------------------------

test('a spot crosses from the east limb to the west limb in half a synodic period (about 13.6 days at the mean)', () => {
  const meanSynodic = SunRotation.synodicPeriodDays(25.38);
  const limbToLimbDays = meanSynodic / 2;
  assert.ok(Math.abs(limbToLimbDays - 13.6) < 0.1);
  // And the stated "double it" method recovers the full synodic period.
  assert.ok(Math.abs(SunRotation.synodicPeriodFromLimbToLimbDays(limbToLimbDays) - meanSynodic) < 1e-9);
});

// --- Visibility across the disc --------------------------------------------

test('isOnVisibleDisc: true up to and including both limbs, false just beyond either', () => {
  assert.equal(SunRotation.isOnVisibleDisc(0), true);
  assert.equal(SunRotation.isOnVisibleDisc(90), true);
  assert.equal(SunRotation.isOnVisibleDisc(-90), true);
  assert.equal(SunRotation.isOnVisibleDisc(90.01), false);
  assert.equal(SunRotation.isOnVisibleDisc(-90.01), false);
});

test('apparentLongitudeAtDay: advances at the synodic (not sidereal) rate, so a full disc crossing takes half the synodic period', () => {
  const lat = 0;
  const synodic = SunRotation.synodicPeriodDays(SunRotation.siderealPeriodDays(lat));
  const atStart = SunRotation.apparentLongitudeAtDay(lat, -90, 0);
  const atHalfSynodic = SunRotation.apparentLongitudeAtDay(lat, -90, synodic / 2);
  assert.ok(Math.abs(atStart - -90) < 1e-9);
  assert.ok(Math.abs(atHalfSynodic - 90) < 1e-9, 'half a synodic period should carry the spot from the east limb to the west limb');
});

// --- Two-reading ("stretch") method -----------------------------------------

test('periodFromTwoReadings: recovers the period from two known x positions and the days between them', () => {
  const R = 100;
  const lat = 0;
  const x1 = SunRotation.spotXPosition(lat, -30, R);
  const x2 = SunRotation.spotXPosition(lat, 20, R);
  // 50 degrees of longitude moved over 5 days -> 360 x 5 / 50 = 36 "days per rotation" at that (exaggerated) rate.
  const period = SunRotation.periodFromTwoReadings(lat, 0, x1, 5, x2, R);
  assert.ok(Math.abs(period - 36) < 1e-6);
});

test('periodFromTwoReadings: a realistic pair of readings at the mean rate recovers close to the true synodic period', () => {
  const R = 100;
  const lat = 0;
  const synodic = SunRotation.synodicPeriodDays(SunRotation.siderealPeriodDays(lat));
  const day1 = 2;
  const day2 = 8;
  const lon1 = SunRotation.apparentLongitudeAtDay(lat, -90, day1);
  const lon2 = SunRotation.apparentLongitudeAtDay(lat, -90, day2);
  const x1 = SunRotation.spotXPosition(lat, lon1, R);
  const x2 = SunRotation.spotXPosition(lat, lon2, R);
  const estimated = SunRotation.periodFromTwoReadings(lat, day1, x1, day2, x2, R);
  assert.ok(Math.abs(estimated - synodic) < 0.5, `estimated ${estimated} should be close to the true synodic period ${synodic}`);
});

test('longitudeFromXPosition and spotXPosition are inverses of each other', () => {
  const R = 100;
  [0, 30, 60].forEach((lat) => {
    [-80, -20, 0, 45, 85].forEach((lon) => {
      const x = SunRotation.spotXPosition(lat, lon, R);
      const recoveredLon = SunRotation.longitudeFromXPosition(lat, x, R);
      assert.ok(Math.abs(recoveredLon - lon) < 1e-6, `latitude ${lat}, longitude ${lon}: round-trip gave ${recoveredLon}`);
    });
  });
});
