const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/gravityBodies');
const SpecData = require('../src/specData');

test('regular motion: the inner planets carry the data sheet periods', () => {
  G.INNER_PLANETS.forEach((p) => {
    const sheet = SpecData.PLANETARY_DATA.find((x) => x.name === p.name);
    assert.equal(p.periodYears, sheet.periodYears, p.name);
    assert.equal(p.distanceAU, sheet.distanceAU, p.name);
  });
  assert.deepEqual(G.INNER_PLANETS.map((p) => p.name), ['Mercury', 'Venus', 'Earth', 'Mars']);
});

test('five Lagrange points, L4 and L5 60 degrees ahead and behind', () => {
  assert.deepEqual(G.LAGRANGE_POINTS.map((p) => p.id), ['L1', 'L2', 'L3', 'L4', 'L5']);
  assert.equal(G.LAGRANGE_DRAWING.L4.angleDeg, 60);
  assert.equal(G.LAGRANGE_DRAWING.L5.angleDeg, -60);
  assert.ok(G.LAGRANGE_DRAWING.L1.r < 1 && G.LAGRANGE_DRAWING.L2.r > 1);
  assert.equal(G.L1_L2_FROM_EARTH_KM, 1.5e6);
});

test('the resonance: real periods close to 1 : 2 : 4, and the pattern repeats every 4 Io orbits', () => {
  const [io, eu, ga] = G.RESONANCE_MOONS.map((m) => m.periodDays);
  assert.ok(Math.abs(eu / io - 2) < 0.05 && Math.abs(ga / io - 4) < 0.1);
  assert.deepEqual(G.resonanceOrbits(4), [4, 2, 1]);
  assert.deepEqual(G.resonanceAngles(4), G.resonanceAngles(0));
  // The real pattern: Io and Ganymede together, Europa opposite; never all three on one side.
  for (let t = 0; t <= 4; t += 0.05) {
    const [a, b, c] = G.resonanceAngles(t);
    const laplace = (((a - 3 * b + 2 * c) % 360) + 360) % 360;
    assert.ok(Math.abs(laplace - 180) < 1e-6, `Laplace angle at t=${t}`);
  }
});

test('the Roche limit: inside about 2.5 planet radii a moon is pulled apart; outside it is stretched more when closer', () => {
  assert.equal(G.ROCHE_PLANET_RADII, 2.5);
  assert.ok(G.rocheState(2).inside);
  assert.ok(!G.rocheState(3).inside);
  assert.ok(G.rocheState(3).stretch > G.rocheState(5).stretch);
});

test('round or lumpy: lumpy below 400 km, in between to 600 km, round above', () => {
  assert.equal(G.shapeVerdict(22), 'lumpy');
  assert.equal(G.shapeVerdict(525), 'in between');
  assert.equal(G.shapeVerdict(940), 'round');
  assert.equal(G.roundness(100), 0);
  assert.equal(G.roundness(940), 1);
  G.SHAPE_EXAMPLES.forEach((e) => assert.ok(e.diameterKm >= G.SHAPE_MIN_KM && e.diameterKm <= G.SHAPE_MAX_KM));
});

test('atmospheres: faster gas when hotter and lighter, and the outcomes match the real Solar System', () => {
  assert.ok(G.gasSpeedKms(1000, 2) > G.gasSpeedKms(300, 2));
  assert.ok(G.gasSpeedKms(300, 2) > G.gasSpeedKms(300, 44));
  const kept = (b, g) => G.atmosphere(b, g).kept;
  G.GASES.forEach((g) => assert.ok(kept('jupiter', g.key), `Jupiter keeps ${g.key}`));
  G.GASES.forEach((g) => assert.ok(!kept('moon', g.key), `the Moon loses ${g.key}`));
  assert.ok(!kept('earth', 'hydrogen') && !kept('earth', 'helium'));
  assert.ok(kept('earth', 'nitrogen') && kept('earth', 'carbon-dioxide'));
  assert.ok(kept('titan', 'nitrogen') && kept('mars', 'carbon-dioxide'));
  assert.equal(G.KEEP_FACTOR, 6);
});
