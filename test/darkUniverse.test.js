const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../src/darkUniverse');
const MilkyWay = require('../src/milkyWay');

test('the rotation curve is flat at Our Galaxy\'s 220 km/s, and the Sun sits at its distance', () => {
  assert.equal(U.FLAT_KMS, MilkyWay.ROTATION_KMS);
  assert.equal(U.FLAT_KMS, 220);
  assert.equal(U.SUN_KLY, MilkyWay.SUN_FROM_CENTRE_KLY);
  for (const r of [20, 26, 40, 60]) assert.ok(Math.abs(U.measuredSpeed(r) - 220) < 2, `flat at ${r}`);
  assert.ok(U.measuredSpeed(1) < 100, 'rises from near zero at the centre');
});

test('the visible-matter curve peaks below the measured one and then falls away', () => {
  const peak = Math.max(...Array.from({ length: 600 }, (_, i) => U.visibleSpeed(i / 10)));
  assert.ok(peak <= 220 && peak > 180, `peak ${peak}`);
  assert.ok(U.visibleSpeed(20) > U.visibleSpeed(40));
  assert.ok(U.visibleSpeed(40) > U.visibleSpeed(60));
  assert.ok(U.measuredSpeed(40) - U.visibleSpeed(40) > 50, 'a big gap far out');
});

test('the make-up adds to 100%, dark energy biggest and ordinary matter smallest', () => {
  assert.equal(U.MAKE_UP.reduce((s, p) => s + p.percent, 0), 100);
  assert.deepEqual(U.MAKE_UP.map((p) => p.percent), [5, 27, 68]);
});

test('every future model starts at its own Big Bang and passes through today at size 1', () => {
  for (const f of U.FUTURES) {
    const c = U.futureCurve(f.key);
    assert.equal(c[0].a, 0, f.key);
    assert.ok(c[0].tGyr < -5 && c[0].tGyr > -16, `${f.key} began ${c[0].tGyr}`);
    const now = c.find((p) => p.tGyr === 0);
    assert.equal(now.a, 1, f.key);
  }
});

test('the four futures: collapse, slowing, for ever, speeding up', () => {
  const end = (k) => U.futureCurve(k).slice(-1)[0];
  assert.equal(end('crunch').a, 0, 'the crunch model collapses');
  assert.ok(end('crunch').tGyr > 30 && end('crunch').tGyr < 45);
  assert.ok(end('stop').a > 1 && end('stop').a < end('forever').a);
  assert.ok(end('forever').a < end('speeding').a);
  ['crunch', 'stop', 'forever'].forEach((k) => assert.equal(U.todayTrend(k), 'slowing'));
  assert.equal(U.todayTrend('speeding'), 'speeding up');
  assert.equal(U.FAVOURED, 'speeding');
});

test('the favoured model\'s age is close to the Hubble-time estimate', () => {
  const age = -U.futureCurve('speeding')[0].tGyr;
  assert.ok(Math.abs(age - U.HUBBLE_TIME_GYR) / U.HUBBLE_TIME_GYR < 0.1, `age ${age}`);
});
