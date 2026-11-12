/**
 * The spectral-class data in src/spectra.js behind
 * notes/spectral-types.html: temperature ranges, class lookup, colours,
 * strongest lines and the eight real stars.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const Spectra = require('../src/spectra');
const SpecData = require('../src/specData');

test('the classes run O B A F G K M, hottest first', () => {
  assert.deepEqual(Spectra.CLASS_LETTERS, ['O', 'B', 'A', 'F', 'G', 'K', 'M']);
  for (let i = 1; i < Spectra.SPECTRAL_CLASSES.length; i += 1) {
    assert.ok(Spectra.SPECTRAL_CLASSES[i].minK < Spectra.SPECTRAL_CLASSES[i - 1].minK);
  }
});

test('the approximate temperature ranges are exactly the ones given, and each range meets the next with no gap', () => {
  const ranges = Spectra.SPECTRAL_CLASSES.map((c) => [c.letter, c.minK, c.maxK]);
  assert.deepEqual(ranges, [
    ['O', 30000, null],
    ['B', 10000, 30000],
    ['A', 7500, 10000],
    ['F', 6000, 7500],
    ['G', 5200, 6000],
    ['K', 3700, 5200],
    ['M', 2400, 3700],
  ]);
  for (let i = 1; i < Spectra.SPECTRAL_CLASSES.length; i += 1) {
    assert.equal(Spectra.SPECTRAL_CLASSES[i].maxK, Spectra.SPECTRAL_CLASSES[i - 1].minK);
  }
});

test('classForTemperature: inside each range, and at each boundary (the upper bound belongs to the cooler class)', () => {
  const cases = [
    [40000, 'O'], [30001, 'O'], [30000, 'B'], [20000, 'B'], [10001, 'B'], [10000, 'A'], [8000, 'A'],
    [7500, 'F'], [6500, 'F'], [6000, 'G'], [5800, 'G'], [5200, 'K'], [4300, 'K'], [3700, 'M'], [2500, 'M'],
  ];
  cases.forEach(([t, letter]) => assert.equal(Spectra.classForTemperature(t).letter, letter, `${t} K`));
});

test('colours: O blue, B blue-white, A white, F yellow-white, G yellow, K orange, M red', () => {
  assert.deepEqual(Spectra.SPECTRAL_CLASSES.map((c) => c.colour), ['blue', 'blue-white', 'white', 'yellow-white', 'yellow', 'orange', 'red']);
  Spectra.SPECTRAL_CLASSES.forEach((c) => {
    const inside = c.maxK ? (c.minK + c.maxK) / 2 : c.minK + 5000;
    assert.equal(Spectra.starColourName(inside), c.colour);
  });
});

test('strongest lines: helium in B, hydrogen in A, calcium and sodium in G and K, molecules in M', () => {
  const by = (letter) => Spectra.classByLetter(letter);
  assert.equal(by('B').strengths.helium, 'strong');
  assert.equal(by('A').strengths.hydrogen, 'strong');
  ['G', 'K'].forEach((l) => {
    assert.equal(by(l).strengths.calcium, 'strong');
    assert.equal(by(l).strengths.sodium, 'strong');
  });
  assert.equal(by('M').molecules, true);
  assert.ok(Spectra.SPECTRAL_CLASSES.filter((c) => c.molecules).every((c) => c.letter === 'M'));
  assert.ok(Spectra.SPECTRAL_CLASSES.filter((c) => c.strengths.helium === 'strong').every((c) => c.letter === 'B'));
  assert.ok(Spectra.SPECTRAL_CLASSES.filter((c) => c.strengths.hydrogen === 'strong').every((c) => c.letter === 'A'));
});

test('linesForTemperature: an M star adds molecular bands; no other class does', () => {
  Spectra.SPECTRAL_CLASSES.forEach((c) => {
    const t = c.maxK ? (c.minK + c.maxK) / 2 : 35000;
    const bands = Spectra.linesForTemperature(t).filter((l) => l.kind === 'band');
    assert.equal(bands.length, c.molecules ? Spectra.MOLECULE_BANDS_NM.length : 0, c.letter);
  });
});

test('a molecular band dims the spectrum just to the red of its head, and not to the blue', () => {
  const band = [{ nm: 516.7, depth: 0.6, kind: 'band' }];
  const before = Spectra.intensityAt(514, { type: 'absorption', lines: band });
  const after = Spectra.intensityAt(518, { type: 'absorption', lines: band });
  assert.equal(before, 1);
  assert.ok(after < 0.6);
});

test('the four example stars on Reading a spectrum take their line strengths from their own class', () => {
  Spectra.EXAMPLE_STARS.forEach((star) => {
    assert.deepEqual(star.strengths, Spectra.classForTemperature(star.temperatureK).strengths, star.id);
  });
});

test('the eight real stars: each spectral type letter matches the class its temperature falls in', () => {
  const expected = { Spica: 'B', Rigel: 'B', Vega: 'A', Sirius: 'A', Procyon: 'F', 'the Sun': 'G', Arcturus: 'K', Betelgeuse: 'M' };
  assert.equal(Spectra.REAL_STARS.length, 8);
  Spectra.REAL_STARS.forEach((star) => {
    assert.equal(star.type[0], expected[star.name], star.name);
    assert.equal(Spectra.classForTemperature(star.temperatureK).letter, star.type[0], star.name);
    assert.match(star.type, /^[OBAFGKM][0-9]$/);
  });
  assert.equal(Spectra.REAL_STARS.find((s) => s.name === 'the Sun').type, 'G2');
  assert.equal(Spectra.REAL_STARS.find((s) => s.name === 'the Sun').temperatureK, SpecData.CONSTANTS.photosphereTemperatureK);
});

test('every real star\'s first clue is enough on its own: no two stars of different classes share the same clue text', () => {
  const clueText = (star) => {
    const cls = Spectra.classForTemperature(star.temperatureK);
    if (star.clue === 'colour') return cls.colour;
    if (star.clue === 'lines') return cls.strongest;
    return Spectra.classForTemperature(star.temperatureK).letter + star.temperatureK;
  };
  Spectra.REAL_STARS.forEach((a) => {
    Spectra.REAL_STARS.forEach((b) => {
      if (a.type[0] === b.type[0] || a.clue !== b.clue || a.clue === 'temperature') return;
      assert.notEqual(clueText(a), clueText(b), `${a.name} / ${b.name}`);
    });
  });
});

test('a hotter class always has a shorter peak wavelength', () => {
  const peaks = Spectra.SPECTRAL_CLASSES.map((c) => Spectra.peakWavelengthNm(c.minK));
  for (let i = 1; i < peaks.length; i += 1) assert.ok(peaks[i] > peaks[i - 1]);
});
