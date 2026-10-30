/**
 * src/moonPhasesDiagrams.js's pure geometry/data: the new sims/moon-phases.html
 * diagrams for perigee/apogee + the supermoon/micromoon size comparison,
 * the eight named phases in order, and earthshine's crescent.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const MoonPhasesDiagrams = require('../src/moonPhasesDiagrams');
const MoonPhase = require('../src/moonPhase');

test('ORBIT_SCALE_KM matches the task\'s own rounded perigee/apogee figures', () => {
  assert.equal(MoonPhasesDiagrams.ORBIT_SCALE_KM.perigeeKm, 363000);
  assert.equal(MoonPhasesDiagrams.ORBIT_SCALE_KM.apogeeKm, 405000);
});

test('SUPERMOON_WIDTH_RATIO: a supermoon is about 14% wider than a micromoon', () => {
  assert.equal(MoonPhasesDiagrams.SUPERMOON_WIDTH_RATIO, 1.14);
});

test('moonRadiusPx: supermoon is drawn at baseRadiusPx * 1.14, micromoon at baseRadiusPx', () => {
  assert.equal(MoonPhasesDiagrams.moonRadiusPx(100, 'micromoon'), 100);
  assert.ok(Math.abs(MoonPhasesDiagrams.moonRadiusPx(100, 'supermoon') - 114) < 1e-9);
});

// --- Ellipse geometry -------------------------------------------------

test('ellipseSemiMinorPx: a circle (eccentricity 0) has equal semi-minor and semi-major axes', () => {
  assert.equal(MoonPhasesDiagrams.ellipseSemiMinorPx(150, 0), 150);
});

test('ellipseSemiMinorPx: a stretched ellipse has a smaller semi-minor axis', () => {
  const b = MoonPhasesDiagrams.ellipseSemiMinorPx(150, 0.1647);
  assert.ok(b < 150 && b > 140, `expected a slightly-shrunk semi-minor axis, got ${b}`);
});

test('ellipseFocusOffsetPx: a circle (eccentricity 0) has its focus at the centre', () => {
  assert.equal(MoonPhasesDiagrams.ellipseFocusOffsetPx(150, 0), 0);
});

// --- Eight named phases -------------------------------------------------

test('EIGHT_PHASE_THETAS: 8 angles, evenly spaced 45 degrees apart, starting at New Moon (0)', () => {
  assert.deepEqual(MoonPhasesDiagrams.EIGHT_PHASE_THETAS, [0, 45, 90, 135, 180, 225, 270, 315]);
});

test('eightPhases: names match MoonPhase.phaseName exactly, in the standard order', () => {
  const phases = MoonPhasesDiagrams.eightPhases(MoonPhase);
  assert.deepEqual(
    phases.map((p) => p.name),
    ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
  );
});

test('eightPhases: waxing is true for the first half (New to Full), false for the second (Full to New)', () => {
  const phases = MoonPhasesDiagrams.eightPhases(MoonPhase);
  assert.deepEqual(phases.map((p) => p.waxing), [true, true, true, true, false, false, false, false]);
});

// --- Earth-view disc polygon --------------------------------------------

test('earthViewDiscPolygon: area at New Moon (0) is almost nothing', () => {
  const area = MoonPhasesDiagrams.polygonArea(MoonPhasesDiagrams.earthViewDiscPolygon(0, 100));
  assert.ok(area < 1, `expected ~0 area at New Moon, got ${area}`);
});

test('earthViewDiscPolygon: area at Full Moon (180) is almost the full circle', () => {
  const area = MoonPhasesDiagrams.polygonArea(MoonPhasesDiagrams.earthViewDiscPolygon(180, 100));
  const circleArea = Math.PI * 100 * 100;
  assert.ok(area > circleArea * 0.98, `expected ~full circle area at Full Moon, got ${area} vs ${circleArea}`);
});

test('earthViewDiscPolygon: area matches MoonPhase\'s own illuminated fraction at every one of the 8 phases', () => {
  const circleArea = Math.PI * 100 * 100;
  MoonPhasesDiagrams.EIGHT_PHASE_THETAS.forEach((theta) => {
    const drawnFraction = MoonPhasesDiagrams.polygonArea(MoonPhasesDiagrams.earthViewDiscPolygon(theta, 100)) / circleArea;
    const modelFraction = MoonPhase.fromTheta(theta).illuminatedFraction;
    assert.ok(
      Math.abs(drawnFraction - modelFraction) < 0.01,
      `theta=${theta}: drawn fraction ${drawnFraction.toFixed(3)} vs model fraction ${modelFraction.toFixed(3)}`
    );
  });
});

test('earthViewDiscPolygon: waxing (<=180) lights the right (+x) side, waning lights the left (-x) side', () => {
  // At the quarters the terminator is a straight vertical line (cos(90)=0,
  // cos(270)=0), so every point's x sign alone says which side is lit.
  const waxingPoints = MoonPhasesDiagrams.earthViewDiscPolygon(90, 100);
  const waningPoints = MoonPhasesDiagrams.earthViewDiscPolygon(270, 100);
  assert.ok(waxingPoints.every(([x]) => x >= -1e-9), 'First Quarter: every point has x >= 0');
  assert.ok(waningPoints.every(([x]) => x <= 1e-9), 'Last Quarter: every point has x <= 0');
});

// --- Earthshine -----------------------------------------------------------

test('EARTHSHINE_THETA is a thin crescent, close to New Moon', () => {
  const fraction = MoonPhase.fromTheta(MoonPhasesDiagrams.EARTHSHINE_THETA).illuminatedFraction;
  assert.ok(fraction > 0 && fraction < 0.15, `expected a thin crescent (<15% lit), got ${(fraction * 100).toFixed(1)}%`);
});
