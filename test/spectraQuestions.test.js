const test = require('node:test');
const assert = require('node:assert/strict');
const Spectra = require('../src/spectra');
const { makeQuestions } = require('../src/spectraQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(Spectra);
const SPEC_TAGS = ['13.4a', '13.4b', '13.4c', '13.20', '13.21'];

// Every combination of answers a multi-field question can be given.
function fieldCombos(fields) {
  return fields.reduce(
    (combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))),
    [{}]
  );
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  if (q.type === 'choice') return q.options.filter((value) => q.check(value).correct);
  return [];
}

test('at least 8 questions, every id unique', () => {
  assert.ok(questions.length >= 8, `${questions.length}`);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
});

test('every question carries marks (a positive whole number) and a spec sub-part tag', () => {
  questions.forEach((q) => {
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
    assert.ok(SPEC_TAGS.includes(q.spec), `${q.id}: ${q.spec}`);
  });
});

test('every spec sub-part 13.4a, 13.4b, 13.4c, 13.20 and 13.21 has at least one question', () => {
  SPEC_TAGS.forEach((tag) => assert.ok(questions.some((q) => q.spec === tag), tag));
});

test('every units tag resolves to a real curriculum subtopic, and 13.20 questions sit on u4.7, the rest on u4.6', () => {
  questions.forEach((q) => {
    q.units.forEach((id) => assert.ok(getSubtopic(id), `${q.id}: ${id}`));
    assert.deepEqual(q.units, [q.spec === '13.20' ? 'u4.7' : 'u4.6'], q.id);
  });
});

test('a multi-field question has exactly as many fields as marks (one mark per field)', () => {
  questions.filter((q) => q.fields).forEach((q) => assert.equal(q.fields.length, q.marks, q.id));
});

test('every choice and multi-field question has exactly one fully-correct answer', () => {
  questions.filter((q) => q.fields || q.type === 'choice').forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
  });
});

test('every answer, right or wrong, shows the full mark scheme', () => {
  questions.forEach((q) => {
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 3) : q.type === 'choice' ? q.options : [0, 2400];
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('a multi-field answer reports a score out of the question\'s own marks', () => {
  questions.filter((q) => q.fields).forEach((q) => {
    const [right] = correctAnswers(q);
    assert.match(q.check(right).message, new RegExp(`^${q.marks} out of ${q.marks} mark`), q.id);
  });
});

test('the element question: hydrogen and calcium present, helium and sodium not, worked out from the line lists', () => {
  const q = questions.find((x) => x.id === 'unknown-star-elements');
  const [right] = correctAnswers(q);
  assert.deepEqual(right, { hydrogen: 'Present', helium: 'Not present', sodium: 'Not present', calcium: 'Present' });
  // Every reference wavelength the student needs is stated in the prompt.
  Spectra.ELEMENT_KEYS.forEach((key) => Spectra.ELEMENTS[key].lines.forEach((nm) => assert.ok(q.prompt.includes(nm.toFixed(1)), `${key} ${nm}`)));
});

test('the radial velocity question: star P (657.1 nm) recedes, and is faster than star Q (656.7 nm)', () => {
  const q = questions.find((x) => x.id === 'redshift-direction-and-speed');
  assert.deepEqual(correctAnswers(q), [{ direction: 'Away from us', faster: 'Star P' }]);
  assert.ok(q.prompt.includes('656.3'));
});

test('the Kirchhoff question matches spectrumType: absorption through the cloud, emission from the side', () => {
  const q = questions.find((x) => x.id === 'which-spectrum-from-setup');
  assert.deepEqual(correctAnswers(q), [{ through: 'Absorption', side: 'Emission' }]);
});

test('the exposure question: 1,200 counts in 3 s gives 2,400 in 6 s, with at least a 2% tolerance', () => {
  const q = questions.find((x) => x.id === 'exposure-time-count');
  assert.equal(q.check(2400).correct, true);
  assert.equal(q.check(2400 * 1.019).correct, true);
  assert.equal(q.check(2400 * 0.981).correct, true);
  assert.equal(q.check(1200).correct, false);
  assert.match(q.check(2400).message, /1,200 × 2 = 2,400/);
});

test('total marks across the bank', () => {
  const total = questions.reduce((sum, q) => sum + q.marks, 0);
  assert.equal(total, 22);
});
