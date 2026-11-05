import test from 'node:test';
import assert from 'node:assert/strict';

import { overlap, overlapDuration, contains, mergeRanges } from '../src/core.js';

// Half-open semantics: touching ranges do not overlap.
test('touching ranges do not overlap', () => {
  assert.equal(overlap({ start: 0, end: 10 }, { start: 10, end: 20 }), false);
  assert.equal(overlapDuration({ start: 0, end: 10 }, { start: 10, end: 20 }), 0);
});

test('partial overlap reports true and correct duration', () => {
  const a = { start: 0, end: 10 };
  const b = { start: 5, end: 15 };
  assert.equal(overlap(a, b), true);
  assert.equal(overlapDuration(a, b), 5);
});

test('one range fully inside another', () => {
  const outer = { start: 0, end: 100 };
  const inner = { start: 20, end: 40 };
  assert.equal(overlap(outer, inner), true);
  assert.equal(overlap(outer, inner), overlap(inner, outer));
  assert.equal(overlapDuration(outer, inner), 20);
  assert.equal(overlapDuration(outer, inner), overlapDuration(inner, outer));
});

test('disjoint ranges report false and zero duration', () => {
  assert.equal(overlap({ start: 0, end: 5 }, { start: 6, end: 10 }), false);
  assert.equal(overlapDuration({ start: 0, end: 5 }, { start: 6, end: 10 }), 0);
});

test('identical ranges overlap fully', () => {
  const r = { start: 3, end: 9 };
  assert.equal(overlap(r, r), true);
  assert.equal(overlapDuration(r, r), 6);
});

test('empty ranges never overlap', () => {
  assert.equal(overlap({ start: 5, end: 5 }, { start: 0, end: 10 }), false);
  assert.equal(overlap({ start: 7, end: 3 }, { start: 0, end: 10 }), false);
  assert.equal(overlapDuration({ start: 5, end: 5 }, { start: 0, end: 10 }), 0);
});

test('non-finite and malformed ranges are rejected', () => {
  assert.equal(overlap({ start: NaN, end: 10 }, { start: 0, end: 10 }), false);
  assert.equal(overlap({ start: 0, end: Infinity }, { start: 0, end: 10 }), false);
  assert.equal(overlap(null, { start: 0, end: 10 }), false);
  assert.equal(overlap({ start: '0', end: 10 }, { start: 0, end: 10 }), false);
});

test('contains uses half-open boundaries', () => {
  const r = { start: 10, end: 20 };
  assert.equal(contains(r, 10), true);
  assert.equal(contains(r, 19.999), true);
  assert.equal(contains(r, 20), false);
  assert.equal(contains(r, 9.999), false);
});

test('contains rejects malformed ranges', () => {
  assert.equal(contains({ start: 10, end: 10 }, 10), false);
  assert.equal(contains({ start: 20, end: 10 }, 15), false);
  assert.equal(contains(undefined, 5), false);
});

test('mergeRanges coalesces overlapping ranges', () => {
  const out = mergeRanges([
    { start: 0, end: 5 },
    { start: 3, end: 8 },
    { start: 10, end: 12 },
  ]);
  assert.deepEqual(out, [
    { start: 0, end: 8 },
    { start: 10, end: 12 },
  ]);
});

test('mergeRanges coalesces touching ranges under half-open semantics', () => {
  const out = mergeRanges([
    { start: 0, end: 5 },
    { start: 5, end: 10 },
  ]);
  assert.deepEqual(out, [{ start: 0, end: 10 }]);
});

test('mergeRanges drops empty ranges and sorts unsorted input', () => {
  const out = mergeRanges([
    { start: 10, end: 12 },
    { start: 5, end: 5 },
    { start: 0, end: 3 },
  ]);
  assert.deepEqual(out, [
    { start: 0, end: 3 },
    { start: 10, end: 12 },
  ]);
});

test('mergeRanges does not mutate its input', () => {
  const input = [
    { start: 5, end: 10 },
    { start: 0, end: 3 },
  ];
  const snapshot = JSON.parse(JSON.stringify(input));
  mergeRanges(input);
  assert.deepEqual(input, snapshot);
});

test('mergeRanges handles non-array input', () => {
  assert.deepEqual(mergeRanges(null), []);
  assert.deepEqual(mergeRanges(undefined), []);
  assert.deepEqual(mergeRanges([]), []);
});
