const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/starTrails');
const SpecData = require('../src/specData');

test('the trails turn at the data sheet sidereal day: 360° in 23 h 56 min', () => {
  assert.deepEqual(SpecData.CONSTANTS.siderealDay, { hours: 23, minutes: 56 });
  assert.equal(S.SIDEREAL_DAY_MIN, 1436);
  assert.equal(S.SOLAR_DAY_MIN, 1440);
  assert.ok(Math.abs(S.arcAngleDeg(1436) - 360) < 1e-9);
  assert.ok(Math.abs(S.arcAngleDeg(120) - 30.08) < 0.01);
});

test('sidereal day = (360 ÷ θ) × t, and it recovers the sidereal day from a true arc', () => {
  assert.equal(S.siderealDayFrom(30, 120), 1440);
  assert.ok(Math.abs(S.siderealDayFrom(S.arcAngleDeg(240), 240) - 1436) < 1e-9);
  assert.ok(Math.abs(S.siderealDayFrom(60.2, 4) - 23.92) < 0.005, 'works in hours too');
  assert.equal(S.hoursAndMinutes(1436), '23 h 56 min');
});

test('simulated readings sit within the spread of the true angle, read to the nearest 0.5°', () => {
  for (const t of [30, 120, 240]) {
    const truth = S.arcAngleDeg(t);
    S.readings(t, { seed: 3 }).forEach((r) => {
      assert.ok(Math.abs(r - truth) <= 1.25, `${t}: ${r}`);
      assert.equal(r * 2, Math.round(r * 2));
    });
  }
  assert.deepEqual(S.readings(30, { seed: 5 }), S.readings(30, { seed: 5 }), 'the same seed gives the same readings');
  // Readings never all agree, and with the same seed the long exposure always has the smaller percentage uncertainty.
  for (let seed = 1; seed <= 300; seed += 1) {
    const short = S.stats(S.readings(30, { seed, anomaly: { index: 3, offsetDeg: 5 } }));
    const long = S.stats(S.readings(240, { seed }));
    assert.ok(short.range > 0 && long.range > 0, `seed ${seed}`);
    assert.ok(long.percent < short.percent, `seed ${seed}: ${long.percent} < ${short.percent}`);
  }
});

test('an anomalous reading is spotted and left out; the uncertainty is half the range of the rest', () => {
  const s = S.stats([30.0, 30.5, 29.5, 34.0, 30.0]);
  assert.deepEqual(s.anomalies, [3]);
  assert.deepEqual(s.kept, [30.0, 30.5, 29.5, 30.0]);
  assert.equal(s.range, 1);
  assert.equal(s.uncertainty, 0.5);
  assert.equal(s.mean, 30);
  const r = S.result(S.readings(30, { seed: 7, anomaly: { index: 3, offsetDeg: 5 } }), 30);
  assert.deepEqual(r.anomalies, [3]);
});

test('the same reading spread on a longer exposure gives a smaller percentage uncertainty', () => {
  const same = [-0.5, 0, 0.5, 0, 0.5];
  const shortVals = same.map((d) => 7.5 + d);
  const longVals = same.map((d) => 60 + d);
  const short = S.result(shortVals, 30);
  const long = S.result(longVals, 240);
  assert.equal(short.uncertainty, long.uncertainty, 'same reading spread');
  assert.ok(long.percent < short.percent / 5, `${long.percent} vs ${short.percent}`);
  assert.ok(long.dayUncertaintyMin < short.dayUncertaintyMin);
  // The day's uncertainty is half the range of the days from the shown mean ± its shown uncertainty.
  assert.ok(Math.abs(long.dayUncertaintyMin - (S.siderealDayFrom(long.mean - long.uncertainty, 240) - S.siderealDayFrom(long.mean + long.uncertainty, 240)) / 2) < 1e-9);
});

test("the mean and uncertainty are given to the readings' 1 decimal place, and the day comes from those shown values", () => {
  const r = S.result([7.5, 7.5, 7, 12, 7.5], 30);
  assert.deepEqual(r.anomalies, [3]);
  assert.equal(r.mean, 7.4, 'shown as 7.4, not 7.38 or 7.375');
  assert.equal(r.uncertainty, 0.3, 'half of 0.5° is quoted as 0.3°, not 0.25°');
  assert.equal(r.percent.toFixed(1), '4.1', '0.3 ÷ 7.4');
  assert.equal(r.dayMin, (360 / 7.4) * 30);
  assert.equal(Math.round(r.dayMin), 1459);
  assert.equal(Math.round(r.shortestMin), 1403, '(360 ÷ 7.7) × 30');
  assert.equal(Math.round(r.longestMin), 1521, '(360 ÷ 7.1) × 30');
  assert.equal(Math.round(r.dayUncertaintyMin), 59);
  const l = S.result([60, 60.5, 59.5, 59.5, 60], 240);
  assert.equal(l.mean, 59.9);
  assert.equal(l.uncertainty, 0.5);
  assert.equal(l.percent.toFixed(1), '0.8');
  assert.equal(Math.round(l.dayMin), 1442);
  assert.equal(Math.round(l.shortestMin), 1430, '(360 ÷ 60.4) × 240');
  assert.equal(Math.round(l.longestMin), 1455, '(360 ÷ 59.4) × 240');
  assert.equal(Math.round(l.dayUncertaintyMin), 12);
});

test('for any set of readings, the half-range uncertainty and the mean have no more decimal places than the readings', () => {
  const dp = (x) => (String(x).split('.')[1] || '').length;
  for (let seed = 1; seed <= 200; seed += 1) {
    for (const [t, anomaly] of [[30, { index: 3, offsetDeg: 5 }], [240, null], [120, null]]) {
      const values = S.readings(t, { seed, anomaly });
      const readingDp = Math.max(1, ...values.map(dp));
      const r = S.stats(values);
      assert.ok(dp(r.uncertainty) <= readingDp, `seed ${seed}, t ${t}: ±${r.uncertainty} from ${values}`);
      assert.ok(dp(r.mean) <= readingDp, `seed ${seed}, t ${t}: mean ${r.mean} from ${values}`);
    }
  }
  assert.equal(S.toReadingPrecision(0.25), 0.3);
  assert.equal(S.toReadingPrecision(0.75), 0.8);
  assert.equal(S.toReadingPrecision(7.375), 7.4);
});

test('a 240-minute exposure cannot separate the sidereal and solar days, and even a whole night (720 min) only just reaches the gap', () => {
  const part = S.dayRange(240, 0.5);
  assert.ok(part.shortestMin < S.SIDEREAL_DAY_MIN && part.longestMin > S.SOLAR_DAY_MIN, 'holds both');
  assert.equal(S.separatesFromSolar(part), false);
  const night = S.dayRange(720, 0.5);
  assert.ok(Math.abs(night.thetaDeg - 180.5) < 0.01);
  assert.ok(S.SOLAR_DAY_MIN - night.longestMin < 0.1, 'stops only a whisker short of the solar day');
  assert.equal(S.siderealDayFrom(180, 720), S.SOLAR_DAY_MIN, 'a reading of exactly 180.0° gives the solar day');
  assert.equal(S.separatesFromSolar(night), false, 'too thin to claim');
});

test('timing the meridian over 30 nights: a 2-hour shift, far bigger than its uncertainty, separates the days clearly', () => {
  const m = S.meridianMethod(30, 1);
  assert.equal(m.perNightMin, 4);
  assert.equal(m.shiftMin, 120);
  assert.equal(m.shiftUncertaintyMin, 2, 'half the range of 118 to 122 min');
  assert.equal(m.dayMin, S.SIDEREAL_DAY_MIN);
  assert.ok(m.dayUncertaintyMin < 0.1);
  assert.ok(S.SOLAR_DAY_MIN - (m.dayMin + m.dayUncertaintyMin) > 3, 'far from the solar day');
  // The longer measurement, not repeats, shrinks the percentage uncertainty.
  assert.equal(S.meridianMethod(1, 1).shiftPercent, 50);
  assert.ok(m.shiftPercent < 2);
});
