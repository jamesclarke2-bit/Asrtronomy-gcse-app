/**
 * The Sun/Earth/Moon interior ("ring") diagrams share one design,
 * computed by src/ringDiagramLabels.js's layoutRingColumn and checked
 * here as it actually renders: the ring is as large as its box allows
 * and sits to the left; every layer's name sits in a single
 * left-aligned column to the right; leader lines run from a dot inside
 * each layer's own band out to its label; nothing overlaps or spills
 * out of the box. These are all real layout facts a browser has to
 * compute — not something parseable from the raw HTML or SVG source.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const { skip } = trackSkips('test/ringDiagramVisuals.test.js');

const DIAGRAMS = [
  {
    label: 'Sun',
    url: 'file://' + path.join(__dirname, '..', 'notes', 'sun-features.html'),
    svgId: 'sun-structure',
    // Outermost first, matching drawSunStructureLabels' own layer order.
    layers: [
      { name: 'Corona', radius: 200 },
      { name: 'Chromosphere', radius: 170 },
      { name: 'Photosphere', radius: 140 },
      { name: 'Convective zone', radius: 105 },
      { name: 'Radiative zone', radius: 65 },
      { name: 'Core', radius: 30 },
    ],
  },
  {
    label: 'Earth',
    url: 'file://' + path.join(__dirname, '..', 'notes', 'earth-structure.html'),
    svgId: 'earth-layers',
    layers: [
      { name: 'Crust', radius: 200 },
      { name: 'Mantle', radius: 188 },
      { name: 'Outer core', radius: 106 },
      { name: 'Inner core', radius: 43 },
    ],
  },
  {
    label: 'Moon',
    url: 'file://' + path.join(__dirname, '..', 'notes', 'moon-structure.html'),
    svgId: 'moon-structure',
    layers: [
      { name: 'Crust', radius: 200 },
      { name: 'Mantle', radius: 182 },
      { name: 'Outer core', radius: 62 },
      { name: 'Inner core', radius: 28 },
    ],
  },
];

const VIEWPORTS = [
  { label: 'phone', width: 390, height: 900 },
  { label: 'desktop', width: 1280, height: 1000 },
];

async function withPage(t, viewport, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, `Chromium isn't available in this environment (${err.message})`);
    return;
  }
  try {
    const page = await browser.newPage({ viewport });
    await run(page);
  } finally {
    await browser.close();
  }
}

// Reads back every geometric fact the test needs about one diagram, as
// rendered — never computed by hand here, since that would just repeat
// src/ringDiagramLabels.js's own arithmetic instead of checking it.
async function readDiagramState(page, svgId) {
  return page.evaluate((svgId) => {
    const svg = document.getElementById(svgId);
    const wrap = svg.closest('.labelled-diagram-wrap');
    const wrapRect = wrap.getBoundingClientRect();

    const circles = Array.from(svg.querySelectorAll('circle[cx][cy][r]'));
    const outer = circles.reduce((a, b) => (Number(a.getAttribute('r')) > Number(b.getAttribute('r')) ? a : b));
    const outerRect = outer.getBoundingClientRect();
    const svgCx = Number(outer.getAttribute('cx'));
    const svgCy = Number(outer.getAttribute('cy'));
    const centreScreen = {
      x: outerRect.left + outerRect.width / 2,
      y: outerRect.top + outerRect.height / 2,
    };
    const pxPerSvgUnit = outerRect.width / (Number(outer.getAttribute('r')) * 2);

    const labels = Array.from(wrap.querySelectorAll('.ring-diagram-label'));
    const labelRects = labels.map((label) => label.getBoundingClientRect());
    const fontSizePx = parseFloat(getComputedStyle(labels[0]).fontSize);

    // Leader lines are drawn in the same order as the layers array (see
    // drawSunStructureLabels/drawEarthLayers/drawMoonStructure), as
    // plain <line> children of one <g>, immediately before each label.
    const leaderLines = Array.from(svg.querySelectorAll('g line'));
    const dots = leaderLines.map((line) => ({
      svgX: Number(line.getAttribute('x1')),
      svgY: Number(line.getAttribute('y1')),
    }));

    return {
      wrapRect: { top: wrapRect.top, left: wrapRect.left, right: wrapRect.right, bottom: wrapRect.bottom, width: wrapRect.width, height: wrapRect.height },
      outerRect: { top: outerRect.top, left: outerRect.left, right: outerRect.right, bottom: outerRect.bottom, width: outerRect.width, height: outerRect.height },
      centreScreen,
      pxPerSvgUnit,
      svgCx,
      svgCy,
      labelRects: labelRects.map((r) => ({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height })),
      fontSizePx,
      dots,
    };
  }, svgId);
}

DIAGRAMS.forEach((diagram) => {
  VIEWPORTS.forEach((viewport) => {
    test(`${diagram.label} structure diagram at ${viewport.label}: the ring is at least 60% of the box's own height, and sits to the left`, async (t) => {
      await withPage(t, viewport, async (page) => {
        await page.goto(diagram.url);
        await page.waitForTimeout(150);
        const state = await readDiagramState(page, diagram.svgId);

        const diameter = state.outerRect.width;
        assert.ok(
          diameter >= 0.6 * state.wrapRect.height,
          `ring diameter (${diameter.toFixed(1)}px) should be at least 60% of the box height (${state.wrapRect.height.toFixed(1)}px)`
        );
        assert.ok(
          state.outerRect.left - state.wrapRect.left < state.wrapRect.width - state.outerRect.right + state.wrapRect.left,
          'the ring should sit nearer the left edge of its box than the right'
        );
      });
    });

    test(`${diagram.label} structure diagram at ${viewport.label}: every label shares the same x, is left-aligned, and none spills out of the box`, async (t) => {
      await withPage(t, viewport, async (page) => {
        await page.goto(diagram.url);
        await page.waitForTimeout(150);
        const state = await readDiagramState(page, diagram.svgId);

        assert.equal(state.labelRects.length, diagram.layers.length);
        const lefts = state.labelRects.map((r) => Math.round(r.left));
        lefts.forEach((left) => assert.ok(Math.abs(left - lefts[0]) <= 1, `every label's left edge should match (got ${lefts})`));

        state.labelRects.forEach((r) => {
          assert.ok(r.left >= state.wrapRect.left - 1, 'label should not spill past the left edge of the box');
          assert.ok(r.right <= state.wrapRect.right + 1, 'label should not spill past the right edge of the box');
          assert.ok(r.top >= state.wrapRect.top - 1, 'label should not spill past the top of the box');
          assert.ok(r.bottom <= state.wrapRect.bottom + 1, 'label should not spill past the bottom of the box');
        });
      });
    });

    test(`${diagram.label} structure diagram at ${viewport.label}: labels are ordered outermost-to-centre, top to bottom, and are evenly spaced at least 1.5x the font size apart`, async (t) => {
      await withPage(t, viewport, async (page) => {
        await page.goto(diagram.url);
        await page.waitForTimeout(150);
        const state = await readDiagramState(page, diagram.svgId);

        const centres = state.labelRects.map((r) => r.top + r.height / 2);
        for (let i = 1; i < centres.length; i += 1) {
          assert.ok(centres[i] > centres[i - 1], 'each label sits below the previous one (outermost layer first)');
          const gap = centres[i] - centres[i - 1];
          assert.ok(
            gap >= 1.5 * state.fontSizePx,
            `gap between labels ${i - 1} and ${i} (${gap.toFixed(1)}px) should be at least 1.5x the font size (${state.fontSizePx}px)`
          );
        }
      });
    });

    test(`${diagram.label} structure diagram at ${viewport.label}: no label overlaps the ring or another label`, async (t) => {
      await withPage(t, viewport, async (page) => {
        await page.goto(diagram.url);
        await page.waitForTimeout(150);
        const state = await readDiagramState(page, diagram.svgId);

        function intersects(a, b) {
          return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        }

        state.labelRects.forEach((r, i) => {
          assert.ok(!intersects(r, state.outerRect), `label ${i} (${diagram.layers[i].name}) should not overlap the ring`);
          state.labelRects.forEach((other, j) => {
            if (i === j) return;
            assert.ok(!intersects(r, other), `label ${i} (${diagram.layers[i].name}) should not overlap label ${j} (${diagram.layers[j].name})`);
          });
        });
      });
    });

    test(`${diagram.label} structure diagram at ${viewport.label}: every leader line's dot sits inside its own layer's band`, async (t) => {
      await withPage(t, viewport, async (page) => {
        await page.goto(diagram.url);
        await page.waitForTimeout(150);
        const state = await readDiagramState(page, diagram.svgId);

        assert.equal(state.dots.length, diagram.layers.length);
        diagram.layers.forEach((layer, i) => {
          const dist = Math.hypot(state.dots[i].svgX - state.svgCx, state.dots[i].svgY - state.svgCy);
          const bandOuter = layer.radius;
          const bandInner = i + 1 < diagram.layers.length ? diagram.layers[i + 1].radius : 0;
          assert.ok(
            dist >= bandInner - 1e-6 && dist <= bandOuter + 1e-6,
            `${layer.name}'s dot (radius ${dist.toFixed(1)}) should sit between ${bandInner} and ${bandOuter}`
          );
        });
      });
    });
  });
});

test('every structure diagram uses the same label font size', async (t) => {
  await withPage(t, VIEWPORTS[1], async (page) => {
    const sizes = [];
    for (const diagram of DIAGRAMS) {
      await page.goto(diagram.url);
      await page.waitForTimeout(150);
      const state = await readDiagramState(page, diagram.svgId);
      sizes.push(state.fontSizePx);
    }
    sizes.forEach((size) => assert.equal(size, sizes[0], `font sizes should match across diagrams: ${sizes}`));
  });
});
