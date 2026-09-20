const test = require('node:test');
const assert = require('node:assert/strict');
const { obliquityComponent, eccentricityComponent } = require('../src/eotComponents');

// Day indices (0-based, 2026) for the four cardinal points.
const MARCH_EQUINOX = 78; // ~21 March
const JUNE_SOLSTICE = 171; // ~21 June
const SEPT_EQUINOX = 263; // ~21 September
const DEC_SOLSTICE = 354; // ~21 December

test('the obliquity component is (near) zero at every solstice and equinox', () => {
  // The formula's own reference point (day 81) is a few days off the real
  // 2026 equinox/solstice dates, so "near zero" allows for that offset —
  // still small next to the ~10 min peak amplitude either side of it.
  [MARCH_EQUINOX, JUNE_SOLSTICE, SEPT_EQUINOX, DEC_SOLSTICE].forEach((day) => {
    assert.ok(Math.abs(obliquityComponent(day)) < 1, `day ${day}: ${obliquityComponent(day)}`);
  });
});

test('the two components sum to roughly the full approximate formula', () => {
  // Cross-check against the formula as literally stated on the page,
  // computed independently here rather than by calling the split functions.
  for (let day = 0; day < 365; day += 30) {
    const dayOfYear = day + 1;
    const B = (360 / 365) * (dayOfYear - 81);
    const toRad = (deg) => (deg * Math.PI) / 180;
    const expected = 9.87 * Math.sin(2 * toRad(B)) - 7.53 * Math.cos(toRad(B)) - 1.5 * Math.sin(toRad(B));
    const actual = obliquityComponent(day) + eccentricityComponent(day);
    assert.ok(Math.abs(actual - expected) < 0.01);
  }
});

test('orbital eccentricity dominates in mid-March', () => {
  const day = 75; // ~17 March
  assert.ok(Math.abs(eccentricityComponent(day)) > Math.abs(obliquityComponent(day)));
});

test('axial tilt dominates in mid-January', () => {
  const day = 15; // ~16 January
  assert.ok(Math.abs(obliquityComponent(day)) > Math.abs(eccentricityComponent(day)));
});
