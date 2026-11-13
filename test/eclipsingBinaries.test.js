/**
 * The eclipsing-binary engine (src/eclipsingBinaries.js) behind
 * notes/eclipsing-binaries.html: overlap geometry, which dip is deeper and
 * why, tilt, flat-bottomed against partial dips, Algol, and the period.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/eclipsingBinaries');
const VariableStars = require('../src/variableStars');
const BinariesClusters = require('../src/binariesClusters');

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('circle overlap: none apart, the whole smaller disc when inside, and symmetric in between', () => {
  assert.equal(E.circleOverlapArea(1, 2, 3.5), 0);
  close(E.circleOverlapArea(1, 2, 0.5), Math.PI, 1e-12, 'inside');
  close(E.circleOverlapArea(1, 1, 0), Math.PI, 1e-12, 'centred');
  close(E.circleOverlapArea(1.5, 1, 1.2), E.circleOverlapArea(1, 1.5, 1.2), 1e-12, 'symmetric');
  // Two unit circles one radius apart overlap by 2pi/3 - sqrt(3)/2.
  close(E.circleOverlapArea(1, 1, 1), (2 * Math.PI) / 3 - Math.sqrt(3) / 2, 1e-12, 'lens');
});

test('the same area hidden loses more light from the hotter star: light per square metre goes as T^4', () => {
  close(E.surfaceBrightness(11600) / E.surfaceBrightness(5800), 16, 1e-9, 'twice as hot, 16 times the light');
  const sys = { ...E.preset('demo'), A: { radius: 2, temperatureK: 10000 }, B: { radius: 2, temperatureK: 7000 }, inclinationDeg: 85 };
  const d = E.dips(sys);
  assert.equal(d.hiddenAtPrimary, 'A');
  assert.equal(d.hotter, 'A');
  assert.ok(d.whenAHidden > d.whenBHidden);
  // Swap the temperatures: the deep dip swaps too.
  const swapped = { ...sys, A: { radius: 2, temperatureK: 7000 }, B: { radius: 2, temperatureK: 10000 } };
  assert.equal(E.dips(swapped).hiddenAtPrimary, 'B');
});

test('flat between dips: both stars fully visible, full brightness', () => {
  const sys = E.preset('demo');
  close(E.fluxAt(sys, 0.25), 1, 1e-12, 'quadrature');
  close(E.fluxAt(sys, 0.75), 1, 1e-12, 'quadrature');
});

test('edge-on gives a flat-bottomed (total) dip; tilt makes it partial, then shallower, then gone', () => {
  const sys = E.preset('demo');
  const at = (i) => E.dips({ ...sys, inclinationDeg: i });
  assert.equal(at(90).typeA, 'total');
  assert.equal(at(90).typeB, 'annular');
  // A total eclipse holds the same depth for a while: the flat bottom.
  const flat = { ...sys, inclinationDeg: 90 };
  close(E.fluxAt(flat, 0), E.fluxAt(flat, 0.01), 1e-12, 'flat bottom');
  assert.equal(at(78).typeA, 'partial');
  const depths = [90, 82, 75, 68, 61].map((i) => at(i).primaryDepth);
  for (let k = 1; k < depths.length; k += 1) assert.ok(depths[k] < depths[k - 1], `${depths}`);
  const iMin = E.minimumInclinationDeg(sys);
  assert.equal(at(iMin - 1).typeA, 'none');
  assert.equal(at(iMin - 1).primaryDepth, 0);
  assert.ok(at(iMin + 1).primaryDepth > 0);
});

test('the orbit drawing uses the binaries page’s centre-of-mass positions; the star behind at phase 0 is A', () => {
  const sys = E.preset('demo');
  const pos = E.skyPositions(sys, 0);
  assert.ok(pos.A.z > pos.B.z, 'A is behind at phase 0');
  const p2 = E.skyPositions(sys, 0.5);
  assert.ok(p2.B.z > p2.A.z, 'B is behind at phase 0.5');
  const orbit = BinariesClusters.binaryPositions(sys.massRatio, sys.separation, 0);
  close(Math.hypot(pos.A.x, pos.A.y, pos.A.z), orbit.r1, 1e-9, 'same orbit radius for A');
  close(Math.hypot(pos.B.x, pos.B.y, pos.B.z), orbit.r2, 1e-9, 'same orbit radius for B');
});

test('Algol: period 2.87 days, hot star A eclipsed by larger cooler B, deep dip about 1.3 magnitudes, very shallow secondary', () => {
  const a = E.PRESETS.algol;
  assert.equal(a.periodDays, VariableStars.galleryById('algol').periodDays);
  assert.equal(a.brightestMag, VariableStars.galleryById('algol').brightest);
  assert.ok(a.A.temperatureK > a.B.temperatureK && a.B.radius > a.A.radius);
  const d = E.dips(a);
  assert.equal(d.hiddenAtPrimary, 'A');
  close(a.brightestMag + d.primaryDepth, VariableStars.galleryById('algol').faintest, 0.1, 'deep dip down to about 3.4');
  assert.ok(d.secondaryDepth < 0.05, `very shallow: ${d.secondaryDepth}`);
});

test('dip times: primaries one period apart, secondaries halfway between', () => {
  const sys = { ...E.preset('demo'), zeroDay: 1 };
  const { primary, secondary } = E.dipTimes(sys, 0, 16);
  primary.slice(1).forEach((t, i) => close(t - primary[i], sys.periodDays, 1e-9, 'period'));
  secondary.forEach((t, i) => close(t - primary[i], sys.periodDays / 2, 1e-9, 'half a period'));
  close(E.magnitudeAt(sys, primary[1]) - sys.brightestMag, E.dips(sys).primaryDepth, 1e-9, 'the deep dip is at a primary time');
});

test('the period from several cycles, its range and half-range uncertainty, and why more cycles help', () => {
  const r = E.periodFromDips(1.0, 15.4, 4);
  close(r.period, 3.6, 1e-9, 'period');
  close(r.low, 13.9 / 4, 1e-9, 'low');
  close(r.high, 14.9 / 4, 1e-9, 'high');
  close(r.uncertaintyDays, 0.125, 1e-9, 'half the range');
  const one = E.periodFromDips(1.0, 4.6, 1);
  close(one.percent / r.percent, 4, 1e-9, 'four cycles, a quarter of the percentage uncertainty');
});
