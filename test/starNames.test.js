const test = require('node:test');
const assert = require('node:assert/strict');
const N = require('../src/starNames');
const SP = require('../src/starPatterns');
const BC = require('../src/binariesClusters');
const { getSpecPoint } = require('../src/specPoints');

test('the Greek alphabet in order, with symbols, for Bayer letters', () => {
  assert.equal(N.GREEK.length, 24);
  assert.deepEqual(N.GREEK.slice(0, 4).map((g) => g.symbol), ['α', 'β', 'γ', 'δ']);
  assert.equal(N.greek('Kappa').order, 10);
  assert.equal(N.greek('λ').name, 'Lambda');
});

test('a Bayer name is a Greek letter plus the genitive, and decodes back to its constellation and usual rank', () => {
  assert.match(getSpecPoint('14.2').text, /Bayer system/);
  assert.equal(N.bayerName('Alpha', 'Orion'), 'Alpha Orionis');
  assert.equal(N.bayerName('Alpha', 'Canis Major', 'short'), 'α CMa');
  assert.equal(N.bayerName('Beta', 'Perseus', 'symbol'), 'β Persei');
  assert.deepEqual(N.decode('Beta Persei'), { letter: N.greek('Beta'), constellation: 'Perseus', usualRank: 2 });
  assert.equal(N.decode('γ Cyg').constellation, 'Cygnus');
  assert.equal(N.decode('Alpha Ursae Majoris').constellation, 'Ursa Major');
  assert.throws(() => N.decode('Alpha Nowhere'));
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21].map(N.ordinal), ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st']);
});

test("Orion's stars: magnitudes from the shared star data, and Bayer letters only roughly follow brightness", () => {
  const stars = N.orionStars();
  assert.equal(stars.length, 8);
  stars.forEach((s) => assert.equal(s.mag, SP.STARS[s.key].mag, s.key));
  const by = (k) => stars.find((s) => s.key === k);
  assert.equal(by('betelgeuse').bayerFull, 'Alpha Orionis');
  assert.equal(by('rigel').brightnessRank, 1, 'Rigel (beta) is the brightest');
  assert.equal(by('betelgeuse').brightnessRank, 2);
  assert.ok(stars.some((s) => s.brightnessRank !== s.letterOrder), 'not in strict order');
  // Flamsteed numbers run west to east: higher right ascension, higher number.
  const sorted = [...stars].sort((a, b) => a.ra - b.ra);
  sorted.slice(1).forEach((s, k) => assert.ok(s.flamsteed > sorted[k].flamsteed, s.key));
});

test('the Messier and NGC extract: looked up by either number, and matching the binaries page magnitudes', () => {
  assert.match(getSpecPoint('14.1').text, /Messier and NGC/);
  assert.equal(N.lookUp('M42').ngc, 1976);
  assert.equal(N.lookUp('NGC 1976').messier, 42);
  assert.equal(N.lookUp('NGC 869').messier, null, 'the Double Cluster has no M number');
  assert.equal(N.lookUp('M45').ngc, null, 'the Pleiades have no NGC number');
  assert.equal(N.lookUp('M13').mag, BC.objectById('m13').totalMag);
  assert.equal(N.lookUp('M42').mag, BC.objectById('m42').totalMag);
  assert.equal(N.lookUp('M31').mag, Math.round(BC.objectById('m31').totalMag * 10) / 10);
  assert.equal(N.CATALOGUES.messier.count, 110);
  assert.equal(N.CATALOGUES.ngc.count, 7840);
  assert.equal(N.rowText(N.lookUp('M42')), 'M42 = NGC 1976: Orion Nebula, nebula, in Orion, magnitude 4.0');
  assert.equal(new Set(N.DEEP_SKY.map((o) => o.id)).size, N.DEEP_SKY.length);
});
