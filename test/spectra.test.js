const test = require('node:test');
const assert = require('node:assert/strict');
const Spectra = require('../src/spectra');
const SpecData = require('../src/specData');

test('line positions: hydrogen Balmer 656.3, 486.1, 434.0, 410.2 nm and sodium 589.0, 589.6 nm, as given', () => {
  assert.deepEqual(Spectra.ELEMENTS.hydrogen.lines, [656.3, 486.1, 434.0, 410.2]);
  assert.deepEqual(Spectra.ELEMENTS.sodium.lines, [589.0, 589.6]);
});

test('line positions: helium 447.1, 501.6, 587.6, 667.8 nm and calcium 393.4, 396.8, 422.7 nm', () => {
  assert.deepEqual(Spectra.ELEMENTS.helium.lines, [447.1, 501.6, 587.6, 667.8]);
  assert.deepEqual(Spectra.ELEMENTS.calcium.lines, [393.4, 396.8, 422.7]);
});

test('every reference line lies inside the drawn range, 380-700 nm', () => {
  Spectra.ELEMENT_KEYS.forEach((key) => {
    Spectra.ELEMENTS[key].lines.forEach((nm) => {
      assert.ok(nm >= Spectra.RANGE_NM.min && nm <= Spectra.RANGE_NM.max, `${key} ${nm} nm`);
    });
  });
});

test('the match tolerance is smaller than the gap between any two different elements\' lines', () => {
  const all = Spectra.ELEMENT_KEYS.flatMap((key) => Spectra.ELEMENTS[key].lines.map((nm) => ({ key, nm })));
  all.forEach((a) => {
    all.forEach((b) => {
      if (a.key === b.key) return;
      assert.ok(Math.abs(a.nm - b.nm) > 2 * Spectra.MATCH_TOLERANCE_NM, `${a.key} ${a.nm} vs ${b.key} ${b.nm}`);
    });
  });
});

test('linesFor returns the combined, sorted line list', () => {
  assert.deepEqual(Spectra.linesFor(['sodium', 'calcium']), [393.4, 396.8, 422.7, 589.0, 589.6]);
});

test('dopplerShift: no motion gives no shift', () => {
  assert.equal(Spectra.dopplerShift(656.3, 0), 656.3);
});

test('dopplerShift: receding lengthens the wavelength (redshift), approaching shortens it (blueshift)', () => {
  assert.ok(Spectra.dopplerShift(656.3, 30000) > 656.3);
  assert.ok(Spectra.dopplerShift(656.3, -30000) < 656.3);
  assert.equal(Spectra.shiftDirection(30000), 'redshift');
  assert.equal(Spectra.shiftDirection(-30000), 'blueshift');
  assert.equal(Spectra.shiftDirection(0), 'none');
});

test('dopplerShift: a bigger speed gives a bigger shift, in proportion', () => {
  const small = Spectra.dopplerShift(656.3, 10000) - 656.3;
  const big = Spectra.dopplerShift(656.3, 20000) - 656.3;
  assert.ok(Math.abs(big - 2 * small) < 1e-9);
});

test('dopplerShift uses the data sheet speed of light: 30 km/s shifts 656.3 nm by about 0.066 nm', () => {
  assert.equal(Spectra.SPEED_OF_LIGHT_M_PER_S, SpecData.CONSTANTS.speedOfLightMPerS);
  const shift = Spectra.dopplerShift(656.3, 30000) - 656.3;
  assert.ok(Math.abs(shift - 0.06563) < 1e-6, `shift = ${shift}`);
});

test('radialVelocityFromShift inverts dopplerShift', () => {
  [-50000, -1200, 0, 800, 42000].forEach((v) => {
    const observed = Spectra.dopplerShift(486.1, v);
    assert.ok(Math.abs(Spectra.radialVelocityFromShift(486.1, observed) - v) < 1e-6);
  });
});

test('dopplerShift moves every line by the same fraction, so the pattern keeps its shape', () => {
  const lines = Spectra.ELEMENTS.hydrogen.lines;
  const shifted = lines.map((nm) => Spectra.dopplerShift(nm, 15000));
  const ratios = shifted.map((s, i) => s / lines[i]);
  ratios.forEach((r) => assert.ok(Math.abs(r - ratios[0]) < 1e-12));
});

test('matchElements: Star X (hydrogen, sodium, calcium) matches exactly those three', () => {
  const star = Spectra.PUZZLE_STARS.find((s) => s.id === 'x');
  assert.deepEqual(Spectra.elementsPresent(Spectra.linesFor(star.elements)), ['hydrogen', 'sodium', 'calcium']);
});

test('matchElements: Star Y (hydrogen, helium) matches exactly those two', () => {
  const star = Spectra.PUZZLE_STARS.find((s) => s.id === 'y');
  assert.deepEqual(Spectra.elementsPresent(Spectra.linesFor(star.elements)), ['hydrogen', 'helium']);
});

test('matchElements: one matching line is not enough — the whole pattern must be there', () => {
  // 589.0 alone (without 589.6) is not sodium; helium's 587.6 alone is not helium.
  const result = Spectra.matchElements([589.0, 587.6]);
  assert.equal(result.find((r) => r.key === 'sodium').present, false);
  assert.deepEqual(result.find((r) => r.key === 'sodium').missing, [589.6]);
  assert.equal(result.find((r) => r.key === 'helium').present, false);
});

test('matchElements: lines within the tolerance still match; lines just outside it do not', () => {
  const nudged = Spectra.ELEMENTS.calcium.lines.map((nm) => nm + 0.2);
  assert.deepEqual(Spectra.elementsPresent(nudged), ['calcium']);
  const tooFar = Spectra.ELEMENTS.calcium.lines.map((nm) => nm + 0.5);
  assert.deepEqual(Spectra.elementsPresent(tooFar), []);
});

test('matchElements: a Doppler-shifted pattern no longer matches the lab pattern', () => {
  const shifted = Spectra.linesFor(['hydrogen']).map((nm) => Spectra.dopplerShift(nm, 300000));
  assert.deepEqual(Spectra.elementsPresent(shifted), []);
});

test('spectrumType: Kirchhoff\'s three set-ups', () => {
  assert.equal(Spectra.spectrumType({ sourceOn: true, cloudInFront: false, view: 'through' }), 'continuous');
  assert.equal(Spectra.spectrumType({ sourceOn: true, cloudInFront: true, view: 'through' }), 'absorption');
  assert.equal(Spectra.spectrumType({ sourceOn: true, cloudInFront: true, view: 'side' }), 'emission');
});

test('spectrumType: no light reaches the viewer with the source off, or from the side with no cloud', () => {
  assert.equal(Spectra.spectrumType({ sourceOn: false, cloudInFront: true, view: 'through' }), 'none');
  assert.equal(Spectra.spectrumType({ sourceOn: false, cloudInFront: true, view: 'side' }), 'none');
  assert.equal(Spectra.spectrumType({ sourceOn: true, cloudInFront: false, view: 'side' }), 'none');
});

test('intensityAt: absorption dips at a line centre and recovers away from it; emission peaks there on a dark background', () => {
  const lines = [{ nm: 500, depth: 0.8 }];
  const absorptionAtLine = Spectra.intensityAt(500, { type: 'absorption', lines });
  const absorptionAway = Spectra.intensityAt(560, { type: 'absorption', lines });
  assert.ok(Math.abs(absorptionAtLine - 0.2) < 1e-9);
  assert.ok(absorptionAway > 0.999);
  assert.ok(Math.abs(Spectra.intensityAt(500, { type: 'emission', lines }) - 0.8) < 1e-9);
  assert.ok(Spectra.intensityAt(560, { type: 'emission', lines }) < 0.001);
  assert.equal(Spectra.intensityAt(500, { type: 'continuous', lines }), 1);
  assert.equal(Spectra.intensityAt(500, { type: 'none', lines }), 0);
});

test('peakWavelengthNm: hotter stars peak at shorter wavelengths', () => {
  const temps = Spectra.EXAMPLE_STARS.map((s) => s.temperatureK);
  const peaks = temps.map(Spectra.peakWavelengthNm);
  for (let i = 1; i < temps.length; i += 1) {
    assert.ok(temps[i] > temps[i - 1]);
    assert.ok(peaks[i] < peaks[i - 1]);
  }
  assert.ok(Math.abs(Spectra.peakWavelengthNm(5800) - 500) < 2);
});

test('blackbodyCurve: normalised to 1 at its peak, and the peak sits at Wien\'s wavelength when that is in range', () => {
  const curve = Spectra.blackbodyCurve(5800, 300, 1000, 700);
  const max = curve.reduce((best, p) => (p.value > best.value ? p : best));
  assert.ok(Math.abs(max.value - 1) < 1e-12);
  assert.ok(Math.abs(max.nm - Spectra.peakWavelengthNm(5800)) < 2);
});

test('starColourName: hotter is bluer', () => {
  assert.equal(Spectra.starColourName(3500), 'red');
  assert.equal(Spectra.starColourName(5800), 'yellow');
  assert.equal(Spectra.starColourName(10000), 'white');
  assert.equal(Spectra.starColourName(20000), 'blue-white');
});

test('starRgb: hotter stars are drawn bluer (blue-to-red ratio rises with temperature)', () => {
  const ratios = [3500, 5800, 10000, 20000].map((t) => {
    const [r, , b] = Spectra.starRgb(t);
    return b / r;
  });
  for (let i = 1; i < ratios.length; i += 1) assert.ok(ratios[i] > ratios[i - 1], `${ratios}`);
});

test('EXAMPLE_STARS: the Sun-like star uses the data sheet photosphere temperature; only the hot star shows helium', () => {
  const sun = Spectra.EXAMPLE_STARS.find((s) => s.id === 'sun');
  assert.equal(sun.temperatureK, SpecData.CONSTANTS.photosphereTemperatureK);
  Spectra.EXAMPLE_STARS.forEach((star) => {
    assert.equal(Boolean(star.strengths.helium), star.id === 'hot', star.id);
  });
});

test('linesForStrengths: depth follows the stated strength', () => {
  const lines = Spectra.linesForStrengths({ hydrogen: 'strong', calcium: 'weak' });
  lines.filter((l) => l.element === 'hydrogen').forEach((l) => assert.equal(l.depth, Spectra.STRENGTH_DEPTH.strong));
  lines.filter((l) => l.element === 'calcium').forEach((l) => assert.equal(l.depth, Spectra.STRENGTH_DEPTH.weak));
  assert.equal(lines.length, 4 + 3);
});

test('wavelengthToRgb: violet end is blue-ish, red end is red, outside the visible range is black', () => {
  const [r1, g1, b1] = Spectra.wavelengthToRgb(420);
  assert.ok(b1 > r1 && b1 > g1);
  const [r2, g2, b2] = Spectra.wavelengthToRgb(660);
  assert.ok(r2 > g2 && r2 > b2);
  assert.deepEqual(Spectra.wavelengthToRgb(300), [0, 0, 0]);
});

test('pixelCounts: doubling the exposure doubles every count, until a pixel fills', () => {
  const rates = [10, 250, 1200];
  const short = Spectra.pixelCounts(rates, 2);
  const long = Spectra.pixelCounts(rates, 4);
  long.forEach((count, i) => assert.equal(count, 2 * short[i]));
  assert.deepEqual(Spectra.pixelCounts([1000], 100, 50000), [50000]);
});
