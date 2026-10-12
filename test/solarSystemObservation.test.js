/**
 * sims/solar-system-observation.html's animation-speed control, section
 * order/renumbering, the combined orbit/apparent-position diagram row, and
 * the horizon-strip "How to read this diagram" panel. Parsed from the raw
 * HTML (same convention as test/notesTemplate.test.js and
 * test/earthStructureLayers.test.js), not a DOM, since this repo has no
 * DOM-simulation dependency.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sims', 'solar-system-observation.html'), 'utf8');

function attr(tag, name) {
  const m = new RegExp(`${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
}

test('the date slider uses step="any" so a script-set value never gets snapped (house rule 12)', () => {
  const sliderTag = /<input type="range" id="date-slider"[^>]*>/.exec(html)[0];
  assert.equal(attr(sliderTag, 'step'), 'any');
});

test('there are exactly 3 speed buttons — slow, normal, fast — each carrying its own days-per-frame', () => {
  const buttonTags = [...html.matchAll(/<button[^>]*data-speed="[^"]*"[^>]*>([^<]*)<\/button>/g)];
  const buttons = buttonTags.map((m) => ({
    speed: attr(m[0], 'data-speed'),
    daysPerFrame: Number(attr(m[0], 'data-days-per-frame')),
    label: m[1].trim(),
  }));
  assert.equal(buttons.length, 3, 'expected 3 speed buttons');
  assert.deepEqual(
    buttons.map((b) => b.speed),
    ['slow', 'normal', 'fast']
  );
  assert.deepEqual(
    buttons.map((b) => b.label),
    ['Slow', 'Normal', 'Fast']
  );
  buttons.forEach((b) => assert.ok(Number.isFinite(b.daysPerFrame) && b.daysPerFrame > 0, `${b.speed} should carry a positive data-days-per-frame`));
});

test('Slow defaults to active, and is exactly a quarter of Normal\'s speed', () => {
  const buttonTags = [...html.matchAll(/<button[^>]*data-speed="[^"]*"[^>]*>[^<]*<\/button>/g)].map((m) => m[0]);
  const slow = buttonTags.find((t) => attr(t, 'data-speed') === 'slow');
  const normal = buttonTags.find((t) => attr(t, 'data-speed') === 'normal');
  assert.ok(slow.includes('preset-button-active'), 'the Slow button should start active');
  assert.equal(attr(slow, 'aria-pressed'), 'true');
  const fast = buttonTags.find((t) => attr(t, 'data-speed') === 'fast');
  [normal, fast].forEach((t) => {
    assert.ok(!t.includes('preset-button-active'), 'only Slow should start active');
    assert.equal(attr(t, 'aria-pressed'), 'false');
  });
  const slowDays = Number(attr(slow, 'data-days-per-frame'));
  const normalDays = Number(attr(normal, 'data-days-per-frame'));
  assert.equal(slowDays, normalDays / 4, 'Slow should be a quarter of Normal\'s speed');
});

test('the sections appear in the renumbered order: inner-outer, alignments, orbit-and-apparent-position, when-to-view', () => {
  const sectionIds = [...html.matchAll(/<section[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
  const expectedOrder = ['inner-outer', 'alignments', 'orbit-and-apparent-position', 'when-to-view'];
  const positions = expectedOrder.map((id) => sectionIds.indexOf(id));
  positions.forEach((pos, i) => assert.ok(pos !== -1, `section #${expectedOrder[i]} should exist`));
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(positions[i] > positions[i - 1], `#${expectedOrder[i]} should come after #${expectedOrder[i - 1]}`);
  }
});

test('the section headings are renumbered 1-4 to match the new order', () => {
  const headings = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map((m) => m[1].trim());
  assert.deepEqual(
    headings.filter((h) => /^\d\./.test(h)),
    ['1. Inner and outer planets', '2. Alignments', '3. Orbit and apparent position', '4. When to view']
  );
});

test('section 3\'s diagram-row holds both the solar-system canvas and the apparent-position canvases', () => {
  const sectionMatch = /<section class="retrograde-section" id="orbit-and-apparent-position">[\s\S]*?<\/section>/.exec(html);
  assert.ok(sectionMatch, 'orbit-and-apparent-position section should exist');
  const section = sectionMatch[0];
  assert.match(section, /<div class="diagram-row">/);
  assert.match(section, /id="solar-system"/);
  assert.match(section, /id="zodiac-strip"/);
  assert.match(section, /id="retrograde-graph"/);

  const rowStart = section.indexOf('<div class="diagram-row">');
  const solarSystemPos = section.indexOf('id="solar-system"');
  const zodiacPos = section.indexOf('id="zodiac-strip"');
  const retrogradePos = section.indexOf('id="retrograde-graph"');
  assert.ok(rowStart < solarSystemPos && solarSystemPos < zodiacPos && zodiacPos < retrogradePos, 'the diagram-row should contain the orbit chart before the apparent-position canvases');
});

test('both diagrams in the row carry their own width-cap class so they can sit side by side within the controls-sidebar layout', () => {
  assert.match(html, /<div class="diagram orbit-chart-diagram">\s*<h3>Solar system \(top-down\)<\/h3>/);
  assert.match(html, /<div class="diagram apparent-position-diagram">\s*<h3>Apparent position among the stars<\/h3>/);
});

test('section 4 keeps the original lead sentence, viewing-sentence readout and Best viewing times table', () => {
  const sectionMatch = /<section class="notes-section" id="when-to-view">[\s\S]*?<\/section>/.exec(html);
  assert.ok(sectionMatch, 'when-to-view section should exist');
  const section = sectionMatch[0];
  assert.match(section, /Where the Sun and the selected planet sit at sunset, midnight and sunrise, for the date on the slider\./);
  assert.match(section, /<p class="eot-readout" id="viewing-sentence"><\/p>/);
  assert.match(section, /<caption>Best viewing times<\/caption>/);
  assert.match(section, /Inferior planet, greatest eastern elongation/);
  assert.match(section, /Inferior planet, greatest western elongation/);
  assert.match(section, /Superior planet, near opposition/);
});

test('the "How to read this diagram" panel sits right after the horizon strip, toggled by a glossary-style button', () => {
  const horizonPos = html.indexOf('id="horizon-strip"');
  const togglePos = html.indexOf('data-term="horizon-strip-howto"');
  assert.ok(horizonPos !== -1 && togglePos !== -1, 'both the horizon strip and the howto toggle should exist');
  assert.ok(togglePos > horizonPos, 'the howto toggle should come after the horizon strip');

  const buttonTag = /<button[^>]*data-term="horizon-strip-howto"[^>]*>([^<]*)<\/button>/.exec(html);
  assert.equal(buttonTag[1].trim(), 'How to read this diagram');
  assert.equal(attr(buttonTag[0], 'aria-expanded'), 'false');

  const panelMatch = /<div class="glossary-definition" data-term="horizon-strip-howto" hidden>([\s\S]*?)<\/div>/.exec(html);
  assert.ok(panelMatch, 'the howto panel should exist');
  const panel = panelMatch[1];

  const steps = [...panel.matchAll(/<li>([^<]+)<\/li>/g)].map((m) => m[1]);
  assert.equal(steps.length, 5);
  assert.match(steps[0], /sunset, midnight and sunrise/);
  assert.match(steps[1], /Sun is below the horizon at midnight/);
  assert.match(steps[2], /east of the Sun is in the evening sky/);
  assert.match(steps[3], /west of the Sun is in the morning sky/);
  assert.match(steps[4], /opposite the Sun is up all night/);

  assert.match(panel, /<strong>Venus<\/strong>/);
  assert.match(panel, /<strong>Mars<\/strong>/);
});

test('the howto panel is deliberately left out of the page\'s own GLOSSARY dict so its hand-authored HTML survives Glossary.init', () => {
  const jsPath = path.join(__dirname, '..', 'sims', 'solar-system-observation.js');
  const js = fs.readFileSync(jsPath, 'utf8');
  const glossaryMatch = /const GLOSSARY = \{([\s\S]*?)\n  \};/.exec(js);
  assert.ok(glossaryMatch, 'solar-system-observation.js should define a GLOSSARY object');
  assert.ok(!glossaryMatch[1].includes('horizon-strip-howto'), 'horizon-strip-howto must not be a GLOSSARY key, or its rich HTML gets overwritten with plain text');
});
