const test = require('node:test');
const assert = require('node:assert/strict');
const SeasonsIntensity = require('../src/seasonsIntensity');

// --- Step 1: Earth-Sun distance through the year ---------------------

test('earthSunDistanceKm: close to 147.1 million km at perihelion (early January)', () => {
  const km = SeasonsIntensity.earthSunDistanceKm(new Date(Date.UTC(2026, 0, 3, 12, 0)));
  assert.ok(Math.abs(km - 147100000) < 200000, `expected ~147.1 million km, got ${km}`);
});

test('earthSunDistanceKm: close to 152.1 million km at aphelion (early July)', () => {
  const km = SeasonsIntensity.earthSunDistanceKm(new Date(Date.UTC(2026, 6, 5, 12, 0)));
  assert.ok(Math.abs(km - 152100000) < 200000, `expected ~152.1 million km, got ${km}`);
});

test('yearlyDistanceSeriesKm: one point per day of the year, varying by about 3%', () => {
  const series = SeasonsIntensity.yearlyDistanceSeriesKm();
  assert.equal(series.length, 365);
  const distances = series.map((p) => p.distanceKm);
  const min = Math.min(...distances);
  const max = Math.max(...distances);
  const percentVariation = ((max - min) / ((max + min) / 2)) * 100;
  assert.ok(percentVariation > 2.5 && percentVariation < 4, `expected ~3% variation, got ${percentVariation.toFixed(2)}%`);
});

test('yearlyDistanceSeriesKm: Earth is closer to the Sun in UK winter (December) than in UK summer (June) — the opposite of the "closer = warmer" myth', () => {
  const series = SeasonsIntensity.yearlyDistanceSeriesKm();
  const juneKm = series[171].distanceKm; // ~June solstice
  const decemberKm = series[355].distanceKm; // ~December solstice
  assert.ok(decemberKm < juneKm, 'December should be closer to the Sun than June');
});

// --- Step 2: relative intensity from the Sun's altitude --------------

test('relativeIntensity: 1.00 with the Sun overhead (90 degrees)', () => {
  assert.ok(Math.abs(SeasonsIntensity.relativeIntensity(90) - 1) < 1e-9);
});

test('relativeIntensity: 0.50 at 30 degrees altitude', () => {
  assert.ok(Math.abs(SeasonsIntensity.relativeIntensity(30) - 0.5) < 1e-9);
});

test('relativeIntensity: about 0.17 at 10 degrees altitude', () => {
  assert.ok(Math.abs(SeasonsIntensity.relativeIntensity(10) - 0.17) < 0.01);
});

test('relativeIntensity: increases monotonically as the Sun climbs', () => {
  const altitudes = [10, 20, 30, 45, 60, 90];
  const intensities = altitudes.map(SeasonsIntensity.relativeIntensity);
  for (let i = 1; i < intensities.length; i += 1) {
    assert.ok(intensities[i] > intensities[i - 1]);
  }
});

test('patchWidthMultiplier: the reciprocal of relativeIntensity, 1 at 90 degrees and 2 at 30 degrees', () => {
  assert.ok(Math.abs(SeasonsIntensity.patchWidthMultiplier(90) - 1) < 1e-9);
  assert.ok(Math.abs(SeasonsIntensity.patchWidthMultiplier(30) - 2) < 1e-9);
});
