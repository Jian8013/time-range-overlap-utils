// Core time-range overlap logic.
//
// Ranges are represented as plain objects `{ start, end }` with numeric
// endpoints. We do NOT impose a unit: callers may use milliseconds, seconds,
// or any monotonic numeric scale, as long as both ranges share it. This keeps
// the library free of date parsing and timezone concerns.
//
// Interpretation decision (documented in README): half-open intervals
// [start, end). Two ranges that merely touch at a single point do NOT overlap,
// because a zero-length intersection is not useful for scheduling. Callers who
// want closed intervals can nudge endpoints themselves.

/**
 * Return true when the two ranges overlap by more than a single point.
 *
 * We treat ranges as half-open [start, end). A range with start >= end is
 * considered empty and never overlaps anything, which lets callers pass a
 * degenerate range without special-casing it at the call site.
 *
 * @param {{start: number, end: number}} a
 * @param {{start: number, end: number}} b
 * @returns {boolean}
 */
export function overlap(a, b) {
  if (!isValidRange(a) || !isValidRange(b)) return false;
  // Half-open semantics: overlap requires a.start < b.end AND b.start < a.end.
  return a.start < b.end && b.start < a.end;
}

/**
 * Return the length of the intersection of two ranges, or 0 when they do not
 * overlap. The result is never negative.
 *
 * @param {{start: number, end: number}} a
 * @param {{start: number, end: number}} b
 * @returns {number}
 */
export function overlapDuration(a, b) {
  if (!overlap(a, b)) return 0;
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return end - start;
}

/**
 * Return true when the point lies within the half-open range [start, end).
 *
 * @param {{start: number, end: number}} range
 * @param {number} point
 * @returns {boolean}
 */
export function contains(range, point) {
  if (!isValidRange(range)) return false;
  return point >= range.start && point < range.end;
}

/**
 * Merge a list of ranges into a minimal set of non-overlapping, sorted
 * ranges. Overlapping or touching ranges are coalesced.
 *
 * WHY: availability checks often produce many small free slots; collapsing
 * them makes downstream scheduling cheaper and avoids double-counting.
 * Touching ranges (a.end === b.start) are merged because under half-open
 * semantics the union is itself a single half-open range with no gap.
 *
 * Empty ranges (start >= end) are dropped.
 *
 * @param {Array<{start: number, end: number}>} ranges
 * @returns {Array<{start: number, end: number}>}
 */
export function mergeRanges(ranges) {
  if (!Array.isArray(ranges)) return [];
  const valid = ranges.filter(isValidRange);
  if (valid.length === 0) return [];

  // Copy before sorting so the caller's array is not mutated.
  const sorted = valid
    .map((r) => ({ start: r.start, end: r.end }))
    .sort((x, y) => x.start - y.start || x.end - y.end);

  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      if (current.end > last.end) last.end = current.end;
    } else {
      merged.push(current);
    }
  }
  return merged;
}

/**
 * Internal guard: a range is usable only if it has numeric endpoints and a
 * positive length. We check Number.isFinite rather than typeof number so that
 * NaN and Infinity cannot silently poison comparisons.
 *
 * @param {unknown} range
 * @returns {boolean}
 */
function isValidRange(range) {
  if (range === null || typeof range !== 'object') return false;
  const { start, end } = range;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start < end;
}
