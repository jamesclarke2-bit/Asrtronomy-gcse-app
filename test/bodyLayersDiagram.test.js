/**
 * src/bodyLayersDiagram.js's pure geometry: the Earth-vs-Moon layer
 * comparison shared by notes/moon-structure.html and
 * notes/earth-structure.html. Checks the drawn radii against the
 * module's own BODY_LAYERS_KM table (independently recomputed here,
 * not just re-calling the function under test), and that the "Same
 * size" view gives each body's layers in the right proportion to its
 * own radius.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const BodyLayersDiagram = require('../src/bodyLayersDiagram');
const SpecData = require('../src/specData');

const SPEC_DIAMETER_KM = SpecData.CONSTANTS.meanDiameterKm;
const MAX_OUTER_RADIUS_PX = 150;

test('the data sheet gives Earth 13,000 km and the Moon 3,500 km, as the task describes', () => {
  assert.equal(SPEC_DIAMETER_KM.earth, 13000);
  assert.equal(SPEC_DIAMETER_KM.moon, 3500);
});

test('BODY_LAYERS_KM matches the given starting figures', () => {
  const { earth, moon } = BodyLayersDiagram.BODY_LAYERS_KM;
  assert.equal(earth.surfaceRadiusKm, 6371);
  assert.equal(earth.mantleBaseRadiusKm, 3480);
  assert.equal(earth.innerCoreRadiusKm, 1220);
  assert.equal(earth.crustThicknessKm, 35);
  assert.equal(moon.surfaceRadiusKm, 1737);
  assert.equal(moon.mantleBaseRadiusKm, 350);
  assert.equal(moon.innerCoreRadiusKm, 240);
});

test("the Moon's core (outer + inner) is about 20% of its radius, against about 55% for Earth", () => {
  const earthCoreFraction = BodyLayersDiagram.layerFractions('earth').outerCore;
  const moonCoreFraction = BodyLayersDiagram.layerFractions('moon').outerCore;
  assert.ok(Math.abs(earthCoreFraction - 0.55) < 0.01, `expected ~55%, got ${(earthCoreFraction * 100).toFixed(1)}%`);
  assert.ok(Math.abs(moonCoreFraction - 0.2) < 0.01, `expected ~20%, got ${(moonCoreFraction * 100).toFixed(1)}%`);
});

test('layerFractions: crust is always the full radius (the outermost layer)', () => {
  assert.equal(BodyLayersDiagram.layerFractions('earth').crust, 1);
  assert.equal(BodyLayersDiagram.layerFractions('moon').crust, 1);
});

// --- Drawn radii match the table (computeLayersPx recomputed independently) --

function expectedRadiiKm(bodyKey) {
  const b = BodyLayersDiagram.BODY_LAYERS_KM[bodyKey];
  return {
    crust: b.surfaceRadiusKm,
    mantle: b.surfaceRadiusKm - b.crustThicknessKm,
    outerCore: b.mantleBaseRadiusKm,
    innerCore: b.innerCoreRadiusKm,
  };
}

['earth', 'moon'].forEach((bodyKey) => {
  test(`computeLayersPx(${bodyKey}, 'sameSize', ...): each layer's radius matches its own km figure scaled to the body's own surface`, () => {
    const layers = BodyLayersDiagram.computeLayersPx(bodyKey, 'sameSize', MAX_OUTER_RADIUS_PX, SPEC_DIAMETER_KM);
    const kmRadii = expectedRadiiKm(bodyKey);
    const surfaceKm = BodyLayersDiagram.BODY_LAYERS_KM[bodyKey].surfaceRadiusKm;
    const byKey = Object.fromEntries(layers.map((l) => [l.key, l.radiusPx]));

    ['crust', 'mantle', 'outerCore', 'innerCore'].forEach((key) => {
      const expectedPx = (kmRadii[key] / surfaceKm) * MAX_OUTER_RADIUS_PX;
      assert.ok(
        Math.abs(byKey[key] - expectedPx) < 1e-9,
        `${bodyKey}.${key}: expected ${expectedPx}px, got ${byKey[key]}px`
      );
    });
  });
});

test("Same size view: both bodies' outer (crust) radius is exactly maxOuterRadiusPx", () => {
  const earthLayers = BodyLayersDiagram.computeLayersPx('earth', 'sameSize', MAX_OUTER_RADIUS_PX, SPEC_DIAMETER_KM);
  const moonLayers = BodyLayersDiagram.computeLayersPx('moon', 'sameSize', MAX_OUTER_RADIUS_PX, SPEC_DIAMETER_KM);
  assert.equal(earthLayers[0].key, 'crust');
  assert.equal(moonLayers[0].key, 'crust');
  assert.equal(earthLayers[0].radiusPx, MAX_OUTER_RADIUS_PX);
  assert.equal(moonLayers[0].radiusPx, MAX_OUTER_RADIUS_PX);
});

test('Same size view: each layer is a bigger fraction of Earth than of the Moon (the two proportions are genuinely different, not scaled copies)', () => {
  const earthLayers = BodyLayersDiagram.computeLayersPx('earth', 'sameSize', MAX_OUTER_RADIUS_PX, SPEC_DIAMETER_KM);
  const moonLayers = BodyLayersDiagram.computeLayersPx('moon', 'sameSize', MAX_OUTER_RADIUS_PX, SPEC_DIAMETER_KM);
  const earthByKey = Object.fromEntries(earthLayers.map((l) => [l.key, l.radiusPx]));
  const moonByKey = Object.fromEntries(moonLayers.map((l) => [l.key, l.radiusPx]));

  assert.ok(earthByKey.outerCore > moonByKey.outerCore, "Earth's core should reach further out of its own same-size circle than the Moon's");
  assert.ok(earthByKey.mantle > moonByKey.mantle, "Earth's mantle should reach further out of its own same-size circle than the Moon's");
});

// --- Same scale view uses the exam data sheet's own diameters -------------

test("Same scale view: Earth draws at the full maxOuterRadiusPx, the Moon scaled down by the data sheet's own diameter ratio", () => {
  const earthOuterPx = BodyLayersDiagram.outerRadiusPx('earth', 'sameScale', MAX_OUTER_RADIUS_PX, SPEC_DIAMETER_KM);
  const moonOuterPx = BodyLayersDiagram.outerRadiusPx('moon', 'sameScale', MAX_OUTER_RADIUS_PX, SPEC_DIAMETER_KM);
  assert.equal(earthOuterPx, MAX_OUTER_RADIUS_PX);
  const expectedMoonPx = MAX_OUTER_RADIUS_PX * (SPEC_DIAMETER_KM.moon / SPEC_DIAMETER_KM.earth);
  assert.ok(Math.abs(moonOuterPx - expectedMoonPx) < 1e-9);

  const ratio = earthOuterPx / moonOuterPx;
  assert.ok(Math.abs(ratio - 3.7) < 0.1, `Moon should be about 3.7x narrower than Earth, got ${ratio.toFixed(2)}x`);
});

test('sameScaleCaption and sameSizeCaption each state the right headline figure', () => {
  const sameScale = BodyLayersDiagram.sameScaleCaption(SPEC_DIAMETER_KM);
  assert.match(sameScale, /3\.7/);
  assert.match(sameScale, /13,000/);
  assert.match(sameScale, /3,500/);

  const sameSize = BodyLayersDiagram.sameSizeCaption();
  assert.match(sameSize, /20%/);
  assert.match(sameSize, /55%/);
});

// --- The magnified-inset label (Same scale view) ---------------------

test('sameScaleMagnification is the same ~3.7x ratio the Same-scale caption already states', () => {
  const magnification = BodyLayersDiagram.sameScaleMagnification(SPEC_DIAMETER_KM);
  assert.ok(Math.abs(magnification - 3.7) < 0.1, `expected ~3.7, got ${magnification.toFixed(2)}`);
});

test("magnifiedMoonLabel reads \"Moon, magnified about 3.7 times\"", () => {
  assert.equal(BodyLayersDiagram.magnifiedMoonLabel(SPEC_DIAMETER_KM), 'Moon, magnified about 3.7 times');
});

// --- "Share of the radius": layerShareFractions -----------------------

test('layerShareFractions: each share is the gap between one boundary and the next, not the cumulative boundary itself', () => {
  const earth = BodyLayersDiagram.layerShareFractions('earth');
  const f = BodyLayersDiagram.layerFractions('earth');
  assert.ok(Math.abs(earth.crust - (f.crust - f.mantle)) < 1e-12);
  assert.ok(Math.abs(earth.mantle - (f.mantle - f.outerCore)) < 1e-12);
  assert.ok(Math.abs(earth.outerCore - (f.outerCore - f.innerCore)) < 1e-12);
  assert.ok(Math.abs(earth.innerCore - f.innerCore) < 1e-12);
});

test('layerShareFractions: each body\'s own shares sum to exactly 1 (100%)', () => {
  ['earth', 'moon'].forEach((bodyKey) => {
    const shares = BodyLayersDiagram.layerShareFractions(bodyKey);
    const sum = shares.crust + shares.mantle + shares.outerCore + shares.innerCore;
    assert.ok(Math.abs(sum - 1) < 1e-12, `${bodyKey}: shares summed to ${sum}, not 1`);
  });
});

test('layerShareFractions, independently recomputed from BODY_LAYERS_KM, matches the function under test for both bodies', () => {
  ['earth', 'moon'].forEach((bodyKey) => {
    const b = BodyLayersDiagram.BODY_LAYERS_KM[bodyKey];
    const expected = {
      crust: b.crustThicknessKm / b.surfaceRadiusKm,
      mantle: (b.surfaceRadiusKm - b.crustThicknessKm - b.mantleBaseRadiusKm) / b.surfaceRadiusKm,
      outerCore: (b.mantleBaseRadiusKm - b.innerCoreRadiusKm) / b.surfaceRadiusKm,
      innerCore: b.innerCoreRadiusKm / b.surfaceRadiusKm,
    };
    const actual = BodyLayersDiagram.layerShareFractions(bodyKey);
    ['crust', 'mantle', 'outerCore', 'innerCore'].forEach((key) => {
      assert.ok(
        Math.abs(actual[key] - expected[key]) < 1e-9,
        `${bodyKey}.${key}: expected ${expected[key]}, got ${actual[key]}`
      );
    });
  });
});

test('the task\'s own given percentages: Earth crust ~0.5%, mantle ~45%, outer core ~35%, inner core ~19%', () => {
  const earth = BodyLayersDiagram.layerShareFractions('earth');
  assert.equal(BodyLayersDiagram.formatSharePercent(earth.crust), '0.5%');
  assert.equal(BodyLayersDiagram.formatSharePercent(earth.mantle), '45%');
  assert.equal(BodyLayersDiagram.formatSharePercent(earth.outerCore), '35%');
  assert.equal(BodyLayersDiagram.formatSharePercent(earth.innerCore), '19%');
});

test('the task\'s own given percentages: Moon crust ~2%, mantle ~78%, outer core ~6%, inner core ~14%', () => {
  const moon = BodyLayersDiagram.layerShareFractions('moon');
  assert.equal(BodyLayersDiagram.formatSharePercent(moon.crust), '2%');
  assert.equal(BodyLayersDiagram.formatSharePercent(moon.mantle), '78%');
  assert.equal(BodyLayersDiagram.formatSharePercent(moon.outerCore), '6%');
  assert.equal(BodyLayersDiagram.formatSharePercent(moon.innerCore), '14%');
});

test('formatSharePercent: shows one decimal place under 1%, the nearest whole percent otherwise', () => {
  assert.equal(BodyLayersDiagram.formatSharePercent(0.0055), '0.5%');
  assert.equal(BodyLayersDiagram.formatSharePercent(0.009), '0.9%');
  assert.equal(BodyLayersDiagram.formatSharePercent(0.01), '1%');
  assert.equal(BodyLayersDiagram.formatSharePercent(0.449), '45%');
  assert.equal(BodyLayersDiagram.formatSharePercent(1), '100%');
});

test("the Moon's core (outer + inner share) is a smaller share of its radius than Earth's, and its crust share is bigger — the chart's own takeaway", () => {
  const earth = BodyLayersDiagram.layerShareFractions('earth');
  const moon = BodyLayersDiagram.layerShareFractions('moon');
  assert.ok(moon.outerCore + moon.innerCore < earth.outerCore + earth.innerCore);
  assert.ok(moon.crust > earth.crust);
});
