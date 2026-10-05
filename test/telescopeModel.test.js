const test = require('node:test');
const assert = require('node:assert/strict');
const TelescopeModel = require('../src/telescopeModel');

test('magnification: a 1000 mm objective with a 25 mm eyepiece gives 40x', () => {
  assert.equal(TelescopeModel.magnification(1000, 25), 40);
});

test('light grasp: doubling the aperture gives 4x the light grasp', () => {
  assert.equal(TelescopeModel.lightGraspRatio(200, 100), 4);
  assert.equal(TelescopeModel.lightGraspRatio(2, 1), 4);
});

test('light grasp: a 100 mm telescope collects about 200x the light of a 7 mm dark-adapted pupil', () => {
  assert.equal(TelescopeModel.DARK_ADAPTED_EYE_PUPIL_MM, 7);
  const ratio = TelescopeModel.lightGraspRatio(100, TelescopeModel.DARK_ADAPTED_EYE_PUPIL_MM);
  assert.ok(Math.abs(ratio - Math.pow(100 / 7, 2)) < 1e-9);
  assert.ok(ratio > 190 && ratio < 215, `expected "about 200", got ${ratio}`);
});

test('resolution: a 100 mm aperture at 550 nm resolves about 1.4 arcseconds (Rayleigh criterion)', () => {
  const arcsec = TelescopeModel.resolutionArcsec(550, 100);
  assert.ok(Math.abs(arcsec - 1.38) < 0.02, `expected ~1.38, got ${arcsec}`);
  assert.equal(arcsec.toFixed(1), '1.4');
});

test('resolution improves (gets smaller) with a larger objective diameter', () => {
  const small = TelescopeModel.resolutionArcsec(550, 60);
  const large = TelescopeModel.resolutionArcsec(550, 200);
  assert.ok(large < small);
});

test('resolution is worse (gets bigger) at longer wavelengths', () => {
  const shortWave = TelescopeModel.resolutionArcsec(400, 100);
  const longWave = TelescopeModel.resolutionArcsec(700, 100);
  assert.ok(longWave > shortWave);
});
