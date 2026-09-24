const test = require('node:test');
const assert = require('node:assert/strict');
const {
  STARS,
  PATTERNS,
  angularSeparation,
  project,
  centreOf,
  spanOf,
  northernmostLatitudeToSee,
  extendBeyond,
} = require('../src/starPatterns');

const SOUTH_POLE = { ra: 0, dec: -90 };

test('every pattern only uses stars that exist, and joins stars in its own list', () => {
  PATTERNS.forEach((pattern) => {
    pattern.stars.forEach((key) => assert.ok(STARS[key], `${pattern.id}: unknown star ${key}`));
    pattern.lines.flat().forEach((key) => assert.ok(pattern.stars.includes(key), `${pattern.id}: line uses ${key}`));
    pattern.labels.forEach(([key]) => assert.ok(pattern.stars.includes(key), `${pattern.id}: label for ${key}`));
  });
});

test('the page covers exactly the seven named patterns', () => {
  assert.deepEqual(
    PATTERNS.map((p) => p.id).sort(),
    ['cassiopeia', 'cygnus', 'orion', 'plough', 'southernCross', 'squareOfPegasus', 'summerTriangle']
  );
});

test('asterisms vs constellations are classified correctly', () => {
  const kinds = Object.fromEntries(PATTERNS.map((p) => [p.id, p.kind]));
  assert.equal(kinds.plough, 'asterism');
  assert.equal(kinds.summerTriangle, 'asterism');
  assert.equal(kinds.squareOfPegasus, 'asterism');
  assert.equal(kinds.orion, 'constellation');
  assert.equal(kinds.cassiopeia, 'constellation');
  assert.equal(kinds.cygnus, 'constellation');
  assert.equal(kinds.southernCross, 'constellation');
});

test('angular separation matches known values', () => {
  // The Pointers are about 5.4° apart; Polaris is under a degree from the pole.
  assert.ok(Math.abs(angularSeparation(STARS.merak, STARS.dubhe) - 5.4) < 0.1);
  assert.ok(angularSeparation(STARS.polaris, { ra: 0, dec: 90 }) < 1);
  // Separation doesn't depend on which way round, or on crossing RA 0h.
  assert.equal(angularSeparation(STARS.markab, STARS.algenib), angularSeparation(STARS.algenib, STARS.markab));
  assert.ok(angularSeparation(STARS.markab, STARS.algenib) < 20);
});

test('the chart projection puts north up and east to the left', () => {
  const centre = { ra: 6, dec: 0 };
  const origin = project(centre, centre);
  assert.ok(Math.abs(origin.x) < 1e-12 && Math.abs(origin.y) < 1e-12, 'the centre maps to the origin');
  assert.ok(project({ ra: 6, dec: 5 }, centre).y > 0, 'north is up');
  assert.ok(project({ ra: 6.3, dec: 0 }, centre).x < 0, 'east (higher RA) is to the left');
});

test('a pattern straddling RA 0h is centred inside it, not on the far side of the sky', () => {
  const square = PATTERNS.find((p) => p.id === 'squareOfPegasus').stars.map((key) => STARS[key]);
  const centre = centreOf(square);
  square.forEach((star) => assert.ok(angularSeparation(star, centre) < 15));
});

test('Orion is drawn the right way up: Betelgeuse above the Belt, Rigel below', () => {
  const orion = PATTERNS.find((p) => p.id === 'orion').stars.map((key) => STARS[key]);
  const centre = centreOf(orion);
  const beltY = project(STARS.alnilam, centre).y;
  assert.ok(project(STARS.betelgeuse, centre).y > beltY);
  assert.ok(project(STARS.rigel, centre).y < beltY);
  // Betelgeuse is on the east (left) side, Rigel on the west (right).
  assert.ok(project(STARS.betelgeuse, centre).x < project(STARS.rigel, centre).x);
});

test('pattern spans match the sizes quoted on the page', () => {
  const span = (id) => spanOf(PATTERNS.find((p) => p.id === id).stars.map((key) => STARS[key]));
  assert.ok(Math.abs(span('southernCross') - 6) < 0.5);
  assert.ok(Math.abs(span('summerTriangle') - 38) < 1);
  assert.ok(Math.abs(span('plough') - 26) < 1);
});

test("the Pointers: Polaris is about five times Merak-Dubhe beyond Dubhe, and the line passes close to it", () => {
  const gap = angularSeparation(STARS.merak, STARS.dubhe);
  const ratio = angularSeparation(STARS.dubhe, STARS.polaris) / gap;
  assert.equal(Math.round(ratio), 5);
  const landing = extendBeyond(STARS.merak, STARS.dubhe, ratio);
  assert.ok(angularSeparation(landing, STARS.polaris) < 3, 'lands within a few degrees of Polaris');
});

test('the Southern Cross: its long axis extended about 4.5 times reaches the south celestial pole', () => {
  const length = angularSeparation(STARS.gacrux, STARS.acrux);
  const ratio = angularSeparation(STARS.acrux, SOUTH_POLE) / length;
  assert.equal(Math.round(ratio * 2) / 2, 4.5);
  const landing = extendBeyond(STARS.gacrux, STARS.acrux, ratio);
  assert.ok(angularSeparation(landing, SOUTH_POLE) < 3);
});

test("visibility claims: the Southern Cross can't be seen from the UK, the Plough and Cassiopeia never set there", () => {
  const cruxLimit = Math.min(...PATTERNS.find((p) => p.id === 'southernCross').stars.map((key) => northernmostLatitudeToSee(STARS[key])));
  assert.equal(Math.round(cruxLimit), 27);
  assert.ok(cruxLimit < 49.9, 'the whole cross is below the horizon from anywhere in the UK');

  // Circumpolar from latitude L if dec > 90 - L; the UK's southern tip is ~50°N.
  ['plough', 'cassiopeia'].forEach((id) => {
    PATTERNS.find((p) => p.id === id).stars.forEach((key) => {
      assert.ok(STARS[key].dec > 90 - 50, `${key} is circumpolar from all of the UK`);
    });
  });
});
