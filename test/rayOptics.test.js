const test = require('node:test');
const assert = require('node:assert/strict');
const RayOptics = require('../src/rayOptics');

test('a thin lens brings parallel rays to a point at its focal length', () => {
  const focalLengthMm = 200;
  [5, 10, 40].forEach((heightMm) => {
    const afterLens = RayOptics.refractRay({ height: heightMm, angle: 0 }, focalLengthMm);
    assert.ok(Math.abs(RayOptics.focusDistanceMm(afterLens) - focalLengthMm) < 1e-9, `ray at height ${heightMm}`);
  });
});

test("Keplerian (1000 mm objective, 25 mm eyepiece): separation 1025 mm, afocal, magnification -40", () => {
  const fObjectiveMm = 1000;
  const fEyepieceMm = 25;
  assert.equal(RayOptics.afocalSeparationMm(fObjectiveMm, fEyepieceMm), 1025);
  assert.equal(RayOptics.angularMagnification(fObjectiveMm, fEyepieceMm), -40);

  const onAxis = RayOptics.traceAfocalSystem(fObjectiveMm, fEyepieceMm, 0, 10);
  assert.equal(onAxis.separationMm, 1025);
  assert.ok(Math.abs(onAxis.emergingAngleRad) < 1e-9, 'an on-axis source emerges parallel (afocal)');
});

test('Galilean (500 mm objective, -50 mm eyepiece): separation 450 mm, afocal, magnification +10', () => {
  const fObjectiveMm = 500;
  const fEyepieceMm = -50;
  assert.equal(RayOptics.afocalSeparationMm(fObjectiveMm, fEyepieceMm), 450);
  assert.equal(RayOptics.angularMagnification(fObjectiveMm, fEyepieceMm), 10);

  const onAxis = RayOptics.traceAfocalSystem(fObjectiveMm, fEyepieceMm, 0, 10);
  assert.equal(onAxis.separationMm, 450);
  assert.ok(Math.abs(onAxis.emergingAngleRad) < 1e-9, 'an on-axis source emerges parallel (afocal)');
});

test('the emerging-angle ratio from traced rays matches f_objective / f_eyepiece for the refractors', () => {
  const incomingAngleRad = 0.01;

  const keplerian = RayOptics.traceAfocalSystem(1000, 25, incomingAngleRad);
  assert.ok(Math.abs(keplerian.emergingAngleRad / incomingAngleRad - -40) < 1e-9);

  const galilean = RayOptics.traceAfocalSystem(500, -50, incomingAngleRad);
  assert.ok(Math.abs(galilean.emergingAngleRad / incomingAngleRad - 10) < 1e-9);
});

test('Newtonian (1000 mm primary, 45° flat diagonal 800 mm from the primary): beam turned 90°, total path 1000 mm', () => {
  const result = RayOptics.newtonianSystem(1000, 800, 45);
  assert.equal(result.totalPathMm, 1000);
  assert.equal(result.turnAngleDeg, 90);

  // Wherever the diagonal sits along the converging beam, the total
  // path to focus is still just the primary's own focal length.
  const diagonalElsewhere = RayOptics.newtonianSystem(1000, 600, 45);
  assert.equal(diagonalElsewhere.totalPathMm, 1000);
});

test('Cassegrain (1000 mm primary, -250 mm convex secondary, 800 mm separation): effective focal length 5000 mm, image 200 mm behind the primary, tube much shorter than the focal length', () => {
  const result = RayOptics.cassegrainSystem(1000, -250, 800);
  assert.equal(result.effectiveFocalLengthMm, 5000);
  assert.equal(result.imageDistanceBehindPrimaryMm, 200);
  assert.ok(800 < result.effectiveFocalLengthMm / 2, 'the tube (separation) is much shorter than the focal length');
});

test('through the eyepiece: true field of view and whether a target fits', () => {
  assert.equal(RayOptics.trueFieldOfViewDeg(50, 40), 1.25);

  const moonApparentSizeDeg = RayOptics.apparentSizeDeg(40, 0.52);
  assert.ok(Math.abs(moonApparentSizeDeg - 20.8) < 1e-9);
  assert.ok(moonApparentSizeDeg < 50, 'the Moon fits inside the eyepiece\'s own 50° apparent field at 40x');

  const pleiadesTrueSizeDeg = 1.8;
  assert.ok(RayOptics.apparentSizeDeg(40, pleiadesTrueSizeDeg) > 50, 'the Pleiades do not fit at 40x');

  assert.equal(RayOptics.trueFieldOfViewDeg(50, 25), 2.0);
  assert.ok(RayOptics.apparentSizeDeg(25, pleiadesTrueSizeDeg) < 50, 'the Pleiades fit at 25x, true field 2.0°');
});

// --- Galilean vs Keplerian, matched parameters (f_objective = 500 mm, |f_eyepiece| = 50 mm) --

const MATCHED_F_OBJECTIVE_MM = 500;
const MATCHED_F_EYEPIECE_MM = 50;

test('Galilean separation 450 mm, Keplerian 550 mm', () => {
  assert.equal(RayOptics.afocalSeparationMm(MATCHED_F_OBJECTIVE_MM, -MATCHED_F_EYEPIECE_MM), 450);
  assert.equal(RayOptics.afocalSeparationMm(MATCHED_F_OBJECTIVE_MM, MATCHED_F_EYEPIECE_MM), 550);
});

test('angular magnification is +10 for Galilean and -10 for Keplerian', () => {
  assert.equal(RayOptics.angularMagnification(MATCHED_F_OBJECTIVE_MM, -MATCHED_F_EYEPIECE_MM), 10);
  assert.equal(RayOptics.angularMagnification(MATCHED_F_OBJECTIVE_MM, MATCHED_F_EYEPIECE_MM), -10);
});

test('the marginal ray from an on-axis star crosses the axis at 500 mm, the objective’s own focal point', () => {
  const ray = { height: 10, angle: 0 };
  const afterObjective = RayOptics.refractRay(ray, MATCHED_F_OBJECTIVE_MM);
  assert.equal(RayOptics.focusDistanceMm(afterObjective), MATCHED_F_OBJECTIVE_MM);
});

test('for Keplerian the crossing is before the eyepiece (a real intermediate image); for Galilean it is beyond the eyepiece (no real image)', () => {
  const keplerianPosition = RayOptics.afocalSeparationMm(MATCHED_F_OBJECTIVE_MM, MATCHED_F_EYEPIECE_MM);
  const galileanPosition = RayOptics.afocalSeparationMm(MATCHED_F_OBJECTIVE_MM, -MATCHED_F_EYEPIECE_MM);

  assert.equal(RayOptics.formsRealIntermediateImage(MATCHED_F_OBJECTIVE_MM, keplerianPosition), true);
  assert.equal(RayOptics.formsRealIntermediateImage(MATCHED_F_OBJECTIVE_MM, galileanPosition), false);

  const keplerian = RayOptics.refractorImageDescription(MATCHED_F_OBJECTIVE_MM, MATCHED_F_EYEPIECE_MM);
  const galilean = RayOptics.refractorImageDescription(MATCHED_F_OBJECTIVE_MM, -MATCHED_F_EYEPIECE_MM);
  assert.equal(keplerian.realImage, true);
  assert.equal(galilean.realImage, false);
});

test('the emerging rays are parallel in both, and the beam is one tenth of the objective’s width', () => {
  [MATCHED_F_EYEPIECE_MM, -MATCHED_F_EYEPIECE_MM].forEach((fEyepieceSignedMm) => {
    const traced = RayOptics.traceAfocalSystem(MATCHED_F_OBJECTIVE_MM, fEyepieceSignedMm, 0, 10);
    assert.ok(Math.abs(traced.emergingAngleRad) < 1e-9, `expected parallel emerging rays, got angle ${traced.emergingAngleRad}`);
  });

  const objectiveDiameterMm = 100;
  const magnification = RayOptics.angularMagnification(MATCHED_F_OBJECTIVE_MM, MATCHED_F_EYEPIECE_MM);
  assert.equal(Math.abs(magnification), 10);
  assert.equal(RayOptics.exitBeamWidthMm(objectiveDiameterMm, magnification), objectiveDiameterMm / 10);
});

test('the Galilean eyepiece label contains "concave" and "diverging"; the Keplerian contains "convex" and "converging"', () => {
  const galilean = RayOptics.eyepieceLensDescription(-MATCHED_F_EYEPIECE_MM);
  assert.ok(galilean.label.includes('concave'));
  assert.ok(galilean.label.includes('diverging'));
  assert.equal(galilean.converging, false);

  const keplerian = RayOptics.eyepieceLensDescription(MATCHED_F_EYEPIECE_MM);
  assert.ok(keplerian.label.includes('convex'));
  assert.ok(keplerian.label.includes('converging'));
  assert.equal(keplerian.converging, true);
});

test('each design reports the correct image type — Keplerian: real, inverted; Galilean: no real image, upright', () => {
  const keplerian = RayOptics.refractorImageDescription(MATCHED_F_OBJECTIVE_MM, MATCHED_F_EYEPIECE_MM);
  assert.equal(keplerian.realImage, true);
  assert.equal(keplerian.orientation, 'inverted');

  const galilean = RayOptics.refractorImageDescription(MATCHED_F_OBJECTIVE_MM, -MATCHED_F_EYEPIECE_MM);
  assert.equal(galilean.realImage, false);
  assert.equal(galilean.orientation, 'upright');
});
