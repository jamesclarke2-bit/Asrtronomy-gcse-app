const test = require('node:test');
const assert = require('node:assert/strict');
const { SPEC_POINTS, SPEC_POINT_CODES, getSpecPoint } = require('../src/specPoints');

const VALID_DEPTHS = ['know', 'understand', 'be able to'];
const REGISTERED_TOPICS = [1, 2, 3, 4, 5, 6, 9, 10];

test('all codes in specPoints.js are unique', () => {
  assert.equal(new Set(SPEC_POINT_CODES).size, SPEC_POINT_CODES.length);
});

test('SPEC_POINT_CODES is exactly the SPEC_POINTS codes, in the same order', () => {
  assert.deepEqual(SPEC_POINT_CODES, SPEC_POINTS.map((p) => p.code));
});

test('every spec point has a valid depth, a topic from the registered set, and non-empty text', () => {
  SPEC_POINTS.forEach((point) => {
    assert.ok(VALID_DEPTHS.includes(point.depth), `${point.code} has invalid depth "${point.depth}"`);
    assert.ok(REGISTERED_TOPICS.includes(point.topic), `${point.code} has unexpected topic ${point.topic}`);
    assert.ok(point.text && point.text.trim(), `${point.code} has no text`);
  });
});

test("every point's code starts with its own topic number", () => {
  SPEC_POINTS.forEach((point) => {
    assert.equal(point.code.split('.')[0], String(point.topic), `${point.code} should belong to topic ${point.topic}`);
  });
});

test('getSpecPoint resolves a known code and returns undefined for an unknown one', () => {
  assert.deepEqual(getSpecPoint('4.4'), { code: '4.4', topic: 4, depth: 'be able to', text: 'use Equation of Time = AST - MST' });
  assert.equal(getSpecPoint('99.9'), undefined);
  assert.equal(getSpecPoint('7.1'), undefined, 'Topic 7 is not in this registry (see curriculum.js\'s hand-typed spec ids)');
});

test('Topics 1-6, 9 and 10 are each present, with no gaps or extras in scope', () => {
  const topics = [...new Set(SPEC_POINTS.map((p) => p.topic))].sort((a, b) => a - b);
  assert.deepEqual(topics, REGISTERED_TOPICS);
});
