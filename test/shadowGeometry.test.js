const test = require('node:test');
const assert = require('node:assert/strict');
const ShadowGeometry = require('../src/shadowGeometry');
const SolarPosition = require('../src/solarPosition');

function closeTo(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ~${expected}, got ${actual}`);
}

test('shadow length = height / tan(altitude): a 1 m stick at 30° altitude gives 1.732 m', () => {
  closeTo(ShadowGeometry.shadowLengthM(1, 30), 1.732, 0.001, 'shadow length at 30°');
});

test('shadowLengthM returns null once the Sun is at or below the horizon', () => {
  assert.equal(ShadowGeometry.shadowLengthM(1, 0), null);
  assert.equal(ShadowGeometry.shadowLengthM(1, -5), null);
});

test('at latitude 51.5° on an equinox, noon altitude is 38.5° and a 1 m shadow is 1.257 m', () => {
  // 2026-03-20 is close enough to the March equinox for declination ~0°.
  const noon = new Date(Date.UTC(2026, 2, 20, 12, 0));
  const sun = SolarPosition.getSunPosition(noon, 51.5, 0);
  closeTo(sun.declination, 0, 0.5, 'declination near the equinox');
  closeTo(sun.altitude, 38.5, 0.3, 'noon altitude at latitude 51.5° on the equinox');
  closeTo(ShadowGeometry.shadowLengthM(1, sun.altitude), 1.257, 0.02, '1 m shadow length at that altitude');
});

test("noon shadow points due north in the northern hemisphere, above the Sun's declination", () => {
  // Latitude well north of the Sun's declination at any time of year
  // (London, near either solstice): the Sun transits south of the
  // observer, so its shadow points north.
  const summerNoon = new Date(Date.UTC(2026, 5, 21, 12, 0));
  const sun = SolarPosition.getSunPosition(summerNoon, 51.5, 0);
  const tip = ShadowGeometry.shadowTipMetres(1, sun.altitude, sun.azimuth);
  assert.ok(tip.y > 0 && Math.abs(tip.x) < 0.01, `expected a due-north shadow tip, got (${tip.x.toFixed(3)}, ${tip.y.toFixed(3)})`);
});

test('noon shadow points due south below the declination (observer south of the subsolar latitude)', () => {
  // Latitude 5°N on the summer solstice: the Sun (declination ~23.4°N)
  // passes north of the zenith at noon, so its shadow points south.
  const summerNoon = new Date(Date.UTC(2026, 5, 21, 12, 0));
  const sun = SolarPosition.getSunPosition(summerNoon, 5, 0);
  assert.ok(sun.declination > 5, 'sanity check: declination north of this observer');
  const tip = ShadowGeometry.shadowTipMetres(1, sun.altitude, sun.azimuth);
  assert.ok(tip.y < 0 && Math.abs(tip.x) < 0.01, `expected a due-south shadow tip, got (${tip.x.toFixed(3)}, ${tip.y.toFixed(3)})`);
});

test('hour-line angles at latitude 51.5°: 11.84° one hour from noon, 38.05° three hours from noon', () => {
  closeTo(ShadowGeometry.sundialHourLineAngleDeg(51.5, 1), 11.84, 0.02, '1 h from noon');
  closeTo(ShadowGeometry.sundialHourLineAngleDeg(51.5, 3), 38.05, 0.02, '3 h from noon');
});

test('at latitude 90°, hour-line angles equal 15° × hours (no distortion at the pole)', () => {
  [1, 2, 3, 4, 5].forEach((h) => {
    closeTo(ShadowGeometry.sundialHourLineAngleDeg(90, h), 15 * h, 0.01, `${h} h from noon at the pole`);
  });
});

test('sundialHourLineAngleDeg is undefined exactly at ±6 hours from noon', () => {
  assert.equal(ShadowGeometry.sundialHourLineAngleDeg(51.5, 6), null);
  assert.equal(ShadowGeometry.sundialHourLineAngleDeg(51.5, -6), null);
});

test('longitude from an observed noon time: EoT = -14 min, noon at 12:14 UT gives 0°', () => {
  closeTo(ShadowGeometry.longitudeFromNoonUTDeg(-14, 12 * 60 + 14), 0, 0.01, 'Greenwich case');
});

test('longitude from an observed noon time: EoT = -14 min, noon at 12:34 UT gives 5° west', () => {
  closeTo(ShadowGeometry.longitudeFromNoonUTDeg(-14, 12 * 60 + 34), -5, 0.01, '5°W case');
});

test('longitude from an observed noon time: EoT = -14 min, noon at 12:26.8 UT gives about 3.2° west (Edinburgh)', () => {
  closeTo(ShadowGeometry.longitudeFromNoonUTDeg(-14, 12 * 60 + 26.8), -3.2, 0.05, 'Edinburgh case');
});

test('longitudeFromNoonUTDeg inverts solarPosition.js\'s own getSunriseSunset solar-noon formula', () => {
  // getSunriseSunset's solarNoonUT = 720 - 4*lon - equationOfTime, for
  // several real (lat, lon, date) combinations — confirms this module
  // solves the *same* relationship already in the engine, not a second
  // one of its own.
  const cases = [
    { lat: 51.5, lon: -2.6, date: new Date(Date.UTC(2026, 1, 12, 12, 0)) }, // Bristol, February
    { lat: 51.5, lon: 139.7, date: new Date(Date.UTC(2026, 10, 1, 12, 0)) }, // Tokyo, November
    { lat: -33.9, lon: 151.2, date: new Date(Date.UTC(2026, 5, 21, 12, 0)) }, // Sydney, June
  ];
  cases.forEach(({ lat, lon, date }) => {
    const sun = SolarPosition.getSunPosition(date, lat, lon);
    const { solarNoonUT } = SolarPosition.getSunriseSunset(date, lat, lon);
    const recoveredLon = ShadowGeometry.longitudeFromNoonUTDeg(sun.equationOfTime, solarNoonUT);
    closeTo(recoveredLon, lon, 0.01, `recovered longitude for (${lat}, ${lon})`);
  });
});

test('apparentSolarTimeMinutes reads exactly 720 (noon) at the engine\'s own solar-noon UT time', () => {
  const cases = [
    { lat: 51.5, lon: -2.6, date: new Date(Date.UTC(2026, 1, 12, 12, 0)) }, // Bristol, February
    { lat: 35.7, lon: 139.7, date: new Date(Date.UTC(2026, 10, 1, 12, 0)) }, // Tokyo, November
    { lat: -33.9, lon: 151.2, date: new Date(Date.UTC(2026, 5, 21, 12, 0)) }, // Sydney, June
  ];
  cases.forEach(({ lat, lon, date }) => {
    const sun = SolarPosition.getSunPosition(date, lat, lon);
    const { solarNoonUT } = SolarPosition.getSunriseSunset(date, lat, lon);
    const apparentTime = ShadowGeometry.apparentSolarTimeMinutes(solarNoonUT, lon, sun.equationOfTime);
    closeTo(apparentTime, 720, 0.01, `apparent solar time at (${lat}, ${lon})'s own solar noon`);
  });
});

test('the traced shadow minimum matches the time of solar noon from the existing engine to within a minute', () => {
  const lat = 51.5;
  const lon = -2.6;
  const date = new Date(Date.UTC(2026, 3, 15));
  const { solarNoonUT } = SolarPosition.getSunriseSunset(date, lat, lon);

  let bestMinute = null;
  let bestLength = Infinity;
  for (let minute = 0; minute < 1440; minute += 1) {
    const t = new Date(Date.UTC(2026, 3, 15, 0, minute));
    const sun = SolarPosition.getSunPosition(t, lat, lon);
    const length = ShadowGeometry.shadowLengthM(1, sun.altitude);
    if (length !== null && length < bestLength) {
      bestLength = length;
      bestMinute = minute;
    }
  }
  closeTo(bestMinute, solarNoonUT, 1, 'traced shadow-length minimum vs. engine solar noon');
});
