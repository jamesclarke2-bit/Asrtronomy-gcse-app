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

test('mgh-vs-exact: accepts the exact ΔU computed by the engine for a 1000 km climb, and rejects mgh', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'mgh-vs-exact');
  const R = OrbitalMechanics.EARTH_RADIUS_M;
  const exact = GravityField.potentialEnergyDifferenceNumerical(OrbitalMechanics.EARTH_MASS_KG, 1, R, R + 1000000);
  assert.ok(q.check(exact).correct);
  const g0 = GravityField.fieldMagnitude(OrbitalMechanics.EARTH_MASS_KG, R);
  assert.equal(q.check(g0 * 1000000).correct, false, 'the mgh approximation itself should not count as the exact answer');
});

test('mgh-vs-exact: the question states the constants it uses, and the 2% tolerance accepts a couple of textbook roundings of Earth\'s mass', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'mgh-vs-exact');
  const R = OrbitalMechanics.EARTH_RADIUS_M;

  assert.match(q.prompt, /G = 6\.6743×10⁻¹¹/, 'prompt should state G');
  assert.match(q.prompt, /M = 5\.97×10²⁴ kg/, 'prompt should state Earth\'s mass');
  assert.match(q.prompt, /R = 6,371 km/, 'prompt should state Earth\'s radius');
  assert.match(q.prompt, /g = 9\.8 m\/s²/, 'prompt should state g');

  // A student working from a slightly different textbook rounding of
  // Earth's mass should still land inside the 2% tolerance — the
  // question is pinned to the engine's own exact figure, but it isn't
  // so tight that it only accepts one specific rounding.
  const using597 = GravityField.potentialEnergyDifferenceNumerical(5.97e24, 1, R, R + 1000000);
  assert.ok(q.check(using597).correct, 'answer computed with M = 5.97×10²⁴ kg should be accepted');

  const using598 = GravityField.potentialEnergyDifferenceNumerical(5.98e24, 1, R, R + 1000000);
  assert.ok(q.check(using598).correct, 'answer computed with M = 5.98×10²⁴ kg should be accepted');

  const g0 = GravityField.fieldMagnitude(OrbitalMechanics.EARTH_MASS_KG, R);
  assert.equal(q.check(g0 * 1000000).correct, false, 'mgh should still be rejected even with the wider tolerance');
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

test('satellite-ke-higher-orbit: "KE falls, total rises" is the only correct option, and the worked answer shows every sign', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'satellite-ke-higher-orbit');
  const result = q.check(
    'Kinetic energy falls (smaller positive number — it moves slower, further out); total energy rises (smaller negative number — it becomes less negative, since it is now closer to escaping)'
  );
  assert.ok(result.correct);
  assert.match(result.message, /\+\d/, 'message should show an explicit positive sign for kinetic energy');
  assert.equal(q.check('Both rise — a higher orbit needs more energy, so every energy here goes up').correct, false);
});

test('escape-is-zero-total-energy: "total energy exactly zero" is the only correct option, and the worked answer shows every sign', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics), 'escape-is-zero-total-energy');
  const result = q.check(
    'Total energy exactly zero — negative (the line sits below zero) is bound, meeting the well again at a finite highest point; zero is the marginal "just escaping" case; positive (the line stays above zero) escapes with speed to spare'
  );
  assert.ok(result.correct);
  assert.match(result.message, /highest point reached/, 'message should tie back to the diagram');
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
