const test = require('node:test');
const assert = require('node:assert/strict');
const TunnelAlignment = require('../src/tunnelAlignment');

const LATITUDE = 51.4;
const YEAR = 2026;
const BEARING = 77;

test('decimalDegrees: converts degrees and minutes of arc to decimal degrees', () => {
  assert.equal(TunnelAlignment.decimalDegrees(0, 30), 0.5);
  assert.equal(TunnelAlignment.decimalDegrees(0, 45), 0.75);
  assert.equal(TunnelAlignment.decimalDegrees(1, 0), 1);
  assert.ok(Math.abs(TunnelAlignment.decimalDegrees(77, 15) - 77.25) < 1e-9);
});

test('interpolate: reads the value halfway between two known points', () => {
  assert.equal(TunnelAlignment.interpolate(0, 80, 10, 90, 5), 85);
  assert.equal(TunnelAlignment.interpolate(0, 80, 10, 90, 0), 80);
  assert.equal(TunnelAlignment.interpolate(0, 80, 10, 90, 10), 90);
  assert.ok(Math.abs(TunnelAlignment.interpolate(0, 100, 4, 92, 1) - 98) < 1e-9);
});

test('sunsetAzimuthOnDay is 360 minus sunriseAzimuthOnDay, for every day', () => {
  for (const dayIndex of [0, 80, 172, 265, 300]) {
    const sunrise = TunnelAlignment.sunriseAzimuthOnDay(dayIndex, LATITUDE, YEAR);
    const sunset = TunnelAlignment.sunsetAzimuthOnDay(dayIndex, LATITUDE, YEAR);
    assert.ok(Math.abs(sunset - (360 - sunrise)) < 1e-9);
  }
});

test('yearSunriseAzimuths covers every day of the year, rising towards the June solstice', () => {
  const points = TunnelAlignment.yearSunriseAzimuths(LATITUDE, YEAR);
  assert.equal(points.length, TunnelAlignment.daysInYear(YEAR));
  // Near the June solstice the Sun rises furthest north of east: its
  // azimuth (measured clockwise from north) is at its smallest.
  const juneIndex = points.findIndex((p) => p.date.getUTCMonth() === 5 && p.date.getUTCDate() === 21);
  const marchIndex = points.findIndex((p) => p.date.getUTCMonth() === 2 && p.date.getUTCDate() === 21);
  assert.ok(points[juneIndex].azimuth < points[marchIndex].azimuth);
});

test('a tunnel at 77 degrees: the sunrise alignment occurs in exactly two windows a year (spring and autumn)', () => {
  const { sunrise } = TunnelAlignment.alignmentWindows(BEARING, LATITUDE, 0.5, YEAR);
  assert.equal(sunrise.length, 2, `expected 2 windows, got ${JSON.stringify(sunrise)}`);
  const months = sunrise.map((w) => TunnelAlignment.dayOfYearToUTCDate(w.startDay, YEAR).getUTCMonth());
  assert.ok(months[0] < 5, 'first window is in spring (before June)');
  assert.ok(months[1] > 7, 'second window is in autumn (after August)');
});

test('the same tunnel: the sunset alignment (through the far mouth) also occurs in exactly two windows a year', () => {
  const { sunset } = TunnelAlignment.alignmentWindows(BEARING, LATITUDE, 0.5, YEAR);
  assert.equal(sunset.length, 2, `expected 2 windows, got ${JSON.stringify(sunset)}`);
});

test('the sunrise and sunset alignment windows fall on different dates (four separate occasions a year, not two)', () => {
  const { sunrise, sunset } = TunnelAlignment.alignmentWindows(BEARING, LATITUDE, 0.5, YEAR);
  const sunriseDays = new Set(sunrise.flatMap((w) => [w.startDay, w.endDay]));
  sunset.forEach((w) => {
    assert.ok(!sunriseDays.has(w.startDay) && !sunriseDays.has(w.endDay), 'sunset window overlaps a sunrise window');
  });
});

test('widening the tolerance to 1.5 degrees (a wide tunnel) makes every window more than one day long', () => {
  const { sunrise, sunset } = TunnelAlignment.alignmentWindows(BEARING, LATITUDE, 1.5, YEAR);
  [...sunrise, ...sunset].forEach((w) => {
    assert.ok(w.dayCount > 1, `window ${JSON.stringify(w)} is only ${w.dayCount} day(s) long`);
  });
});

test('narrowing the tolerance to 0.5 degrees still gives at least one day per window', () => {
  const { sunrise, sunset } = TunnelAlignment.alignmentWindows(BEARING, LATITUDE, 0.5, YEAR);
  [...sunrise, ...sunset].forEach((w) => {
    assert.ok(w.dayCount >= 1, `window ${JSON.stringify(w)} has no days at all`);
  });
});

test('a bearing outside the range the Sun ever rises at (e.g. due south, 180 degrees) has no alignment windows', () => {
  const { sunrise, sunset } = TunnelAlignment.alignmentWindows(180, LATITUDE, 0.5, YEAR);
  assert.equal(sunrise.length, 0);
  assert.equal(sunset.length, 0);
});

test('angleDifferenceDeg handles wraparound correctly', () => {
  assert.equal(TunnelAlignment.angleDifferenceDeg(10, 350), 20);
  assert.equal(TunnelAlignment.angleDifferenceDeg(5, 5), 0);
  assert.equal(TunnelAlignment.angleDifferenceDeg(90, 270), 180);
});
