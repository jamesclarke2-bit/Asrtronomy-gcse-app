const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../src/infraredSites');
const W = require('../src/atmosphereWindows');

test('the share of water vapour above a site falls with height, halving about every 1.4 km', () => {
  assert.equal(I.waterVapourAbove(0), 1);
  for (let h = 0.5; h <= 5; h += 0.5) assert.ok(I.waterVapourAbove(h) < I.waterVapourAbove(h - 0.5), `${h}`);
  assert.ok(Math.abs(I.waterVapourAbove(2 * Math.LN2) - 0.5) < 1e-12);
  assert.ok(I.waterVapourAbove(4.2) < 0.15, 'a 4.2 km site is above most of the water vapour');
});

test('more infrared gets through the higher the site: little at sea level, most on a high mountain', () => {
  const at = (h) => I.infraredThrough(h);
  assert.ok(at(0) < 0.06);
  for (let h = 0.5; h <= 5; h += 0.5) assert.ok(at(h) > at(h - 0.5), `${h}`);
  assert.ok(at(4.2) > 0.6 && at(5) > at(4.2));
  assert.ok(at(5) < 1);
});

test('the example sites sit on the altitude slider\'s 0.1 km step grid and within its range', () => {
  assert.deepEqual(I.SITES.map((s) => s.id), ['sea-level', 'mauna-kea', 'chajnantor']);
  I.SITES.forEach((s) => {
    assert.ok(Number.isInteger(Math.round(s.altitudeKm * 10)) && Math.abs(s.altitudeKm * 10 - Math.round(s.altitudeKm * 10)) < 1e-9, s.id);
    assert.ok(s.altitudeKm >= I.ALTITUDE_RANGE_KM.min && s.altitudeKm <= I.ALTITUDE_RANGE_KM.max, s.id);
  });
  assert.equal(I.site('mauna-kea').altitudeKm, 4.2);
});

test('a star through still air is one sharp point; turbulence makes it larger and breaks it up', () => {
  const sharp = I.starImage(0);
  assert.equal(sharp.speckles.length, 1);
  assert.equal(sharp.radius, I.SHARP_RADIUS);
  let last = sharp;
  for (let t = 1; t <= 10; t += 1) {
    const img = I.starImage(t);
    assert.ok(img.radius > last.radius, `radius grows at ${t}`);
    assert.ok(img.speckles.length >= last.speckles.length, `speckles at ${t}`);
    img.speckles.forEach((s) => assert.ok(Math.hypot(s.dx, s.dy) <= img.radius, 'speckles stay inside the blur'));
    last = img;
  }
  // Twinkling: the speckles move from frame to frame; the blur's size does not.
  assert.notDeepEqual(I.starImage(6, 0).speckles, I.starImage(6, 1).speckles);
  assert.equal(I.starImage(6, 0).radius, I.starImage(6, 1).radius);
});

test('the shared atmosphere chart: only visible light and radio reach the ground; X-rays are among the blocked', () => {
  const reach = W.BANDS.filter((b) => b.category === 'open').map((b) => b.name);
  assert.deepEqual(reach, ['Optical', 'Radio']);
  W.BANDS.filter((b) => b.category === 'open').forEach((b) => assert.equal(b.heightPct, 100));
  assert.equal(W.BANDS.find((b) => b.name === 'X-ray').category, 'blocked');
  assert.equal(W.BANDS.find((b) => b.name === 'Infrared').category, 'partial');
  assert.equal(W.bandCentre(0), 70);
  assert.equal(W.bandCentre(5), 570);
});
