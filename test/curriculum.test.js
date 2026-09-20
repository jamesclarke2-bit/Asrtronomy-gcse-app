const test = require('node:test');
const assert = require('node:assert/strict');
const { UNITS, getUnit, getSubtopic } = require('../src/curriculum');
const { CURRICULUM_UNITS } = require('../src/solarPosition');

const VALID_DEPTHS = ['know', 'understand', 'be able to'];

test('unit ids are unique', () => {
  const ids = UNITS.map((u) => u.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('subtopic ids are unique across the whole curriculum', () => {
  const ids = UNITS.flatMap((u) => u.subtopics.map((s) => s.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('every subtopic has a valid depth tag', () => {
  for (const unit of UNITS) {
    for (const subtopic of unit.subtopics) {
      assert.ok(
        VALID_DEPTHS.includes(subtopic.depth),
        `${subtopic.id} has invalid depth "${subtopic.depth}"`
      );
    }
  }
});

test('getUnit and getSubtopic resolve known ids', () => {
  assert.equal(getUnit('u2').title, 'Earth, Moon & Sun system');
  assert.equal(getSubtopic('u2.9').title, 'Seasons');
  assert.equal(getSubtopic('u2.9').unitId, 'u2');
});

test('solarPosition.js only declares curriculum ids that actually exist', () => {
  for (const id of CURRICULUM_UNITS) {
    assert.ok(getSubtopic(id), `CURRICULUM_UNITS references missing subtopic "${id}"`);
  }
});
