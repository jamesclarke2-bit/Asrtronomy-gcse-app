const test = require('node:test');
const assert = require('node:assert/strict');
const SunIcon = require('../src/sunIcon');

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]) {
  const toLinear = (c) => {
    const n = c / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  const [R, G, B] = [r, g, b].map(toLinear);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Standard WCAG contrast ratio: (L1 + 0.05) / (L2 + 0.05), lighter over darker.
function contrastRatio(hex1, hex2) {
  const L1 = relativeLuminance(hexToRgb(hex1));
  const L2 = relativeLuminance(hexToRgb(hex2));
  const [lighter, darker] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (lighter + 0.05) / (darker + 0.05);
}

// The site's own light panel and dark night-sky backgrounds the Sun
// is drawn against somewhere on the site (sims/kepler.html's canvas
// background, moon-phases.html's earth-view disc background, plain
// white notes pages, and the darkest navy skyglow/star-field panels).
const LIGHT_BACKGROUNDS = ['#eaf2fb', '#f7f9fc', '#ffffff'];
const DARK_BACKGROUNDS = ['#10141f', '#0f1830', '#10233f', '#0b1220'];
const MIN_CONTRAST = 3;

test('GRADIENT_STOPS: three stops running centre (warm white) to edge (deep orange), offsets 0 to 1', () => {
  assert.equal(SunIcon.GRADIENT_STOPS.length, 3);
  assert.equal(SunIcon.GRADIENT_STOPS[0].offset, 0);
  assert.equal(SunIcon.GRADIENT_STOPS[SunIcon.GRADIENT_STOPS.length - 1].offset, 1);
  for (let i = 1; i < SunIcon.GRADIENT_STOPS.length; i += 1) {
    assert.ok(SunIcon.GRADIENT_STOPS[i].offset > SunIcon.GRADIENT_STOPS[i - 1].offset, 'offsets should be strictly increasing');
  }
  assert.equal(SunIcon.GRADIENT_STOPS[SunIcon.GRADIENT_STOPS.length - 1].color, SunIcon.EDGE_COLOR, 'the gradient\'s outer stop should match EDGE_COLOR exactly');
});

test('EDGE_COLOR holds at least 3:1 contrast against every light and dark background the Sun appears on', () => {
  [...LIGHT_BACKGROUNDS, ...DARK_BACKGROUNDS].forEach((bg) => {
    const ratio = contrastRatio(SunIcon.EDGE_COLOR, bg);
    assert.ok(ratio >= MIN_CONTRAST, `EDGE_COLOR vs ${bg}: contrast ${ratio.toFixed(2)} is below ${MIN_CONTRAST}:1`);
  });
});

test('MONO_COLOR holds at least 3:1 contrast against every light and dark background the Sun appears on', () => {
  [...LIGHT_BACKGROUNDS, ...DARK_BACKGROUNDS].forEach((bg) => {
    const ratio = contrastRatio(SunIcon.MONO_COLOR, bg);
    assert.ok(ratio >= MIN_CONTRAST, `MONO_COLOR vs ${bg}: contrast ${ratio.toFixed(2)} is below ${MIN_CONTRAST}:1`);
  });
});

test('EDGE_COLOR and MONO_COLOR are the same deep-orange colour (one shared Sun colour, full-colour edge and monochrome alike)', () => {
  assert.equal(SunIcon.EDGE_COLOR, SunIcon.MONO_COLOR);
});

test('CORONA_RGB is a valid "r, g, b" triplet matching the gradient\'s own amber mid-stop', () => {
  const parts = SunIcon.CORONA_RGB.split(',').map((s) => Number(s.trim()));
  assert.equal(parts.length, 3);
  parts.forEach((n) => assert.ok(n >= 0 && n <= 255));
  const [r, g, b] = parts;
  const amberHex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  assert.equal(amberHex, SunIcon.GRADIENT_STOPS[1].color, 'corona glow should tint the same amber as the gradient\'s middle stop');
});

test('canvas and SVG functions are exposed for every consumer pattern this site uses', () => {
  ['drawSunDiscCanvas', 'drawSunMonoCanvas', 'appendSunSvg', 'appendSunMonoSvg', 'enhanceStaticSuns', 'ensureGradientDef'].forEach((name) => {
    assert.equal(typeof SunIcon[name], 'function', `${name} should be exported`);
  });
});

test('drawSunDiscCanvas draws a corona glow then a gradient-filled, stroked disc, in that order, via a fake canvas context', () => {
  const calls = [];
  const fakeCtx = {
    createRadialGradient: (...args) => {
      calls.push(['createRadialGradient', args]);
      const stops = [];
      return { addColorStop: (offset, color) => stops.push([offset, color]), _stops: stops };
    },
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    beginPath: () => calls.push(['beginPath']),
    arc: (...args) => calls.push(['arc', args]),
    fill: () => calls.push(['fill']),
    stroke: () => calls.push(['stroke']),
    set fillStyle(v) { calls.push(['fillStyle', v]); },
    set strokeStyle(v) { calls.push(['strokeStyle', v]); },
    set lineWidth(v) { calls.push(['lineWidth', v]); },
  };
  SunIcon.drawSunDiscCanvas(fakeCtx, 50, 60, 20);
  const names = calls.map((c) => c[0]);
  assert.ok(names.indexOf('createRadialGradient') < names.lastIndexOf('fill'), 'gradient should be created before the final fill');
  assert.equal(names.filter((n) => n === 'arc').length, 2, 'should draw two circles: the corona and the disc');
  assert.ok(names.includes('stroke'), 'disc should be stroked by default');
});

test('drawSunDiscCanvas: corona and stroke can both be turned off', () => {
  const calls = [];
  const fakeCtx = {
    createRadialGradient: () => ({ addColorStop: () => {} }),
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    arc: () => calls.push('arc'),
    fill: () => {},
    stroke: () => calls.push('stroke'),
    set fillStyle(v) {},
    set strokeStyle(v) {},
    set lineWidth(v) {},
  };
  SunIcon.drawSunDiscCanvas(fakeCtx, 50, 60, 20, { corona: false, stroke: false });
  assert.equal(calls.filter((c) => c === 'arc').length, 1, 'only the disc itself, no corona');
  assert.ok(!calls.includes('stroke'));
});

test('drawSunMonoCanvas fills a single flat circle in MONO_COLOR by default', () => {
  const calls = [];
  const fakeCtx = {
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    arc: (...args) => calls.push(['arc', args]),
    fill: () => calls.push(['fill']),
    set fillStyle(v) { calls.push(['fillStyle', v]); },
  };
  SunIcon.drawSunMonoCanvas(fakeCtx, 10, 10, 5);
  assert.deepEqual(calls.map((c) => c[0]), ['arc', 'fillStyle', 'fill']);
  assert.equal(calls[1][1], SunIcon.MONO_COLOR);
});
