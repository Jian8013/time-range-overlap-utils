// Public entry point for time-range-overlap-utils.
// Re-exporting from core keeps a stable import surface: consumers can import
// from the package root without knowing how the internals are split.
export { overlap, overlapDuration, contains, mergeRanges } from './core.js';
