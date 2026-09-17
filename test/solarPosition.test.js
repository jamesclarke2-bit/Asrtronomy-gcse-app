const test = require('node:test');
const assert = require('node:assert/strict');
const { getSunPosition } = require('../src/solarPosition');

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
