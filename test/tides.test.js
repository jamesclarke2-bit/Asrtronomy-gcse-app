const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/tides');
const MoonPhase = require('../src/moonPhase');

test("the Sun's tidal effect is ~0.46 of the Moon's, though its overall pull is ~180 times stronger", () => {
  assert.equal(T.TIDE_RATIO.toFixed(2), '0.46');
  assert.equal(Math.round(T.sunToMoonPullRatio() / 10) * 10, 180);
});

test('each body raises two bulges: highest facing it and opposite it, lowest at right angles', () => {
  assert.equal(T.bulge(0), 1);
  assert.ok(Math.abs(T.bulge(180) - 1) < 1e-12);
  assert.ok(Math.abs(T.bulge(90) + 0.5) < 1e-12);
});

test('a place turning with Earth passes two high and two low tides in a lunar day, at any phase', () => {
  [0, 30, 90, 135, 180, 270].forEach((elongation) => {
    let highs = 0;
    let lows = 0;
    const h = (a) => T.waterHeight(a, elongation);
    for (let a = 0; a < 360; a += 0.5) {
      if (h(a) > h(a - 0.5) && h(a) >= h(a + 0.5)) highs++;
      if (h(a) < h(a - 0.5) && h(a) <= h(a + 0.5)) lows++;
    }
    assert.equal(highs, 2, `highs at elongation ${elongation}`);
    assert.equal(lows, 2, `lows at elongation ${elongation}`);
  });
  assert.equal(Math.round(T.LUNAR_DAY_HOURS * 60), 24 * 60 + 50);
});

test('spring tides at new and full Moon have the largest range; neap tides at the quarters the smallest', () => {
  assert.ok(Math.abs(T.rangeFraction(0) - 1) < 1e-12);
  assert.ok(Math.abs(T.rangeFraction(180) - 1) < 1e-12);
  const neap = T.rangeFraction(90);
  assert.ok(Math.abs(T.rangeFraction(270) - neap) < 1e-12);
  for (let e = 0; e <= 360; e += 5) {
    assert.ok(T.rangeFraction(e) <= 1 + 1e-12 && T.rangeFraction(e) >= neap - 1e-12);
  }
  assert.equal(T.springToNeapRatio().toFixed(1), '2.7');
  assert.ok(Math.abs(1 / neap - T.springToNeapRatio()) < 1e-12);
});

test('tide types follow the phase', () => {
  assert.equal(T.tideType(0), 'spring');
  assert.equal(T.tideType(180), 'spring');
  assert.equal(T.tideType(355), 'spring');
  assert.equal(T.tideType(90), 'neap');
  assert.equal(T.tideType(270), 'neap');
  assert.equal(T.tideType(45), 'towards-neap');
  assert.equal(T.tideType(135), 'towards-spring');
});

test('real April 2024 phases give the right tides, via the Moon Phases model', () => {
  // Real times (UTC): new Moon 8 Apr 18:21, first quarter 15 Apr 19:13,
  // full Moon 23 Apr 23:49, last quarter 1 May 11:27.
  const cases = [
    ['2024-04-08T18:21Z', 'spring'],
    ['2024-04-15T19:13Z', 'neap'],
    ['2024-04-23T23:49Z', 'spring'],
    ['2024-05-01T11:27Z', 'neap'],
  ];
  cases.forEach(([iso, expected]) => {
    assert.equal(T.tideType(MoonPhase.getMoonPhase(new Date(iso)).theta), expected, iso);
  });
});

test('the next spring and neap tides are the next new/full Moon and the next quarter', () => {
  const S = MoonPhase.SYNODIC_MONTH_DAYS;
  const atNew = T.nextSpringAndNeap(0, S);
  assert.ok(Math.abs(atNew.springInDays - S / 2) < 1e-9, 'from new Moon, next spring is at full Moon');
  assert.ok(Math.abs(atNew.neapInDays - S / 4) < 1e-9);
  const mid = T.nextSpringAndNeap(S * 0.6, S);
  assert.ok(Math.abs(mid.neapInDays - S * 0.15) < 1e-9, 'last quarter');
  assert.ok(Math.abs(mid.springInDays - S * 0.4) < 1e-9, 'next new Moon');
  // First quarter 15 Apr 2024 -> next spring tides at the 23 Apr full Moon.
  const phase = MoonPhase.getMoonPhase(new Date('2024-04-15T12:00Z'));
  const spring = new Date(Date.parse('2024-04-15T12:00Z') + T.nextSpringAndNeap(phase.ageDays, S).springInDays * 86400000);
  assert.equal(spring.toISOString().slice(0, 10), '2024-04-23');
});
