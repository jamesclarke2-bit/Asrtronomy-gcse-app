const test = require('node:test');
const assert = require('node:assert/strict');
const { getSunriseSunset, getSunPosition } = require('../src/solarPosition');

// London (51.507°N, 0.128°W). Reference times, in GMT/UT, are the
// published figures (timeanddate.com, BBC Sky at Night Magazine).
const LONDON = [51.5074, -0.1278];
const minutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const at = (iso) => getSunriseSunset(new Date(`${iso}T12:00Z`), ...LONDON);

test('London sunrise and sunset match published times to within 2 minutes', () => {
  const cases = [
    ['2025-12-21', '08:04', '15:53'],
    ['2026-06-21', '03:43', '20:21'],
  ];
  cases.forEach(([iso, rise, set]) => {
    const t = at(iso);
    assert.ok(Math.abs(t.sunriseUT - minutes(rise)) <= 2, `${iso} sunrise ${t.sunriseUT.toFixed(1)}`);
    assert.ok(Math.abs(t.sunsetUT - minutes(set)) <= 2, `${iso} sunset ${t.sunsetUT.toFixed(1)}`);
  });
  // The longest day is about 16 h 38 min.
  assert.ok(Math.abs(at('2026-06-21').dayLengthMinutes - (16 * 60 + 38)) <= 3);
});

test("London's earliest sunset (~12 Dec) and latest sunrise (~30 Dec) fall either side of the solstice", () => {
  let earliestSunset = null;
  let latestSunrise = null;
  for (let d = -40; d <= 40; d++) {
    const date = new Date(Date.UTC(2025, 11, 21 + d, 12));
    const t = getSunriseSunset(date, ...LONDON);
    if (!earliestSunset || t.sunsetUT < earliestSunset.t.sunsetUT) earliestSunset = { date, t };
    if (!latestSunrise || t.sunriseUT > latestSunrise.t.sunriseUT) latestSunrise = { date, t };
  }
  const dayOf = (x) => x.date.toISOString().slice(0, 10);
  assert.ok(['2025-12-11', '2025-12-12', '2025-12-13'].includes(dayOf(earliestSunset)), dayOf(earliestSunset));
  assert.ok(['2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01'].includes(dayOf(latestSunrise)), dayOf(latestSunrise));
  assert.ok(Math.abs(earliestSunset.t.sunsetUT - minutes('15:51')) <= 2);
  assert.ok(Math.abs(latestSunrise.t.sunriseUT - minutes('08:06')) <= 2);
});

test('the equinoxes have a little more than 12 hours of daylight', () => {
  const march = at('2026-03-20').dayLengthMinutes;
  assert.ok(march > 12 * 60 && march < 12 * 60 + 15, `${march}`);
});

test('solar noon shifts by 4 minutes per degree of longitude and by the equation of time', () => {
  const date = new Date('2026-02-11T12:00Z');
  const eot = getSunPosition(date, 0, 0).equationOfTime;
  const greenwich = getSunriseSunset(date, 51.5, 0);
  const bristol = getSunriseSunset(date, 51.5, -2.6);
  assert.ok(Math.abs(greenwich.solarNoonUT - (720 - eot)) < 0.2);
  assert.ok(Math.abs(bristol.solarNoonUT - greenwich.solarNoonUT - 10.4) < 0.2, 'Bristol ~10 min later');
});

test('midnight Sun and polar night inside the Arctic Circle', () => {
  const tromso = [69.65, 18.96];
  assert.equal(getSunriseSunset(new Date('2026-06-21T12:00Z'), ...tromso).polar, 'day');
  assert.equal(getSunriseSunset(new Date('2025-12-21T12:00Z'), ...tromso).polar, 'night');
  assert.equal(at('2026-06-21').polar, null);
});
