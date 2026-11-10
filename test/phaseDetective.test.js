const test = require('node:test');
const assert = require('node:assert/strict');
const PhaseDetective = require('../src/phaseDetective');
const MoonPhase = require('../src/moonPhase');

const LATITUDE = 51.5;
const LONGITUDE = 0;

function randomDates(count) {
  const dates = [];
  for (let i = 0; i < count; i += 1) {
    // Spread over a bit more than 4 years either side of a fixed epoch,
    // so every run covers a real mix of seasons and phases, not just
    // whatever happens to be "now".
    const offsetDays = (Math.random() - 0.5) * 365 * 8;
    dates.push(new Date(Date.UTC(2024, 0, 1, 12) + offsetDays * 86400000));
  }
  return dates;
}

test('PHASE_PRESETS has exactly the six named stops, in order, each a valid theta', () => {
  const keys = PhaseDetective.PHASE_PRESETS.map((p) => p.key);
  assert.deepEqual(keys, ['new', 'crescent', 'firstQuarter', 'gibbous', 'full', 'lastQuarter']);
  PhaseDetective.PHASE_PRESETS.forEach((p) => {
    assert.ok(p.theta >= 0 && p.theta < 360, `${p.key} has an out-of-range theta ${p.theta}`);
  });
});

test('lagHoursFromTheta: New Moon has no lag, First Quarter ~6h, Full Moon ~12h, Last Quarter ~18h', () => {
  assert.equal(PhaseDetective.lagHoursFromTheta(0), 0);
  assert.equal(PhaseDetective.lagHoursFromTheta(90), 6);
  assert.equal(PhaseDetective.lagHoursFromTheta(180), 12);
  assert.equal(PhaseDetective.lagHoursFromTheta(270), 18);
});

test('addLagHours wraps correctly past midnight', () => {
  assert.equal(PhaseDetective.addLagHours(23 * 60, 2), 60);
  assert.equal(PhaseDetective.addLagHours(0, 0), 0);
  assert.equal(PhaseDetective.addLagHours(6 * 60, 18), 0);
});

test('lagHoursFromTimes recovers the lag purely from two clock times, with wraparound', () => {
  assert.equal(PhaseDetective.lagHoursFromTimes(6 * 60, 12 * 60), 6);
  // Moonrise just after midnight, sunrise at 06:00 the same morning —
  // an 18-hour lag (Last Quarter-ish), not a negative one.
  assert.equal(PhaseDetective.lagHoursFromTimes(6 * 60, 0), 18);
});

test('formatClock pads to HH:MM and wraps 24:00 to 00:00', () => {
  assert.equal(PhaseDetective.formatClock(5 * 60 + 15), '05:15');
  assert.equal(PhaseDetective.formatClock(0), '00:00');
  assert.equal(PhaseDetective.formatClock(1440), '00:00');
  assert.equal(PhaseDetective.formatClock(-30), '23:30');
});

test('the phase read from the times matches MoonPhase\'s own phaseName, for 20 random dates', () => {
  const dates = randomDates(20);
  dates.forEach((date) => {
    const times = PhaseDetective.riseSetTimesForDate(date, LATITUDE, LONGITUDE);
    const lagFromTable = PhaseDetective.lagHoursFromTimes(times.sunriseMinutes, times.moonriseMinutes);
    const readPhase = PhaseDetective.phaseNameFromLagHours(lagFromTable);
    const enginePhase = MoonPhase.phaseName(times.theta);
    assert.equal(readPhase, enginePhase, `date ${date.toISOString()}: read "${readPhase}" but engine says "${enginePhase}"`);
  });
});

test('the lag-to-age estimate is within 2 days of the real age, for 20 random dates', () => {
  const dates = randomDates(20);
  dates.forEach((date) => {
    const times = PhaseDetective.riseSetTimesForDate(date, LATITUDE, LONGITUDE);
    const estimatedAge = PhaseDetective.estimatedAgeDaysFromLagHours(times.lagHours);
    const diff = Math.abs(estimatedAge - times.ageDays);
    assert.ok(diff <= 2, `date ${date.toISOString()}: estimated age ${estimatedAge.toFixed(2)}d vs real ${times.ageDays.toFixed(2)}d, diff ${diff.toFixed(2)}d`);
  });
});

test('distanceFromNewMoonDeg is 0 at New Moon, 180 at Full Moon, and symmetric either side of New', () => {
  assert.equal(PhaseDetective.distanceFromNewMoonDeg(0), 0);
  assert.equal(PhaseDetective.distanceFromNewMoonDeg(180), 180);
  assert.ok(Math.abs(PhaseDetective.distanceFromNewMoonDeg(10) - PhaseDetective.distanceFromNewMoonDeg(350)) < 1e-9);
});

test('riseSetTimesForDate: moonrise lags sunrise, and moonset lags sunset, by the same amount', () => {
  const times = PhaseDetective.riseSetTimesForDate(new Date('2026-04-01T12:00:00Z'), LATITUDE, LONGITUDE);
  const sunriseLag = PhaseDetective.wrapMinutes(times.moonriseMinutes - times.sunriseMinutes);
  const sunsetLag = PhaseDetective.wrapMinutes(times.moonsetMinutes - times.sunsetMinutes);
  assert.ok(Math.abs(sunriseLag - sunsetLag) < 1e-6);
});
