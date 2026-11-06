const test = require('node:test');
const assert = require('node:assert/strict');
const LightPollution = require('../src/lightPollution');

test('limitingMagnitudeForScale: 6.5 at the darkest site, 3.0 in a city centre, linear in between', () => {
  assert.equal(LightPollution.limitingMagnitudeForScale(1), 6.5);
  assert.equal(LightPollution.limitingMagnitudeForScale(9), 3.0);
  const mid = LightPollution.limitingMagnitudeForScale(5);
  assert.ok(Math.abs(mid - 4.75) < 1e-9, `scale 5 should be exactly halfway (4.75), got ${mid}`);
});

test('limitingMagnitudeForScale: strictly decreasing as the scale rises toward the city end', () => {
  let prev = LightPollution.limitingMagnitudeForScale(1);
  for (let scale = 2; scale <= 9; scale += 1) {
    const value = LightPollution.limitingMagnitudeForScale(scale);
    assert.ok(value < prev, `scale ${scale} (${value}) should be fainter-limited than scale ${scale - 1} (${prev})`);
    prev = value;
  }
});

test('limitingMagnitudeForScale: clamps outside the 1-9 range', () => {
  assert.equal(LightPollution.limitingMagnitudeForScale(0), LightPollution.limitingMagnitudeForScale(1));
  assert.equal(LightPollution.limitingMagnitudeForScale(20), LightPollution.limitingMagnitudeForScale(9));
});

test('approxVisibleStarCount: matches the two calibration points exactly', () => {
  assert.equal(LightPollution.approxVisibleStarCount(6.5), 9000);
  assert.equal(LightPollution.approxVisibleStarCount(3.0), 250);
});

test('approxVisibleStarCount: more stars visible at a fainter limiting magnitude (monotonically increasing)', () => {
  let prev = LightPollution.approxVisibleStarCount(3.0);
  for (let m = 3.5; m <= 6.5; m += 0.5) {
    const count = LightPollution.approxVisibleStarCount(m);
    assert.ok(count > prev, `magnitude ${m} (${count} stars) should show more stars than magnitude ${m - 0.5} (${prev})`);
    prev = count;
  }
});

test('approxVisibleStarCount: a one-magnitude step roughly triples the star count (realistic growth rate)', () => {
  const ratio = LightPollution.approxVisibleStarCount(5.5) / LightPollution.approxVisibleStarCount(4.5);
  assert.ok(ratio > 2 && ratio < 4, `expected a roughly 2-4x jump per magnitude, got ${ratio}`);
});

test('adaptationFraction: starts at 0, reaches exactly 1 at 30 minutes, and rises faster early than late', () => {
  assert.equal(LightPollution.adaptationFraction(0), 0);
  assert.equal(LightPollution.adaptationFraction(30), 1);
  const gainFirst10 = LightPollution.adaptationFraction(10) - LightPollution.adaptationFraction(0);
  const gainLast10 = LightPollution.adaptationFraction(30) - LightPollution.adaptationFraction(20);
  assert.ok(gainFirst10 > gainLast10, 'the first 10 minutes should gain more than the last 10 (decelerating curve)');
});

test('adaptationFraction: clamps outside 0-30 minutes', () => {
  assert.equal(LightPollution.adaptationFraction(-5), 0);
  assert.equal(LightPollution.adaptationFraction(45), 1);
});

test('adaptationFraction: about 89% of the way there at 20 minutes (mostly, not fully, adapted)', () => {
  const value = LightPollution.adaptationFraction(20);
  assert.ok(Math.abs(value - 0.8889) < 0.001, `expected ~0.889 at 20 minutes, got ${value}`);
});

test('currentLimitingMagnitude: at 0 minutes, every site (however dark) shows only magnitude 3 (unadapted)', () => {
  [1, 3, 5, 7, 9].forEach((scale) => {
    assert.equal(LightPollution.currentLimitingMagnitude(scale, 0), 3.0, `scale ${scale} at 0 minutes`);
  });
});

test('currentLimitingMagnitude: at 30 minutes, reaches exactly the site\'s own ceiling', () => {
  [1, 3, 5, 7, 9].forEach((scale) => {
    const expected = LightPollution.limitingMagnitudeForScale(scale);
    assert.ok(Math.abs(LightPollution.currentLimitingMagnitude(scale, 30) - expected) < 1e-9, `scale ${scale} at 30 minutes`);
  });
});

test('currentLimitingMagnitude: in a city centre (scale 9), adaptation time makes no difference', () => {
  const at0 = LightPollution.currentLimitingMagnitude(9, 0);
  const at15 = LightPollution.currentLimitingMagnitude(9, 15);
  const at30 = LightPollution.currentLimitingMagnitude(9, 30);
  assert.equal(at0, at15);
  assert.equal(at15, at30);
  assert.equal(at0, 3.0);
});

test('currentLimitingMagnitude: at a dark site, adaptation time matters — more minutes always sees fainter', () => {
  let prev = LightPollution.currentLimitingMagnitude(1, 0);
  for (let minutes = 5; minutes <= 30; minutes += 5) {
    const value = LightPollution.currentLimitingMagnitude(1, minutes);
    assert.ok(value > prev, `${minutes} minutes (${value}) should see fainter than ${minutes - 5} minutes (${prev}) at a dark site`);
    prev = value;
  }
});

test('STAR_CATALOG: a fixed, deterministic field of stars with magnitudes within the model\'s own range', () => {
  assert.ok(Array.isArray(LightPollution.STAR_CATALOG));
  assert.ok(LightPollution.STAR_CATALOG.length > 100, 'enough stars to look like a field');
  LightPollution.STAR_CATALOG.forEach((star) => {
    assert.ok(star.xFrac >= 0 && star.xFrac < 1);
    assert.ok(star.yFrac >= 0 && star.yFrac < 1);
    assert.ok(star.magnitude >= 0.5 && star.magnitude <= LightPollution.LIMITING_MAGNITUDE_DARK_SITE);
  });
  // Reloading the module (a fresh require after clearing the cache)
  // should produce the exact same catalog — deterministic, not Math.random.
  delete require.cache[require.resolve('../src/lightPollution')];
  const reloaded = require('../src/lightPollution');
  assert.deepEqual(reloaded.STAR_CATALOG, LightPollution.STAR_CATALOG);
});

test('STAR_CATALOG: skews toward fainter magnitudes, like a real sky (more faint stars than bright ones)', () => {
  const midpoint = (0.5 + LightPollution.LIMITING_MAGNITUDE_DARK_SITE) / 2;
  const faintCount = LightPollution.STAR_CATALOG.filter((s) => s.magnitude > midpoint).length;
  const brightCount = LightPollution.STAR_CATALOG.filter((s) => s.magnitude <= midpoint).length;
  assert.ok(faintCount > brightCount, `expected more faint stars (${faintCount}) than bright ones (${brightCount})`);
});
