const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../src/galaxyFormation');

test('top-down, bottom-up and mergers, four steps each', () => {
  assert.deepEqual(F.THEORIES.map((t) => t.id), ['top-down', 'bottom-up', 'mergers']);
  F.THEORIES.forEach((t) => assert.equal(t.steps.length, F.STEPS, t.id));
});

test('each theory tells its own story', () => {
  assert.match(F.theory('top-down').steps[0], /huge cloud of gas/);
  assert.match(F.theory('top-down').steps[3], /spiral galaxy/);
  assert.match(F.theory('bottom-up').steps[0], /small clumps/);
  assert.match(F.theory('bottom-up').steps[1], /merge/);
  assert.match(F.theory('mergers').steps[0], /Two spiral galaxies/);
  assert.match(F.theory('mergers').steps[3], /elliptical/);
});
