# time-range-overlap-utils

Determine whether two time intervals overlap and, if so, how long the intersection lasts.

```js
import { overlap, overlapDuration, contains, mergeRanges } from 'time-range-overlap-utils';

const shift = { start: 9, end: 17 };
const meeting = { start: 15, end: 18 };

overlap(shift, meeting);            // true
overlapDuration(shift, meeting);    // 2
contains(shift, 12);                // true
mergeRanges([{ start: 0, end: 5 }, { start: 5, end: 10 }]);
// [{ start: 0, end: 10 }]
```

Endpoints are plain numbers. The library does not parse dates or care about units;
milliseconds, seconds, or minutes all work as long as both ranges use the same scale.

## Why this exists

Scheduling code keeps re-implementing the same comparison, and it keeps getting the
boundaries wrong. The specific problem is the touching case: a meeting that ends at
17:00 and a shift that starts at 17:00. Whether that counts as an overlap depends on
whether the intervals are closed or half-open, and mixing the two produces off-by-one
bugs that only show up at the boundary.

This library picks one answer and sticks to it: **every range is half-open, `[start, end)`**.
Touching ranges do not overlap, and `overlapDuration` returns `0` for them. That is the
right default for availability checks, where a zero-length intersection is not something
you can schedule into. If you need closed intervals, nudge your endpoints yourself.

The trade-off is that callers who think in closed intervals have to adjust. The
alternative — guessing based on context — is worse, because the same call site can be
used for both in the same program.

## The awkward edge

Ranges with `start >= end` are treated as empty and never overlap anything. This means
`{ start: 5, end: 5 }` and `{ start: 7, end: 3 }` both silently return `false` from
`overlap` rather than throwing. That is deliberate: it lets you pass a degenerate range
from upstream filtering without a guard at every call site. If you want to reject bad
input loudly, validate before calling.

Non-finite endpoints (`NaN`, `Infinity`) are likewise rejected as non-overlapping, so a
bad computation upstream yields `false` instead of a poisoned comparison.

## API

- `overlap(a, b) -> boolean` — true when the half-open ranges intersect by more than a point.
- `overlapDuration(a, b) -> number` — length of the intersection, or `0` when disjoint.
- `contains(range, point) -> boolean` — true when `range.start <= point < range.end`.
- `mergeRanges(ranges) -> Array<{start, end}>` — sort and coalesce; drops empty ranges and does not mutate the input.
