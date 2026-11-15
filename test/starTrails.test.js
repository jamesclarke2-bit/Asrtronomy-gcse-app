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
  // The day's uncertainty is half the range of the days from the extreme angles.
  assert.ok(Math.abs(long.dayUncertaintyMin - (S.siderealDayFrom(59.5, 240) - S.siderealDayFrom(60.5, 240)) / 2) < 1e-9);
});
