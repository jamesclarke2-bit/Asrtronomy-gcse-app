const test = require('node:test');
const assert = require('node:assert/strict');
const DayAndNight = require('../src/dayAndNight');
const PlanetaryMotion = require('../src/planetaryMotion');

const DEPS = { PlanetaryMotion };

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

// Independent re-derivation (not a call into src/dayAndNight.js's own
// function) of the midnight-visible ecliptic longitude: the direction
// from Earth to the Sun, plus 180 degrees (the opposite direction,
// which is what's overhead at local midnight).
function independentMidnightLongitude(date) {
  const earth = PlanetaryMotion.heliocentricPosition('earth', date);
  const sunDirectionFromEarth = Math.atan2(-earth.y, -earth.x) * (180 / Math.PI);
  return normalizeDeg(sunDirectionFromEarth + 180);
}

test('midnightEclipticLongitudeDeg matches an independent Sun-direction-plus-180 calculation', () => {
  const dates = [
    new Date(Date.UTC(2024, 0, 15)),
    new Date(Date.UTC(2024, 3, 15)),
    new Date(Date.UTC(2024, 6, 15)),
    new Date(Date.UTC(2024, 9, 15)),
    new Date(Date.UTC(2026, 11, 1)),
  ];
  dates.forEach((date) => {
    const fromModule = DayAndNight.midnightEclipticLongitudeDeg(date, DEPS);
    const independent = independentMidnightLongitude(date);
    assert.ok(Math.abs(fromModule - independent) < 1e-6, `${date.toISOString()}: ${fromModule} vs ${independent}`);
  });
});

test('midnightEclipticLongitudeDeg equals Earth\'s own heliocentric longitude (the direct relationship the module relies on)', () => {
  const date = new Date(Date.UTC(2025, 5, 20));
  assert.equal(DayAndNight.midnightEclipticLongitudeDeg(date, DEPS), PlanetaryMotion.heliocentricLongitude('earth', date));
});

test('zodiacVisibleAtMidnight returns a real entry from PlanetaryMotion.ZODIAC_SIGNS', () => {
  const date = new Date(Date.UTC(2026, 6, 1));
  const sign = DayAndNight.zodiacVisibleAtMidnight(date, DEPS);
  assert.ok(PlanetaryMotion.ZODIAC_SIGNS.includes(sign), `"${sign}" should be one of the twelve zodiac signs`);
});

test('zodiacVisibleAtMidnight progresses through all twelve signs once across a year, in zodiac order', () => {
  const seen = [];
  for (let month = 0; month < 12; month += 1) {
    const date = DayAndNight.dateForMonth(month, 2026);
    const sign = DayAndNight.zodiacVisibleAtMidnight(date, DEPS);
    if (seen[seen.length - 1] !== sign) seen.push(sign);
  }
  // 12 or 13 distinct signs in sequence (13 only if a sign-boundary
  // crossing lands twice within the same calendar month in two
  // different places — the equal-30-degree model makes this rare but
  // not impossible); every one must still be in strict ZODIAC_SIGNS
  // cyclic order, wrapping at most once.
  assert.ok(seen.length >= 12, `expected at least 12 distinct signs across the year, got ${seen.length}: ${seen.join(', ')}`);
  const startIndex = PlanetaryMotion.ZODIAC_SIGNS.indexOf(seen[0]);
  assert.ok(startIndex >= 0);
  for (let i = 1; i < seen.length; i += 1) {
    const expectedIndex = (startIndex + i) % 12;
    assert.equal(seen[i], PlanetaryMotion.ZODIAC_SIGNS[expectedIndex], `sign ${i} out of cyclic order: ${seen.join(', ')}`);
  }
});

test('zodiacVisibleAtMidnight: six months apart gives the opposite zodiac sign (roughly, allowing for a sign-boundary month)', () => {
  const juneSign = DayAndNight.zodiacVisibleAtMidnight(DayAndNight.dateForMonth(5, 2026), DEPS);
  const decemberSign = DayAndNight.zodiacVisibleAtMidnight(DayAndNight.dateForMonth(11, 2026), DEPS);
  const juneIndex = PlanetaryMotion.ZODIAC_SIGNS.indexOf(juneSign);
  const decemberIndex = PlanetaryMotion.ZODIAC_SIGNS.indexOf(decemberSign);
  const diff = Math.abs(juneIndex - decemberIndex);
  assert.ok(diff === 6 || diff === 5 || diff === 7, `expected roughly opposite signs six months apart, got ${juneSign} (${juneIndex}) and ${decemberSign} (${decemberIndex})`);
});

test('dateForMonth: builds a UTC date on the 15th of the given month', () => {
  const date = DayAndNight.dateForMonth(2, 2026); // March, 0-indexed
  assert.equal(date.getUTCFullYear(), 2026);
  assert.equal(date.getUTCMonth(), 2);
  assert.equal(date.getUTCDate(), 15);
});

test('MONTH_NAMES has exactly twelve names, January first', () => {
  assert.equal(DayAndNight.MONTH_NAMES.length, 12);
  assert.equal(DayAndNight.MONTH_NAMES[0], 'January');
  assert.equal(DayAndNight.MONTH_NAMES[11], 'December');
});
