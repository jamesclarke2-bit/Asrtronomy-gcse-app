const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../src/redshift');
const Spectra = require('../src/spectra');
const SpecData = require('../src/specData');

test('c comes from the data sheet, in m/s and km/s', () => {
  assert.equal(R.C_M_PER_S, SpecData.CONSTANTS.speedOfLightMPerS);
  assert.equal(R.C_KM_PER_S, 300000);
});

test("the lines are hydrogen's, the same values Reading a spectrum uses", () => {
  assert.deepEqual(R.LINES.map((l) => l.nm), Spectra.ELEMENTS.hydrogen.lines);
  assert.deepEqual(R.LINES.map((l) => l.name), ['Hα', 'Hβ', 'Hγ', 'Hδ']);
});

test('(wavelength shift) ÷ (emitted wavelength) = v ÷ c, both ways round', () => {
  assert.ok(Math.abs(R.wavelengthShift(656.3, 6000) - 13.126) < 1e-9);
  assert.ok(Math.abs(R.observedWavelength(656.3, 12000) - 682.552) < 1e-9);
  assert.ok(Math.abs(R.velocityFromWavelengths(486.1, 500.7) - 9010.49) < 0.01);
  for (const v of [0, 500, 6000, 20000]) {
    for (const l of R.LINES) assert.ok(Math.abs(R.velocityFromWavelengths(l.nm, R.observedWavelength(l.nm, v)) - v) < 1e-6);
  }
  assert.equal(R.wavelengthShift(656.3, 0), 0);
});

test('the slider keeps every line inside the drawn range, and its start value is on its step grid', () => {
  const top = R.observedWavelength(656.3, R.SLIDER.max);
  assert.ok(top <= R.DRAW_RANGE_NM.max, `Hα reaches ${top}`);
  assert.ok(Math.min(...R.LINES.map((l) => l.nm)) >= R.DRAW_RANGE_NM.min);
  assert.equal((R.SLIDER.start - R.SLIDER.min) % R.SLIDER.step, 0);
});

test('practice galaxies: each answer is worked from the rounded reading shown, and is close to its true speed', () => {
  assert.deepEqual(R.PRACTICE_GALAXIES.map((g) => g.id), ['A', 'B', 'C']);
  R.PRACTICE_GALAXIES.forEach((g) => {
    assert.equal(g.observedNm, Math.round(g.observedNm * 10) / 10);
    assert.ok(Math.abs(g.answerKmPerS - R.velocityFromWavelengths(g.lineNm, g.observedNm)) < 1e-9);
    assert.ok(R.withinTwoPercent(g.trueVKmPerS, g.answerKmPerS), g.id);
  });
  const a = R.PRACTICE_GALAXIES[0];
  assert.deepEqual([a.lineNm, a.observedNm, a.shiftNm], [656.3, 669.4, 13.1]);
});

test('withinTwoPercent accepts exactly 2% either side and nothing wider', () => {
  assert.ok(R.withinTwoPercent(102, 100));
  assert.ok(R.withinTwoPercent(98, 100));
  assert.ok(!R.withinTwoPercent(102.1, 100));
  assert.ok(!R.withinTwoPercent('', 100));
  assert.ok(!R.withinTwoPercent('abc', 100));
});
