/**
 * The binaries, clusters and eyepiece engine (src/binariesClusters.js)
 * behind notes/binaries-and-clusters.html, and the star-view drawing rule
 * it shares with notes/telescopes.html (src/starView.js).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../src/binariesClusters');
const StarView = require('../src/starView');
const StarPatterns = require('../src/starPatterns');
const TelescopeModel = require('../src/telescopeModel');

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('binary orbits: the heavier star is closer to the centre of mass, r1 / r2 = m2 / m1, and the two are always opposite', () => {
  [1, 1.5, 2, 3, 4].forEach((q) => {
    [0, 45, 170, 300].forEach((phase) => {
      const p = B.binaryPositions(q, 200, phase);
      close(p.r1 + p.r2, 200, 1e-9, 'separation');
      close(p.r1 / p.r2, 1 / q, 1e-9, 'ratio');
      // Centre of mass at the origin: m1 r1 = m2 r2, positions opposite.
      close(q * p.star1.x + p.star2.x, 0, 1e-9, 'x balance');
      close(q * p.star1.y + p.star2.y, 0, 1e-9, 'y balance');
    });
  });
});

test('radial velocities: the stars always move in opposite directions along the line of sight, the heavier one slower', () => {
  [1, 2, 4].forEach((q) => {
    [10, 100, 200, 300].forEach((phase) => {
      const v = B.radialVelocities(q, phase, 60);
      assert.ok(v.star1 * v.star2 <= 0, `opposite at ${phase}`);
      close(Math.abs(v.star1) * q, Math.abs(v.star2), 1e-9, 'heavier is slower');
    });
  });
  // Receding gives a longer wavelength, approaching a shorter one.
  assert.ok(B.shiftedLineNm(656.3, 30) > 656.3);
  assert.ok(B.shiftedLineNm(656.3, -30) < 656.3);
});

test('a bigger aperture shows fainter stars; a town sky hides about two magnitudes', () => {
  close(B.limitingMagnitude(7), 2 + 5 * Math.log10(7), 1e-12, 'eye');
  assert.ok(B.limitingMagnitude(50) > B.limitingMagnitude(7));
  assert.ok(B.limitingMagnitude(250) > B.limitingMagnitude(50));
  close(B.limitingMagnitude(100) - B.limitingMagnitude(100, false), 2, 1e-12, 'town');
});

test('higher magnification makes an extended object dimmer: doubling it quarters the surface brightness', () => {
  close(B.surfaceBrightness(100, 50) / B.surfaceBrightness(100, 100), 4, 1e-9, 'quarter');
  assert.equal(B.surfaceBrightness(7, 1), 1, 'the naked eye is the brightest possible');
  assert.equal(B.surfaceBrightness(200, 10), 1, 'a beam wider than the eye’s pupil is capped');
  close(B.exitPupilMm(100, 50), 2, 1e-12, 'exit pupil');
  close(B.trueFieldArcmin(50), 60, 1e-12, 'field');
});

test('pairs split only when the aperture resolves them AND the magnification shows the gap', () => {
  const mizar = B.objectById('mizar');
  const close2 = B.objectById('binary');
  assert.equal(B.pairStatus(mizar.separationArcsec, 7, 1), 'aperture', 'Mizar is one star to the naked eye');
  assert.equal(B.pairStatus(mizar.separationArcsec, 50, 10), 'split', 'binoculars split Mizar');
  assert.equal(B.pairStatus(close2.separationArcsec, 50, 100), 'aperture', '50 mm cannot resolve 2 arcseconds');
  assert.equal(B.pairStatus(close2.separationArcsec, 80, 40), 'split', '80 mm at 40x splits it');
  assert.equal(B.pairStatus(close2.separationArcsec, 250, 10), 'magnification', 'resolved, but 10x is too little to see the gap');
  // The resolution itself is the Telescopes page's own formula.
  close(B.resolutionArcsec(100), TelescopeModel.resolutionArcsec(550, 100), 1e-12, 'shared formula');
  assert.equal(close2.separationArcsec, 2.0, 'same simulated separation as the Telescopes page');
});

test('what each object looks like, by aperture, sky and photograph', () => {
  const at = (id, apertureMm, magnification, extra = {}) => B.viewOf(id, { apertureMm, magnification, ...extra });
  // Globular: fuzzy ball in binoculars, edges resolve in a big telescope, core never.
  assert.equal(at('m13', 50, 10).edgeStarsResolved, false);
  assert.equal(at('m13', 250, 150).edgeStarsResolved, true);
  assert.equal(at('m13', 300, 250).coreResolved, false);
  // Nebula: colours only in a photograph.
  assert.equal(at('m42', 300, 40).colours, false);
  assert.equal(at('m42', 80, 40, { photograph: true }).colours, true);
  // Galaxy: core only in binoculars; disc and dust lanes need aperture and a dark sky; arms need a photograph.
  assert.deepEqual([at('m31', 50, 10).disc, at('m31', 50, 10).spiralArms], [false, false]);
  assert.equal(at('m31', 150, 30).disc, true);
  assert.equal(at('m31', 150, 30, { darkSky: false }).disc, false);
  assert.equal(at('m31', 250, 40).dustLanes, true);
  assert.equal(at('m31', 300, 40).spiralArms, false);
  assert.equal(at('m31', 80, 20, { photograph: true }).spiralArms, true);
});

test('seven objects, one for each part of 13.34, with magnitudes taken from the naked-eye sky data', () => {
  assert.deepEqual(B.OBJECTS.map((o) => o.spec), ['13.34a', '13.34b', '13.34c', '13.34d', '13.34e', '13.34f', '13.34g']);
  assert.deepEqual(B.OBJECTS.map((o) => o.kind), ['star', 'double', 'double', 'open', 'globular', 'nebula', 'galaxy']);
  assert.equal(B.objectById('mizar').magnitudes[0], StarPatterns.STARS.mizar.mag);
  assert.equal(B.objectById('pleiades').brightestMag, StarPatterns.STARS.alcyone.mag);
  assert.equal(B.objectById('m31').totalMag, StarPatterns.STARS.andromedaGalaxy.mag);
  // Every fact quoting a size agrees with the size the simulator draws.
  assert.ok(B.objectById('mizar').facts.some((f) => f.includes(`${B.objectById('mizar').separationArcsec} arcseconds`)));
  assert.ok(B.objectById('m13').facts.some((f) => f.includes(`${B.objectById('m13').sizeArcmin} arcminutes`)));
  assert.ok(B.objectById('m13').facts.some((f) => f.includes(`${B.objectById('m13').totalMag}`)));
});

test('the cluster table: number, shape, age (units in the heading), place and example', () => {
  assert.deepEqual(B.CLUSTER_TABLE.map((r) => r.feature), ['Number of stars', 'Shape', 'Typical age (years)', 'Where in the Galaxy', 'Example']);
  const row = (f) => B.CLUSTER_TABLE.find((r) => r.feature === f);
  assert.match(row('Where in the Galaxy').open, /disc/);
  assert.match(row('Where in the Galaxy').globular, /halo/);
  assert.match(row('Example').open, /Pleiades/);
  assert.match(row('Example').globular, /M13/);
});

test('shared star view: the blur radius is the resolution, capped at a fifth of the field and never under 2.5 px', () => {
  assert.equal(StarView.blurRadiusPx(2, 6, 50), 66);
  assert.equal(StarView.blurRadiusPx(1, 6, 50), 50);
  assert.equal(StarView.blurRadiusPx(0.01, 6, 50), 2.5);
});
