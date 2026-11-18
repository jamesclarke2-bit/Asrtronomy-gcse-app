const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/longitude');
const SpecData = require('../src/specData');

test('longitude is a time difference: 15° an hour, 1° every 4 minutes, west when Greenwich is later', () => {
  assert.equal(L.DEG_PER_HOUR, 360 / 24);
  assert.equal(L.MIN_PER_DEG, 4);
  assert.deepEqual(L.longitudeFromNoon(14 * 60), { degrees: 30, direction: 'W', diffMinutes: 120 });
  assert.deepEqual(L.longitudeFromNoon(9 * 60), { degrees: 45, direction: 'E', diffMinutes: -180 });
  assert.equal(L.longitudeFromNoon(720).direction, '');
  for (const lon of [-90, -35.5, 0, 12, 90]) {
    const r = L.longitudeFromNoon(L.noonGreenwichMinutes(lon));
    assert.ok(Math.abs(r.degrees - Math.abs(lon)) < 1e-9, `round trip ${lon}`);
    if (lon) assert.equal(r.direction, lon > 0 ? 'E' : 'W');
  }
  assert.equal(L.formatClock(860), '14:20');
  assert.equal(L.formatClock(-60), '23:00');
});

test('kilometres per degree at the equator come from the data sheet diameter', () => {
  assert.equal(L.EARTH_DIAMETER_KM, SpecData.CONSTANTS.meanDiameterKm.earth);
  assert.ok(Math.abs(L.KM_PER_DEG_EQUATOR - (Math.PI * 13000) / 360) < 1e-9);
});

test('lunar distance: the Moon moves half a degree an hour; the table turns an angle into Greenwich time', () => {
  assert.equal(L.MOON_DEG_PER_HOUR, 0.5);
  assert.deepEqual(L.lunarTable().map((r) => r.distanceDeg), [40, 38.5, 37, 35.5, 34]);
  for (const h of [0, 2.5, 7, 12]) assert.equal(L.greenwichFromLunarDistance(L.lunarDistance(h)), h);
  assert.equal(L.longitudeErrorFromAngleError(1), 0.5, '1 arcminute: 2 minutes of time, half a degree');
});

test('clocks at sea: every 4 minutes out is 1° out; H4 stays within the half-degree prize limit', () => {
  assert.equal(L.clockErrorMinutes('ordinary', 42), 42);
  assert.equal(L.longitudeErrorDeg(4), 1);
  assert.ok(Math.abs(L.clockErrorMinutes('h4', 81) * 60 - 5) < 1e-9, 'H4: about 5 seconds in 81 days');
  assert.ok(L.longitudeErrorDeg(L.clockErrorMinutes('h4', 60)) < L.PRIZE_DEGREES);
  assert.ok(L.longitudeErrorDeg(L.clockErrorMinutes('ordinary', 3)) > L.PRIZE_DEGREES, 'an ordinary clock fails within days');
});
