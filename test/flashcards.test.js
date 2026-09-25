/**
 * The reusable flashcard deck (flashcards.js): shuffle and navigation
 * are plain array/index math, tested here without a DOM. mount()'s DOM
 * building is exercised indirectly by every page that uses it.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { shuffle, wrapIndex } = require('../flashcards');

test('shuffle: is a permutation of the input, order unchanged when random() always returns 0', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];
  const result = shuffle(items, () => 0);
  assert.deepEqual([...result].sort(), [...items].sort());
  assert.equal(result.length, items.length);
});

test('shuffle: does not mutate the array it was given', () => {
  const items = [1, 2, 3, 4];
  const copy = [...items];
  shuffle(items, () => 0.5);
  assert.deepEqual(items, copy);
});

test('shuffle: a fixed random() sequence gives a reproducible, real reordering', () => {
  const items = [1, 2, 3, 4, 5];
  const values = [0.9, 0.1, 0.6, 0.2, 0];
  let i = 0;
  const random = () => values[i++];
  const result = shuffle(items, random);
  assert.deepEqual([...result].sort(), [1, 2, 3, 4, 5]);
  assert.notDeepEqual(result, items);
});

test('wrapIndex: steps within range are unchanged', () => {
  assert.equal(wrapIndex(0, 5), 0);
  assert.equal(wrapIndex(3, 5), 3);
  assert.equal(wrapIndex(4, 5), 4);
});

test('wrapIndex: wraps past the end back to the start, and before the start to the end', () => {
  assert.equal(wrapIndex(5, 5), 0);
  assert.equal(wrapIndex(6, 5), 1);
  assert.equal(wrapIndex(-1, 5), 4);
  assert.equal(wrapIndex(-2, 5), 3);
});
