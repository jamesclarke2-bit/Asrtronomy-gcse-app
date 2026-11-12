const test = require('node:test');
const assert = require('node:assert/strict');
const Parallax = require('../src/parallax');

test('1 arcsecond of parallax gives exactly 1 parsec', () => {
  assert.equal(Parallax.distanceFromParallax(1), 1);
});

test('1 parsec is 206,667 AU (within 0.1%, the data sheet\'s own rounded parsecKm/auKm ratio) and 3.26 light years (within 0.1%)', () => {
  assert.ok(Math.abs(Parallax.AU_PER_PARSEC - 206667) / 206667 < 0.001, `AU_PER_PARSEC = ${Parallax.AU_PER_PARSEC}`);
  const ly = Parallax.parsecToLightYears(1);
  assert.ok(Math.abs(ly - 3.26) / 3.26 < 0.001, `1 pc in ly = ${ly}`);
});

test('1 parsec is about 3.09 x 10^16 m (within 0.5%)', () => {
  const expected = 3.09e16;
  assert.ok(Math.abs(Parallax.METRES_PER_PARSEC - expected) / expected < 0.005, `METRES_PER_PARSEC = ${Parallax.METRES_PER_PARSEC}`);
});

test('distanceFromParallax and parallaxFromDistance are inverses (round trip)', () => {
  [0.01, 0.1, 0.768, 1, 7.7, 100].forEach((p) => {
    const d = Parallax.distanceFromParallax(p);
    assert.ok(Math.abs(Parallax.parallaxFromDistance(d) - p) < 1e-9, `round trip failed for p=${p}`);
  });
});

test('parsecToLightYears and lightYearsToParsecs are inverses', () => {
  [1, 1.3, 10, 100].forEach((pc) => {
    const ly = Parallax.parsecToLightYears(pc);
    assert.ok(Math.abs(Parallax.lightYearsToParsecs(ly) - pc) < 1e-9, `round trip failed for pc=${pc}`);
  });
});

test('ground-based limit: a parallax of 0.01 arcsec is a distance of 100 pc', () => {
  assert.equal(Parallax.distanceFromParallax(0.01), 100);
});

test('10 pc is where the parallax would be exactly 0.1 arcsec', () => {
  assert.equal(Parallax.parallaxFromDistance(10), 0.1);
  assert.equal(Parallax.distanceFromParallax(0.1), 10);
});

test('the star list: parallax figures give the stated distances (within 1%)', () => {
  const stars = [
    { name: 'Proxima Centauri', parallax: 0.768, pc: 1.30, ly: 4.24 },
    { name: 'Alpha Centauri', parallax: 0.747, pc: 1.34 },
    { name: "Barnard's Star", parallax: 0.547, pc: 1.83 },
    { name: 'Sirius', parallax: 0.379, pc: 2.64 },
    { name: 'Vega', parallax: 0.130, pc: 7.7 },
  ];
  stars.forEach((star) => {
    const pc = Parallax.distanceFromParallax(star.parallax);
    assert.ok(Math.abs(pc - star.pc) / star.pc < 0.01, `${star.name}: expected ~${star.pc} pc, got ${pc.toFixed(2)}`);
    if (star.ly) {
      const ly = Parallax.parsecToLightYears(pc);
      assert.ok(Math.abs(ly - star.ly) / star.ly < 0.01, `${star.name}: expected ~${star.ly} ly, got ${ly.toFixed(2)}`);
    }
  });
});

test('a small parallax with an uncertainty gives a wide distance range: 0.010 +/- 0.005 arcsec is about 67 to 200 pc', () => {
  const { nearPc, farPc } = Parallax.parallaxUncertaintyToDistanceRange(0.010, 0.005);
  assert.ok(Math.abs(nearPc - 66.7) < 1, `nearPc = ${nearPc}`);
  assert.ok(Math.abs(farPc - 200) < 1, `farPc = ${farPc}`);
});

test('parallaxUncertaintyToDistanceRange: an uncertainty reaching zero (or below) has no far bound', () => {
  const { farPc } = Parallax.parallaxUncertaintyToDistanceRange(0.01, 0.01);
  assert.equal(farPc, null);
});

test('arcsecondsToRadians: 206,265 arcseconds is about 1 radian', () => {
  assert.ok(Math.abs(Parallax.arcsecondsToRadians(206265) - 1) < 0.001);
});

test('ARCSECONDS_PER_DEGREE and ARCMINUTES_PER_DEGREE: 1 degree is 60 arcminutes is 3600 arcseconds', () => {
  assert.equal(Parallax.ARCMINUTES_PER_DEGREE, 60);
  assert.equal(Parallax.ARCSECONDS_PER_ARCMINUTE, 60);
  assert.equal(Parallax.ARCSECONDS_PER_DEGREE, 3600);
});
