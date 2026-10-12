/**
 * notes/earth-structure.html's "Inside the Earth" diagram: each of the
 * four labelled-diagram-label spans (.earth-layer-label), the matching
 * SVG ring (.earth-layer-region) and the matching legend entry
 * (.layer-legend li) should all share one data-layer value, and that
 * legend entry's own <strong> heading should read the same word(s) as
 * the label itself — otherwise a click highlights the wrong ring or
 * scrolls to the wrong description. Parsed from the raw HTML (same
 * convention as test/notesTemplate.test.js and
 * test/studentFacingText.test.js), not a DOM, since this repo has no
 * DOM-simulation dependency.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'notes', 'earth-structure.html'), 'utf8');

function attr(tag, name) {
  const m = new RegExp(`${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
}

// Every .earth-layer-label span, with its own data-layer and visible text.
const labelTags = [...html.matchAll(/<span class="labelled-diagram-label earth-layer-label"[^>]*>([^<]*)<\/span>/g)];
const labels = labelTags.map((m) => ({ layer: attr(m[0], 'data-layer'), text: m[1].trim() }));

// Every .earth-layer-region circle, with its own data-layer.
const regionTags = [...html.matchAll(/<circle[^>]*class="earth-layer-region"[^>]*>/g)];
const regions = regionTags.map((m) => attr(m[0], 'data-layer'));

// Every legend <li data-layer="...">, with the heading word(s) in its own <strong>.
const liTags = [...html.matchAll(/<li data-layer="([^"]+)">\s*<span class="legend-dot[^"]*"><\/span><strong>([^<]+)<\/strong>/g)];
const legendEntries = liTags.map((m) => ({ layer: m[1], heading: m[2].trim() }));

test('there are exactly 4 layer labels, 4 layer regions and 4 legend entries', () => {
  assert.equal(labels.length, 4, 'expected 4 .earth-layer-label spans');
  assert.equal(regions.length, 4, 'expected 4 .earth-layer-region circles');
  assert.equal(legendEntries.length, 4, 'expected 4 legend <li data-layer> entries');
});

test('every label, region and legend entry carries a data-layer value', () => {
  labels.forEach((l) => assert.ok(l.layer, `label "${l.text}" has no data-layer`));
  regions.forEach((r) => assert.ok(r, 'a .earth-layer-region circle has no data-layer'));
  legendEntries.forEach((e) => assert.ok(e.layer, `legend entry "${e.heading}" has no data-layer`));
});

test('the label, region and legend data-layer sets are identical (and each has 4 distinct values)', () => {
  const labelLayers = new Set(labels.map((l) => l.layer));
  const regionLayers = new Set(regions);
  const legendLayers = new Set(legendEntries.map((e) => e.layer));
  assert.equal(labelLayers.size, 4, 'label data-layer values should be 4 distinct values');
  assert.equal(regionLayers.size, 4, 'region data-layer values should be 4 distinct values');
  assert.equal(legendLayers.size, 4, 'legend data-layer values should be 4 distinct values');
  assert.deepEqual(labelLayers, regionLayers, 'every label should have a matching region, and vice versa');
  assert.deepEqual(labelLayers, legendLayers, 'every label should have a matching legend entry, and vice versa');
});

test('every label maps to the legend entry with the matching heading text', () => {
  labels.forEach((label) => {
    const entry = legendEntries.find((e) => e.layer === label.layer);
    assert.ok(entry, `label "${label.text}" (data-layer="${label.layer}") has no legend entry with that data-layer`);
    assert.equal(entry.heading, label.text, `label "${label.text}" should map to a legend entry headed "${label.text}", got "${entry.heading}"`);
  });
});

test('every label maps to a distinct description — no two labels share a legend entry or a region', () => {
  const legendTargets = labels.map((l) => legendEntries.find((e) => e.layer === l.layer));
  assert.equal(new Set(legendTargets).size, 4, 'two or more labels resolved to the same legend entry');
  const regionTargets = labels.map((l) => regions.find((r) => r === l.layer));
  assert.equal(new Set(regionTargets).size, 4, 'two or more labels resolved to the same region');
});

test('the four layers are exactly crust, mantle, outer-core and inner-core', () => {
  const layers = labels.map((l) => l.layer).sort();
  assert.deepEqual(layers, ['crust', 'inner-core', 'mantle', 'outer-core']);
});

test('every label is keyboard-reachable (tabindex 0) and announces itself as a button', () => {
  labelTags.forEach((m) => {
    assert.equal(attr(m[0], 'tabindex'), '0', `label "${m[1].trim()}" should have tabindex="0"`);
    assert.equal(attr(m[0], 'role'), 'button', `label "${m[1].trim()}" should have role="button"`);
  });
});
