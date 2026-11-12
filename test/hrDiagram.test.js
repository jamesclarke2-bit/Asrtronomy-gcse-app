/**
 * The HR diagram engine (src/hrDiagram.js) behind notes/hr-diagram.html:
 * the two linked y-axes, the hottest-left temperature axis, the main
 * sequence band, the regions, the ten plotted stars and distances read
 * from the main sequence.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../src/hrDiagram');
const Spectra = require('../src/spectra');
const Magnitude = require('../src/magnitude');
const SpecData = require('../src/specData');

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('luminosity and absolute magnitude are tied by M = 4.8 - 2.5 log L, so the Sun (L = 1) is +4.8', () => {
  assert.equal(H.SUN_ABSOLUTE_MAGNITUDE, 4.8);
  close(H.magnitudeFromLuminosity(1), 4.8, 1e-12, 'Sun');
  close(H.magnitudeFromLuminosity(100), -0.2, 1e-12, '100 x Sun is 5 magnitudes brighter');
  [1e-4, 0.3, 1, 42, 1e5].forEach((L) => close(H.luminosityFromMagnitude(H.magnitudeFromLuminosity(L)), L, L * 1e-9, `round trip ${L}`));
});

test('axes: luminosity 10^6 at the top (most negative M) to 10^-6 at the bottom; temperature hottest on the left', () => {
  close(H.AXES.mTop, -10.2, 1e-9, 'top');
  close(H.AXES.mBottom, 19.8, 1e-9, 'bottom');
  const plot = H.makePlot({ x0: 70, x1: 570, yTop: 40, yBottom: 440 });
  assert.ok(plot.xForT(30000) < plot.xForT(3000), 'hotter is further left');
  assert.ok(plot.yForM(-5) < plot.yForM(10), 'brighter (more negative M) is higher');
  assert.ok(plot.yForL(1e4) < plot.yForL(1), 'more luminous is higher');
  close(plot.xForT(40000), 70, 1e-9, 'left edge');
  close(plot.xForT(2400), 570, 1e-9, 'right edge');
  close(plot.tForX(plot.xForT(6543)), 6543, 1e-6, 'x round trip');
  close(plot.mForY(plot.yForM(3.3)), 3.3, 1e-9, 'y round trip');
  // A log scale: equal temperature ratios are equal distances.
  close(plot.xForT(20000) - plot.xForT(40000), plot.xForT(5000) - plot.xForT(10000), 1e-9, 'log scale');
});

test('the main sequence runs from top left to bottom right, through the Sun at +4.8', () => {
  close(H.mainSequenceMagnitude(SpecData.CONSTANTS.photosphereTemperatureK), 4.8, 1e-9, 'Sun');
  const pts = H.MAIN_SEQUENCE_CENTRE;
  for (let i = 1; i < pts.length; i += 1) {
    assert.ok(pts[i][0] < pts[i - 1][0], 'cooler along the list');
    assert.ok(pts[i][1] > pts[i - 1][1], 'and fainter');
  }
  const r = H.mainSequenceRange(5800);
  close(r.bright, 3.8, 1e-9, 'band top');
  close(r.faint, 5.8, 1e-9, 'band bottom');
});

test('every plotted star lies in its own group\'s region and in no other', () => {
  const ids = ['main-sequence', ...H.REGIONS.map((r) => r.id)];
  H.STARS.forEach((s) => {
    const inside = ids.filter((id) => H.inRegion(id, s.temperatureK, s.absoluteMagnitude));
    assert.deepEqual(inside, [s.group], s.name);
  });
});

test('the ten stars: the eight from Colour, temperature and spectral type, plus Sirius B and Proxima Centauri', () => {
  assert.equal(H.STARS.length, 10);
  Spectra.REAL_STARS.forEach((r) => {
    const s = H.STARS.find((x) => x.name === r.name);
    assert.ok(s, r.name);
    assert.equal(s.type, r.type, r.name);
    assert.equal(s.temperatureK, r.temperatureK, r.name);
  });
  const siriusB = H.STARS.find((s) => s.name === 'Sirius B');
  assert.equal(siriusB.group, 'white-dwarfs');
  const proxima = H.STARS.find((s) => s.name === 'Proxima Centauri');
  assert.equal(proxima.group, 'main-sequence');
  assert.equal(Spectra.classForTemperature(proxima.temperatureK).letter, 'M');
  const sun = H.STARS.find((s) => s.name === 'the Sun');
  assert.equal(sun.absoluteMagnitude, 4.8);
  close(sun.luminosity, 1, 1e-12, 'Sun luminosity');
  H.STARS.forEach((s) => close(s.luminosity, H.luminosityFromMagnitude(s.absoluteMagnitude), 1e-12, s.name));
});

test('sketch feedback: each label is right in its region and wrong in the others\' centres', () => {
  const centres = {
    'main-sequence': [10000, 0.9],
    sun: [5800, 4.8],
    supergiants: [10000, -7.5],
    'blue-giants': [17000, -4.0],
    'red-giants': [4200, -0.5],
    'white-dwarfs': [16000, 12],
  };
  Object.keys(centres).forEach((id) => {
    const [t, m] = centres[id];
    assert.ok(H.placementCorrect(id, t, m), `${id} at its own centre`);
  });
  // A white dwarf label at the top right, or a red giant label at the bottom left, is wrong.
  assert.equal(H.placementCorrect('white-dwarfs', 4000, -1), false);
  assert.equal(H.placementCorrect('red-giants', 16000, 12), false);
  assert.equal(H.placementCorrect('supergiants', 5800, 4.8), false);
  assert.equal(H.placementCorrect('sun', 16000, 12), false);
  assert.equal(H.placementCorrect('sun', 30000, -3.6), false, 'the Sun is in the middle of the band, not its hot end');
  assert.equal(H.placementCorrect('blue-giants', 3500, -3), false);
  assert.equal(H.placementCorrect('main-sequence', 16000, 12), false);
});

test('worked example: a G2 main-sequence star with m = +9.8 is 100 pc away, between 63 and 158 pc, uncertainty about 48 pc', () => {
  const d = H.distanceFromMainSequence(5800, 9.8);
  assert.equal(d.M, 4.8);
  close(d.modulus, 5, 1e-9, 'm - M');
  close(d.distancePc, 100, 1e-9, 'best estimate');
  close(d.nearPc, 63.1, 0.05, 'near');
  close(d.farPc, 158.5, 0.05, 'far');
  close(d.uncertaintyPc, 47.7, 0.05, 'half the range');
  // The same answer as the data sheet formula M = m + 5 - 5 log d.
  close(9.8 + 5 - 5 * Math.log10(d.distancePc), d.M, 1e-9, 'formula');
  close(Magnitude.absoluteFromApparent(9.8, d.distancePc), 4.8, 1e-9, 'Magnitude engine agrees');
});

test('distance types: each sits inside its own spectral class, and its range always brackets the best estimate', () => {
  H.DISTANCE_TYPES.forEach(({ type, temperatureK }) => {
    assert.equal(Spectra.classForTemperature(temperatureK).letter, type[0], type);
    const d = H.distanceFromMainSequence(temperatureK, 10);
    assert.ok(d.nearPc < d.distancePc && d.distancePc < d.farPc, type);
    close(d.uncertaintyPc, (d.farPc - d.nearPc) / 2, 1e-9, type);
  });
});

test('signed magnitudes always show their own sign, with a true minus sign', () => {
  assert.equal(H.signed(4.8), '+4.8');
  assert.equal(H.signed(-3.5), '−3.5');
  assert.equal(H.signed(0), '0.0');
  assert.equal(H.signed(-0.04), '0.0');
});
