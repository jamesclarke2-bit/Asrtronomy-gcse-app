const test = require('node:test');
const assert = require('node:assert/strict');
const Magnitude = require('../src/magnitude');
const Parallax = require('../src/parallax');

test('5 magnitudes is exactly a factor of 100', () => {
  assert.equal(Magnitude.brightnessRatio(5), 100);
});

test('2.5 magnitudes is exactly a factor of 10', () => {
  assert.equal(Magnitude.brightnessRatio(2.5), 10);
});

test('7.5 magnitudes is exactly a factor of 1000, 10 magnitudes exactly 10,000', () => {
  assert.equal(Magnitude.brightnessRatio(7.5), 1000);
  assert.equal(Magnitude.brightnessRatio(10), 10000);
});

test('0.75 magnitudes is about a factor of 2 (the mental-maths shortcut)', () => {
  assert.ok(Math.abs(Magnitude.brightnessRatio(0.75) - 2) < 0.01);
});

test('a difference of 8.3 magnitudes gives a ratio of about 2090', () => {
  assert.ok(Math.abs(Magnitude.brightnessRatio(8.3) - 2090) < 1, `got ${Magnitude.brightnessRatio(8.3)}`);
});

test('MAGNITUDE_RATIO_PER_STEP is the fifth root of 100, about 2.512', () => {
  assert.ok(Math.abs(Magnitude.MAGNITUDE_RATIO_PER_STEP - 2.512) < 0.001);
  assert.ok(Math.abs(Math.pow(Magnitude.MAGNITUDE_RATIO_PER_STEP, 5) - 100) < 1e-9);
});

test('brightnessRatio and magnitudeDifference are exact inverses (round trip)', () => {
  [0, 0.75, 1, 2.5, 5, 7.5, 8.3, 10, -3.2].forEach((deltaM) => {
    const ratio = Magnitude.brightnessRatio(deltaM);
    assert.ok(Math.abs(Magnitude.magnitudeDifference(ratio) - deltaM) < 1e-9, `round trip failed for ${deltaM}`);
  });
});

test('absoluteFromApparent and apparentFromAbsolute are exact inverses (round trip)', () => {
  [1, 2.64, 7.7, 10, 100, 500].forEach((d) => {
    const M = Magnitude.absoluteFromApparent(3, d);
    assert.ok(Math.abs(Magnitude.apparentFromAbsolute(M, d) - 3) < 1e-9, `round trip failed for d=${d}`);
  });
});

test('distanceFromModulus is the exact inverse of distanceModulus, via absoluteFromApparent', () => {
  [1, 2.64, 7.7, 10, 100, 500, 1000].forEach((d) => {
    const m = 5; // arbitrary apparent magnitude
    const M = Magnitude.absoluteFromApparent(m, d);
    const dBack = Magnitude.distanceFromModulus(m, M);
    assert.ok(Math.abs(dBack - d) / d < 1e-9, `round trip failed for d=${d}: got ${dBack}`);
  });
});

test('distance modulus is exactly 0 at 10 pc (m = M there, by definition)', () => {
  assert.ok(Math.abs(Magnitude.distanceModulus(10)) < 1e-12);
});

test("the Sun's absolute magnitude: m = -26.74 at 1 AU gives M = +4.83 (within 0.05)", () => {
  const distancePcForOneAu = 1 / Parallax.AU_PER_PARSEC;
  const M = Magnitude.absoluteFromApparent(-26.74, distancePcForOneAu);
  assert.ok(Math.abs(M - 4.83) < 0.05, `got M = ${M}`);
});

test("Sirius's absolute magnitude: m = -1.46 at its parallax-derived distance (~2.64 pc) gives M about +1.4 (within 0.05)", () => {
  const sirius = Parallax.STARS.find((s) => s.name === 'Sirius');
  const distancePc = Parallax.distanceFromParallax(sirius.parallaxArcsec);
  const M = Magnitude.absoluteFromApparent(-1.46, distancePc);
  assert.ok(Math.abs(M - 1.4) < 0.05, `got M = ${M}`);
});

test('approxBrightnessRatio uses the 2.5 shortcut, not the exact 2.512 constant', () => {
  assert.equal(Magnitude.approxBrightnessRatio(1), 2.5);
  assert.ok(Magnitude.approxBrightnessRatio(5) < Magnitude.brightnessRatio(5)); // 2.5^5=97.66 < 100
});
