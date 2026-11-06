const test = require('node:test');
const assert = require('node:assert/strict');
const EclipticZodiac = require('../src/eclipticZodiac');
const SolarPosition = require('../src/solarPosition');
const PlanetaryMotion = require('../src/planetaryMotion');

const DEPS = { SolarPosition };

test('IAU_BOUNDARY_DATES names all thirteen ecliptic constellations, Ophiuchus included', () => {
  const names = EclipticZodiac.IAU_BOUNDARY_DATES.map((b) => b.name);
  assert.equal(names.length, 13);
  assert.equal(new Set(names).size, 13, 'no duplicate names');
  assert.ok(names.includes('Ophiuchus'));
  ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpius', 'Sagittarius', 'Capricornus', 'Aquarius', 'Pisces'].forEach((name) => {
    assert.ok(names.includes(name), `should include ${name}`);
  });
});

test('boundariesByLongitude: thirteen distinct longitudes, each 0-360 and sorted ascending', () => {
  const boundaries = EclipticZodiac.boundariesByLongitude(DEPS);
  assert.equal(boundaries.length, 13);
  boundaries.forEach((b) => {
    assert.ok(b.longitudeDeg >= 0 && b.longitudeDeg < 360);
  });
  for (let i = 1; i < boundaries.length; i += 1) {
    assert.ok(boundaries[i].longitudeDeg > boundaries[i - 1].longitudeDeg, 'boundaries should be strictly ascending');
  }
});

// --- The task's own four solstice/equinox checks ---------------------

const SOLSTICE_EQUINOX_2025 = [
  { label: 'March equinox', date: new Date(Date.UTC(2025, 2, 20, 12)), expected: ['Pisces'] },
  { label: 'June solstice', date: new Date(Date.UTC(2025, 5, 21, 12)), expected: ['Taurus', 'Gemini'] },
  { label: 'September equinox', date: new Date(Date.UTC(2025, 8, 22, 12)), expected: ['Virgo'] },
  { label: 'December solstice', date: new Date(Date.UTC(2025, 11, 21, 12)), expected: ['Sagittarius'] },
];

SOLSTICE_EQUINOX_2025.forEach(({ label, date, expected }) => {
  test(`sunConstellation: the Sun is in ${expected.join(' or ')} at the ${label}`, () => {
    const actual = EclipticZodiac.sunConstellation(date, DEPS);
    assert.ok(expected.includes(actual), `${label} (${date.toISOString().slice(0, 10)}): expected ${expected.join(' or ')}, got ${actual}`);
  });
});

test('midnightConstellation is always exactly opposite the Sun\'s own constellation, on the solstices and equinoxes and throughout the year', () => {
  const datesToCheck = SOLSTICE_EQUINOX_2025.map((s) => s.date);
  for (let day = 0; day < 365; day += 11) {
    datesToCheck.push(new Date(Date.UTC(2025, 0, 1, 12) + day * 86400000));
  }
  datesToCheck.forEach((date) => {
    const sunLongitude = SolarPosition.getSunPosition(date, 0, 0).apparentLongitude;
    const independentOpposite = EclipticZodiac.constellationForLongitude(sunLongitude + 180, DEPS);
    const midnight = EclipticZodiac.midnightConstellation(date, DEPS);
    assert.equal(midnight, independentOpposite, `${date.toISOString().slice(0, 10)}: midnight should match an independent +180° lookup`);
  });
});

test('midnightConstellation at the solstices/equinoxes matches the task\'s own expectation of "opposite"', () => {
  // March equinox -> Pisces, so midnight (opposite) should be Virgo;
  // September equinox -> Virgo, so midnight should be Pisces: the two
  // equinoxes are each other's opposite, the classic textbook check.
  const marchDate = SOLSTICE_EQUINOX_2025[0].date;
  const septDate = SOLSTICE_EQUINOX_2025[2].date;
  assert.equal(EclipticZodiac.midnightConstellation(marchDate, DEPS), 'Virgo');
  assert.equal(EclipticZodiac.midnightConstellation(septDate, DEPS), 'Pisces');
});

test('the Sun spends about 18 days in Ophiuchus, starting in late November', () => {
  let start = null;
  let end = null;
  let count = 0;
  for (let day = 0; day < 366; day += 1) {
    const date = new Date(Date.UTC(2025, 0, 1, 12) + day * 86400000);
    if (EclipticZodiac.sunConstellation(date, DEPS) === 'Ophiuchus') {
      if (start === null) start = date;
      end = date;
      count += 1;
    }
  }
  assert.ok(start, 'Ophiuchus should appear somewhere in the year');
  assert.ok(count >= 16 && count <= 20, `expected about 18 days in Ophiuchus, got ${count}`);
  assert.equal(start.getUTCMonth(), 10, 'should start in November');
  assert.ok(start.getUTCDate() >= 25, `should start in late November, got day ${start.getUTCDate()}`);
});

test('constellationForLongitude wraps correctly at 0/360 degrees (Sagittarius continues into the new year, before Capricornus)', () => {
  const dec31 = new Date(Date.UTC(2025, 11, 31, 12));
  const jan1 = new Date(Date.UTC(2025, 0, 1, 12));
  const jan19 = new Date(Date.UTC(2025, 0, 19, 12));
  const jan21 = new Date(Date.UTC(2025, 0, 21, 12));
  assert.equal(EclipticZodiac.sunConstellation(dec31, DEPS), 'Sagittarius');
  assert.equal(EclipticZodiac.sunConstellation(jan1, DEPS), 'Sagittarius');
  assert.equal(EclipticZodiac.sunConstellation(jan19, DEPS), 'Sagittarius');
  assert.equal(EclipticZodiac.sunConstellation(jan21, DEPS), 'Capricornus');
});

test('sunConstellation and midnightConstellation never return a name outside IAU_BOUNDARY_DATES, across a full year', () => {
  const validNames = new Set(EclipticZodiac.IAU_BOUNDARY_DATES.map((b) => b.name));
  for (let day = 0; day < 365; day += 7) {
    const date = new Date(Date.UTC(2025, 0, 1, 12) + day * 86400000);
    assert.ok(validNames.has(EclipticZodiac.sunConstellation(date, DEPS)));
    assert.ok(validNames.has(EclipticZodiac.midnightConstellation(date, DEPS)));
  }
});

// --- Astronomy (IAU, 13 names incl. Ophiuchus) vs astrology (equal 30°,
// 12 traditional signs) really are two different, independent systems ---

test('the IAU (astronomy) constellation differs from the traditional 30-degree (astrology) sign on at least some dates', () => {
  let anyDifferent = false;
  for (let day = 0; day < 365; day += 3) {
    const date = new Date(Date.UTC(2025, 0, 1, 12) + day * 86400000);
    const longitude = SolarPosition.getSunPosition(date, 0, 0).apparentLongitude;
    const astronomy = EclipticZodiac.sunConstellation(date, DEPS);
    const astrology = PlanetaryMotion.zodiacSignForLongitude(longitude);
    if (astronomy !== astrology) anyDifferent = true;
  }
  assert.ok(anyDifferent, 'the IAU and traditional systems should disagree on at least some dates (that is the whole point of the page)');
});

test('the astrology (equal-sign) system never says Ophiuchus — it is an astronomy-only, 13th constellation', () => {
  for (let day = 0; day < 365; day += 5) {
    const date = new Date(Date.UTC(2025, 0, 1, 12) + day * 86400000);
    const longitude = SolarPosition.getSunPosition(date, 0, 0).apparentLongitude;
    assert.notEqual(PlanetaryMotion.zodiacSignForLongitude(longitude), 'Ophiuchus');
  }
});
