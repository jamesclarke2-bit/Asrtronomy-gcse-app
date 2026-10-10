const test = require('node:test');
const assert = require('node:assert/strict');
const GalileanMoons = require('../src/galileanMoons');

test('MOONS lists the four Galilean moons, nearest to farthest, in Io/Europa/Ganymede/Callisto order', () => {
  assert.deepEqual(
    GalileanMoons.MOONS.map((m) => m.name),
    ['Io', 'Europa', 'Ganymede', 'Callisto']
  );
});

test('farther moons take longer to orbit (Kepler\'s third law ordering)', () => {
  const { MOONS } = GalileanMoons;
  for (let i = 1; i < MOONS.length; i += 1) {
    assert.ok(MOONS[i].distanceJupiterRadii > MOONS[i - 1].distanceJupiterRadii, `${MOONS[i].name} should be farther than ${MOONS[i - 1].name}`);
    assert.ok(MOONS[i].periodDays > MOONS[i - 1].periodDays, `${MOONS[i].name} should orbit slower than ${MOONS[i - 1].name}`);
  }
});

test('every moon starts directly in line with Jupiter (offset 0 at day 0)', () => {
  GalileanMoons.MOONS.forEach((moon) => {
    assert.equal(GalileanMoons.xOffsetJupiterRadii(moon, 0), 0);
  });
});

test('each moon\'s offset repeats exactly after its own orbital period', () => {
  GalileanMoons.MOONS.forEach((moon) => {
    const a = GalileanMoons.xOffsetJupiterRadii(moon, 2.3);
    const b = GalileanMoons.xOffsetJupiterRadii(moon, 2.3 + moon.periodDays);
    assert.ok(Math.abs(a - b) < 1e-9, `${moon.name}: expected the same offset one period later`);
  });
});

test('each moon switches sides (crosses in front of or behind Jupiter) twice per orbit', () => {
  GalileanMoons.MOONS.forEach((moon) => {
    const quarter = GalileanMoons.xOffsetJupiterRadii(moon, moon.periodDays / 4);
    const threeQuarter = GalileanMoons.xOffsetJupiterRadii(moon, (3 * moon.periodDays) / 4);
    assert.ok(quarter > 0, `${moon.name}: expected a positive offset a quarter-period in`);
    assert.ok(threeQuarter < 0, `${moon.name}: expected a negative offset three-quarters of the way round`);
  });
});

test("Io, Europa and Ganymede's real periods are in a 1:2:4 Laplace resonance, to within a couple of percent", () => {
  const { MOONS } = GalileanMoons;
  const io = MOONS.find((m) => m.name === 'Io');
  const europa = MOONS.find((m) => m.name === 'Europa');
  const ganymede = MOONS.find((m) => m.name === 'Ganymede');
  assert.ok(Math.abs(europa.periodDays / io.periodDays - 2) < 0.01, `Europa:Io should be ~2:1, got ${europa.periodDays / io.periodDays}`);
  assert.ok(Math.abs(ganymede.periodDays / io.periodDays - 4) < 0.05, `Ganymede:Io should be ~4:1, got ${ganymede.periodDays / io.periodDays}`);
});

test('a moon never swings further from Jupiter than its own orbital distance', () => {
  GalileanMoons.MOONS.forEach((moon) => {
    for (let days = 0; days <= moon.periodDays * 2; days += moon.periodDays / 11) {
      const offset = GalileanMoons.xOffsetJupiterRadii(moon, days);
      assert.ok(Math.abs(offset) <= moon.distanceJupiterRadii + 1e-9, `${moon.name}: offset ${offset} exceeds its own orbital distance`);
    }
  });
});
