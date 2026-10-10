const test = require('node:test');
const assert = require('node:assert/strict');
const TidalHeatingDiagram = require('../src/tidalHeatingDiagram');

test('a circular orbit (eccentricity 0) has no heating variation at all', () => {
  [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((nu) => {
    assert.equal(TidalHeatingDiagram.heatingFraction(nu, 0), 0);
  });
});

test('heatingFraction is 1 at periapsis and 0 at apoapsis, for any eccentricity', () => {
  [0.1, 0.2, 0.3, 0.5].forEach((e) => {
    assert.ok(Math.abs(TidalHeatingDiagram.heatingFraction(0, e) - 1) < 1e-9, `e=${e} periapsis`);
    assert.ok(Math.abs(TidalHeatingDiagram.heatingFraction(Math.PI, e) - 0) < 1e-9, `e=${e} apoapsis`);
  });
});

test('heatingFraction only ever falls as true anomaly moves from periapsis to apoapsis', () => {
  const e = 0.3;
  const samples = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI].map((nu) => TidalHeatingDiagram.heatingFraction(nu, e));
  for (let i = 1; i < samples.length; i += 1) {
    assert.ok(samples[i] <= samples[i - 1], `expected heating to fall monotonically, got ${samples}`);
  }
});

test('heatingFraction stays within [0, 1] for a range of eccentricities and angles', () => {
  [0.05, 0.1, 0.3, 0.5, 0.8].forEach((e) => {
    for (let nu = 0; nu < 2 * Math.PI; nu += 0.3) {
      const h = TidalHeatingDiagram.heatingFraction(nu, e);
      assert.ok(h >= -1e-9 && h <= 1 + 1e-9, `e=${e} nu=${nu}: heating ${h} out of [0,1]`);
    }
  });
});

test('distanceAt matches periapsis/apoapsis distance = a(1 ∓ e) at nu = 0 and PI', () => {
  [0.1, 0.3, 0.5].forEach((e) => {
    assert.ok(Math.abs(TidalHeatingDiagram.distanceAt(0, e) - (1 - e)) < 1e-9);
    assert.ok(Math.abs(TidalHeatingDiagram.distanceAt(Math.PI, e) - (1 + e)) < 1e-9);
  });
});

test('a bigger eccentricity flexes Io more at closest approach but not at the far side', () => {
  // The "far side" (apoapsis) is pinned at 0 for every eccentricity by
  // construction; the interesting comparison is everywhere else.
  const quarterOrbit = Math.PI / 2;
  const small = TidalHeatingDiagram.heatingFraction(quarterOrbit, 0.1);
  const large = TidalHeatingDiagram.heatingFraction(quarterOrbit, 0.4);
  assert.ok(large > small, `expected a larger eccentricity to heat more away from the extremes, got ${small} vs ${large}`);
});
