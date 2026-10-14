const test = require('node:test');
const assert = require('node:assert/strict');
const { UNITS, getUnit, getSubtopic } = require('../src/curriculum');
const { CURRICULUM_UNITS } = require('../src/solarPosition');
const { QUESTIONS } = require('../src/questions');
const { QUESTIONS: EOT_QUESTIONS } = require('../src/eotQuestions');
const { getSpecPoint, SPEC_POINT_GROUPS } = require('../src/specPoints');

// Topics with their own registry in src/specPoints.js, checked against
// below. Topics 13-16 have no spec-tagged curriculum content yet, so
// they're not here — see that file's own header.
const REGISTERED_TOPICS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

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
  assert.equal(getSubtopic('u1.6').title, 'Observational terminology');
  assert.equal(getSubtopic('u1.6').depth, 'know');
});

test('solarPosition.js only declares curriculum ids that actually exist', () => {
  for (const id of CURRICULUM_UNITS) {
    assert.ok(getSubtopic(id), `CURRICULUM_UNITS references missing subtopic "${id}"`);
  }
});

test('every question only tags curriculum ids that actually exist', () => {
  for (const question of [...QUESTIONS, ...EOT_QUESTIONS]) {
    for (const id of question.units) {
      assert.ok(getSubtopic(id), `${question.id} references missing subtopic "${id}"`);
    }
  }
});

test('every subtopic\'s optional spec field, where present, is a non-empty array of strings', () => {
  for (const unit of UNITS) {
    for (const subtopic of unit.subtopics) {
      if (!('spec' in subtopic)) continue;
      assert.ok(Array.isArray(subtopic.spec), `${subtopic.id}: spec should be an array`);
      assert.ok(subtopic.spec.length > 0, `${subtopic.id}: spec array is empty`);
      subtopic.spec.forEach((point) => {
        assert.equal(typeof point, 'string', `${subtopic.id}: spec entry "${point}" should be a string`);
      });
    }
  }
});

test('u3\'s Topic 7 and Topic 8 entries (u3.1-u3.14) are all tagged with a spec point', () => {
  const unit = getUnit('u3');
  const topic78 = unit.subtopics.filter((s) => {
    const n = Number(s.id.split('.')[1]);
    return n >= 1 && n <= 14;
  });
  assert.equal(topic78.length, 14, 'expected u3.1 through u3.14');
  topic78.forEach((s) => assert.ok(s.spec && s.spec.length > 0, `${s.id} (${s.title}) has no spec field`));
});

test('every curriculum spec code for a topic with a src/specPoints.js registry (1-12) actually exists in that registry', () => {
  UNITS.forEach((unit) => {
    unit.subtopics.forEach((subtopic) => {
      (subtopic.spec || []).forEach((code) => {
        const topic = code.split('.')[0];
        if (!REGISTERED_TOPICS.includes(topic)) return; // Topics 13-16 — no registry to check against yet
        assert.ok(getSpecPoint(code), `${subtopic.id} tags spec "${code}", which doesn't exist in src/specPoints.js`);
      });
    });
  });
});

test('no curriculum entry lists the same spec code twice', () => {
  UNITS.forEach((unit) => {
    unit.subtopics.forEach((subtopic) => {
      if (!subtopic.spec) return;
      const unique = new Set(subtopic.spec);
      assert.equal(unique.size, subtopic.spec.length, `${subtopic.id} lists a spec code more than once: ${subtopic.spec.join(', ')}`);
    });
  });
});

test('no curriculum entry tags a bare group parent code (e.g. "12.1") — only its own lettered sub-codes', () => {
  const groupParents = new Set(Object.keys(SPEC_POINT_GROUPS));
  UNITS.forEach((unit) => {
    unit.subtopics.forEach((subtopic) => {
      (subtopic.spec || []).forEach((code) => {
        assert.ok(
          !groupParents.has(code),
          `${subtopic.id} tags "${code}" directly, but that's a multi-part spec point — tag the specific sub-code(s) it actually teaches instead`
        );
      });
    });
  });
});

test('u3.30 (Tidal heating) is tagged with 12.1b (tidal/internal heating) and 12.5 (life), not the old bare 12.1', () => {
  assert.deepEqual(getSubtopic('u3.30').spec, ['12.1b', '12.5']);
});

test('u2.2 (Moon structure) is tagged with 12.1d: it explains impact craters, one of that sub-code\'s two parts', () => {
  assert.ok(getSubtopic('u2.2').spec.includes('12.1d'));
});

test('u2.12 (Solar wind) is tagged with 12.1e: it covers the solar wind\'s effect on comets (ion tails), one of that sub-code\'s three parts', () => {
  assert.ok(getSubtopic('u2.12').spec.includes('12.1e'));
});

test('u3.21 (Formation of gas giants) keeps 12.3: its page names core accretion, one of 12.3\'s "main theories"', () => {
  assert.ok(getSubtopic('u3.21').spec.includes('12.3'));
});
