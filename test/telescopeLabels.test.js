const test = require('node:test');
const assert = require('node:assert/strict');
const TelescopeLabels = require('../notes/telescopeLabels');

function byId(labels, id) {
  return labels.find((l) => l.id === id);
}

test('focusDiagramLabels: the live focal-length and aperture labels equal the slider values', () => {
  const lensLabels = TelescopeLabels.focusDiagramLabels(80, 150, false);
  assert.equal(byId(lensLabels, 'focal-length').text, 'focal length f = 150 mm');
  assert.equal(byId(lensLabels, 'aperture').text, 'aperture (diameter) = 80 mm');
  assert.equal(byId(lensLabels, 'element-type').text, 'convex (converging) lens');

  const mirrorLabels = TelescopeLabels.focusDiagramLabels(120, 200, true);
  assert.equal(byId(mirrorLabels, 'focal-length').text, 'focal length f = 200 mm');
  assert.equal(byId(mirrorLabels, 'element-type').text, 'concave (converging) mirror');
});

test('benchLabels: Galilean and Keplerian eyepiece labels and image type/orientation', () => {
  const galilean = TelescopeLabels.benchLabels('galilean', 100, 500, 50);
  assert.equal(byId(galilean, 'secondary-type').text, 'concave (diverging) lens');
  assert.equal(byId(galilean, 'secondary-f').text, 'f = 50 mm');
  assert.equal(byId(galilean, 'image-type').text, 'no real image');
  assert.equal(byId(galilean, 'image-orientation').text, 'upright');

  const keplerian = TelescopeLabels.benchLabels('keplerian', 100, 500, 50);
  assert.equal(byId(keplerian, 'secondary-type').text, 'convex (converging) lens');
  assert.equal(byId(keplerian, 'image-type').text, 'real image');
  assert.equal(byId(keplerian, 'image-orientation').text, 'inverted');
});

test('benchLabels: Newtonian and Cassegrain always report a real, inverted image', () => {
  const newtonian = TelescopeLabels.benchLabels('newtonian', 150, 1000, 25);
  assert.equal(byId(newtonian, 'objective-type').text, 'concave primary mirror');
  assert.equal(byId(newtonian, 'secondary-type').text, 'flat diagonal mirror');
  assert.equal(byId(newtonian, 'image-type').text, 'real image');
  assert.equal(byId(newtonian, 'image-orientation').text, 'inverted');

  const cassegrain = TelescopeLabels.benchLabels('cassegrain', 150, 1000, 25);
  assert.equal(byId(cassegrain, 'secondary-type').text, 'convex secondary mirror');
  assert.equal(byId(cassegrain, 'image-type').text, 'real image');
  assert.equal(byId(cassegrain, 'image-orientation').text, 'inverted');
});

test('benchLabels: live focal-length labels equal the slider values passed in', () => {
  const labels = TelescopeLabels.benchLabels('keplerian', 100, 1200, 30);
  assert.equal(byId(labels, 'objective-f').text, 'f = 1200 mm');
  assert.equal(byId(labels, 'secondary-f').text, 'f = 30 mm');
});

test('compareLabels: matched parameters (500 mm objective, 50 mm eyepiece) match the engine’s own numbers', () => {
  const keplerian = TelescopeLabels.compareLabels('keplerian', 500, 50);
  assert.equal(keplerian.eyepiecePositionMm, 550);
  assert.equal(keplerian.magnification, -10);
  assert.equal(keplerian.realImage, true);
  assert.equal(byId(keplerian.labels, 'tube-length').text, 'tube length = 550 mm');
  assert.equal(byId(keplerian.labels, 'magnification').text, 'magnification = -10x');
  assert.equal(byId(keplerian.labels, 'image-type').text, 'a real image forms here');
  assert.equal(byId(keplerian.labels, 'field-of-view').text, 'field of view: wider');

  const galilean = TelescopeLabels.compareLabels('galilean', 500, 50);
  assert.equal(galilean.eyepiecePositionMm, 450);
  assert.equal(galilean.magnification, 10);
  assert.equal(galilean.realImage, false);
  assert.equal(byId(galilean.labels, 'tube-length').text, 'tube length = 450 mm');
  assert.equal(byId(galilean.labels, 'magnification').text, 'magnification = +10x');
  assert.equal(byId(galilean.labels, 'image-type').text, 'the rays would have focused here');
  assert.equal(byId(galilean.labels, 'field-of-view').text, 'field of view: narrower');
});

test('filterLabelsByMode: "all" keeps everything, "key" keeps only key labels, "off" hides everything', () => {
  const labels = [
    { id: 'a', key: true, text: 'A' },
    { id: 'b', key: false, text: 'B' },
  ];
  assert.deepEqual(TelescopeLabels.filterLabelsByMode(labels, 'all'), labels);
  assert.deepEqual(TelescopeLabels.filterLabelsByMode(labels, 'key'), [labels[0]]);
  assert.deepEqual(TelescopeLabels.filterLabelsByMode(labels, 'off'), []);
});
