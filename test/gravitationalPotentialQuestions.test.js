const test = require('node:test');
const assert = require('node:assert/strict');
const GravityField = require('../src/gravityField');
const OrbitalMechanics = require('../src/orbitalMechanics');
const { makeQuestions } = require('../src/gravitationalPotentialQuestions');
const { getSubtopic } = require('../src/curriculum');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('why-is-v-negative: the external-agent-work explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'why-is-v-negative');
  assert.ok(
    q.check(
      'Because V is defined as the work an external agent does bringing a unit mass in from infinity at constant speed — and since gravity itself pulls that mass inward the whole way, the external agent has to hold it back (push outward, against the motion) the whole way, doing negative work'
    ).correct
  );
  assert.equal(q.check('It is a convention with no physical meaning — V could equally well be defined as positive').correct, false);
});

test('field-work-opposite-sign: the W = -ΔU explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'field-work-opposite-sign');
  assert.ok(
    q.check(
      "Because work done by the field always equals minus the change in potential energy (W = -ΔU) for any conservative force, and potential energy is defined as the external agent's work — so the field's work is, by that same definition, the external agent's work reversed"
    ).correct
  );
  assert.equal(q.check("It doesn't really — they're the same number, just rounded differently").correct, false);
});

test('mgh-vs-exact: accepts the exact ΔU computed by the engine for a 50 km climb', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'mgh-vs-exact');
  const exact = GravityField.potentialEnergyDifferenceNumerical(OrbitalMechanics.EARTH_MASS_KG, 1, OrbitalMechanics.EARTH_RADIUS_M, OrbitalMechanics.EARTH_RADIUS_M + 50000);
  assert.ok(q.check(exact).correct);
  const g0 = GravityField.fieldMagnitude(OrbitalMechanics.EARTH_MASS_KG, OrbitalMechanics.EARTH_RADIUS_M);
  assert.equal(q.check(g0 * 50000).correct, false, 'the mgh approximation itself should not count as the exact answer');
});

test('when-is-mgh-valid: "h small compared with R" is the only correct option', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'when-is-mgh-valid');
  assert.ok(q.check('When the height h climbed is small compared with the radius R, so g barely changes over that climb').correct);
  assert.equal(q.check('Always — mgh is exact everywhere, not just near a surface').correct, false);
});

test('g-r-area-meaning: accepts the engine\'s own numerically integrated area between R and 4R', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'g-r-area-meaning');
  const area = GravityField.potentialDifferenceNumerical(OrbitalMechanics.EARTH_MASS_KG, OrbitalMechanics.EARTH_RADIUS_M, OrbitalMechanics.EARTH_RADIUS_M * 4);
  assert.ok(q.check(area).correct);
  assert.equal(q.check(0).correct, false);
});

test('satellite-ke-higher-orbit: "KE falls, total rises" is the only correct option', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'satellite-ke-higher-orbit');
  assert.ok(
    q.check('Kinetic energy falls (it moves slower, further out); total energy rises — becomes less negative, since it is now closer to escaping').correct
  );
  assert.equal(q.check('Both increase — a higher orbit needs more energy, so everything about it goes up').correct, false);
});

test('escape-is-zero-total-energy: "total energy exactly zero" is the only correct option', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'escape-is-zero-total-energy');
  assert.ok(
    q.check(
      'Total energy exactly zero — negative is bound (falls back or stays in orbit), zero is the marginal "just escaping" case, positive is unbound with speed left over'
    ).correct
  );
  assert.equal(q.check('There is no such boundary — escaping only depends on direction, not speed').correct, false);
});

test('every question only tags u3.x extension ids that actually exist in curriculum.js, and none claim a real spec point', () => {
  const questions = makeQuestions(GravityField, OrbitalMechanics);
  questions.forEach((q) => {
    q.units.forEach((id) => {
      const subtopic = getSubtopic(id);
      assert.ok(subtopic, `${q.id} references missing subtopic "${id}"`);
      assert.equal(subtopic.level, 'extension', `${q.id}'s unit "${id}" should be level:'extension'`);
      assert.equal(subtopic.spec, undefined, `${q.id}'s unit "${id}" is extension content and should not carry a spec tag`);
    });
  });
});
