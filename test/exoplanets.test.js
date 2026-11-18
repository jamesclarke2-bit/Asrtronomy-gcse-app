const test = require('node:test');
const assert = require('node:assert/strict');
const X = require('../src/exoplanets');
const H = require('../src/hrDiagram');

test('transit: no dip outside the disc, and the deepest dip is the planet-to-star area ratio', () => {
  X.PLANETS.forEach((p) => {
    assert.equal(X.transitBrightness(0, p.radius), 1, p.key);
    assert.equal(X.transitBrightness(1, p.radius), 1, p.key);
    const mid = 100 * (1 - X.transitBrightness(0.5, p.radius));
    assert.ok(Math.abs(mid - X.transitDepthPercent(p.radius)) < 1e-9, p.key);
    for (let k = 0; k <= 1000; k += 1) {
      const b = X.transitBrightness(k / 1000, p.radius);
      assert.ok(b >= 1 - p.radius ** 2 - 1e-12 && b <= 1, `${p.key} at ${k}`);
    }
  });
  assert.ok(Math.abs(X.transitDepthPercent(0.1) - 1) < 1e-12, 'a Jupiter-sized planet blocks 1%');
  assert.ok(X.transitDepthPercent(X.PLANETS[0].radius) < 0.01, 'an Earth-sized one blocks less than 0.01%');
});

test('the overlap area is exact at the limits', () => {
  assert.equal(X.overlapArea(2, 0.1), 0);
  assert.ok(Math.abs(X.overlapArea(0.5, 0.1) - Math.PI * 0.01) < 1e-12);
  assert.ok(X.overlapArea(1, 0.1) > 0 && X.overlapArea(1, 0.1) < Math.PI * 0.01);
});

test('radial velocity: away (red), towards (blue) and across (no shift) over one orbit', () => {
  assert.equal(X.lineShiftWord(X.starMotion(0.25, 'jupiter').awayMs), 'red');
  assert.equal(X.lineShiftWord(X.starMotion(0.75, 'jupiter').awayMs), 'blue');
  assert.equal(X.lineShiftWord(0), 'none');
  assert.ok(Math.abs(X.starMotion(0.25, 'jupiter').awayMs - 12.5) < 1e-9);
  assert.deepEqual(X.METHODS.map((m) => m.key), ['transit', 'astrometry', 'radial-velocity']);
});

test('habitable zone: about 0.95 to 1.67 AU for the Sun, and further out for hotter stars', () => {
  const sun = X.habitableZone(X.SUN_T);
  assert.ok(Math.abs(sun.innerAU - 0.95) < 0.01 && Math.abs(sun.outerAU - 1.67) < 0.02);
  assert.equal(X.starLuminosity(5800), H.luminosityFromMagnitude(H.mainSequenceMagnitude(5800)));
  let last = 0;
  for (let T = X.STAR_T_MIN; T <= X.STAR_T_MAX; T += 500) {
    const z = X.habitableZone(T);
    assert.ok(z.innerAU > last, `zone moves out at ${T} K`);
    last = z.innerAU;
  }
  assert.equal(X.zoneVerdict(1, 5800), 'in the zone');
  assert.equal(X.zoneVerdict(0.4, 5800), 'too hot');
  assert.equal(X.zoneVerdict(3, 5800), 'too cold');
});

test('Drake equation: seven factors in order, presets spanning far below one to hundreds of millions', () => {
  assert.deepEqual(X.DRAKE_FACTORS.map((f) => f.symbol), ['R*', 'fp', 'ne', 'fl', 'fi', 'fc', 'L']);
  const n = (k) => X.drakeN(X.drakeValues(X.DRAKE_PRESETS[k]));
  assert.ok(n('low') < 1e-6);
  assert.ok(Math.abs(n('middle') - 10) < 1e-9);
  assert.ok(n('high') > 1e8);
  const steps = X.drakeSteps(X.drakeValues(X.DRAKE_PRESETS.middle));
  assert.equal(steps.length, 7);
  assert.equal(steps[0].running, 2);
  Object.values(X.DRAKE_PRESETS).forEach((p) => X.DRAKE_FACTORS.forEach((f) => assert.ok(Number.isInteger(p[f.key]) && p[f.key] >= 0 && p[f.key] < f.choices.length)));
});

test('SETI: a reply takes twice the distance in light-years', () => {
  assert.equal(X.replyYears(100), 200);
});
