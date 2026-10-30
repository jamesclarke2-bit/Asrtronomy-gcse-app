const test = require('node:test');
const assert = require('node:assert/strict');
const { getSunPosition, sunriseAzimuthDeg } = require('../src/solarPosition');

// Reference: London (51.5074°N, -0.1278°E), summer solstice noon UTC.
// Expected altitude ~62° and declination ~+23.4° (solstice value).
test('summer solstice noon over London matches reference values', () => {
  const sun = getSunPosition(new Date('2026-06-21T12:00:00Z'), 51.5074, -0.1278);
  assert.ok(Math.abs(sun.altitude - 62) < 1, `altitude ${sun.altitude} not close to 62°`);
  assert.ok(Math.abs(sun.declination - 23.44) < 0.1, `declination ${sun.declination} not close to +23.44°`);
});

test('declination swings between the solstice extremes across a year', () => {
  const summer = getSunPosition(new Date('2026-06-21T12:00:00Z'), 51.5074, -0.1278);
  const winter = getSunPosition(new Date('2026-12-21T12:00:00Z'), 51.5074, -0.1278);
  assert.ok(Math.abs(summer.declination - 23.44) < 0.1);
  assert.ok(Math.abs(winter.declination + 23.44) < 0.1);
});

test('altitude at solar noon roughly equals 90 - |latitude - declination|', () => {
  const lat = 51.5074;
  const lon = -0.1278;
  const sun = getSunPosition(new Date('2026-06-21T12:00:00Z'), lat, lon);
  const expected = 90 - Math.abs(lat - sun.declination);
  assert.ok(Math.abs(sun.altitude - expected) < 1);
});

// Reference: the equation of time's two well-known yearly extremes —
// the sundial runs slowest (most behind the clock) around mid-February
// and fastest (most ahead) around early November.
test('equation of time hits its known extremes', () => {
  const feb = getSunPosition(new Date('2026-02-11T12:00:00Z'), 0, 0);
  const nov = getSunPosition(new Date('2026-11-03T12:00:00Z'), 0, 0);
  assert.ok(Math.abs(feb.equationOfTime + 14.2) < 0.5, `Feb equation of time ${feb.equationOfTime} not close to -14.2 min`);
  assert.ok(Math.abs(nov.equationOfTime - 16.5) < 0.5, `Nov equation of time ${nov.equationOfTime} not close to +16.5 min`);
});

test('equation of time is near zero close to mid-April and early September', () => {
  const apr = getSunPosition(new Date('2026-04-15T12:00:00Z'), 0, 0);
  const sep = getSunPosition(new Date('2026-09-01T12:00:00Z'), 0, 0);
  assert.ok(Math.abs(apr.equationOfTime) < 1);
  assert.ok(Math.abs(sep.equationOfTime) < 1);
});

// --- sunriseAzimuthDeg: notes/archaeoastronomy.html's Stonehenge sunrise
// simulator, at Stonehenge's own latitude (51.2°N).

const STONEHENGE_LAT = 51.2;
const OBLIQUITY_DEG = 23.4393;

test('sunrise azimuth at the June solstice is about 50°, matching Stonehenge\'s own axis', () => {
  const az = sunriseAzimuthDeg(OBLIQUITY_DEG, STONEHENGE_LAT);
  assert.ok(Math.abs(az - 50) < 1, `expected ~50°, got ${az.toFixed(2)}°`);
});

test('sunrise azimuth at the equinox is exactly due east (90°)', () => {
  const az = sunriseAzimuthDeg(0, STONEHENGE_LAT);
  assert.ok(Math.abs(az - 90) < 1e-9, `expected 90°, got ${az}`);
});

test('sunrise azimuth at the December solstice is about 130°', () => {
  const az = sunriseAzimuthDeg(-OBLIQUITY_DEG, STONEHENGE_LAT);
  assert.ok(Math.abs(az - 130) < 1, `expected ~130°, got ${az.toFixed(2)}°`);
});

test('sunrise azimuth is symmetric around 90° (due east) for +/- the same declination', () => {
  const summer = sunriseAzimuthDeg(OBLIQUITY_DEG, STONEHENGE_LAT);
  const winter = sunriseAzimuthDeg(-OBLIQUITY_DEG, STONEHENGE_LAT);
  assert.ok(Math.abs((summer - 90) + (winter - 90)) < 1e-9, `${summer} and ${winter} should be equally spaced either side of 90°`);
});

test('sunriseAzimuthDeg matches the general getAltAz-style formula at altitude 0 (zenith distance 90°)', () => {
  // The same identity the function's own comment derives: cos(azimuth) =
  // sin(dec) / cos(lat), independently re-derived here from the general
  // zenith-distance form rather than just re-calling the function under test.
  const dec = 10;
  const lat = 40;
  const RAD = Math.PI / 180;
  const zenithDistance = 90;
  const expectedCosAz = (Math.sin(dec * RAD) - Math.sin(lat * RAD) * Math.cos(zenithDistance * RAD)) / (Math.cos(lat * RAD) * Math.sin(zenithDistance * RAD));
  const expectedAz = Math.acos(Math.max(-1, Math.min(1, expectedCosAz))) / RAD;
  assert.ok(Math.abs(sunriseAzimuthDeg(dec, lat) - expectedAz) < 1e-9);
});
