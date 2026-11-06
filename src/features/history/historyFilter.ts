export type SourceFilter = 'all' | 'speech' | 'scan';
export type RangeFilter = 'all' | 'today' | 'week' | 'month';

export type HistoryFilter = { source: SourceFilter; range: RangeFilter };

export const DEFAULT_FILTER: HistoryFilter = { source: 'all', range: 'all' };

const DAY_MS = 24 * 60 * 60 * 1000;

export const isFiltered = (f: HistoryFilter) => f.source !== 'all' || f.range !== 'all';

/** The oldest moment a phrase may have been saved to pass the date filter, or null for any date. */
export function sinceOf(range: RangeFilter, now: Date = new Date()): Date | null {
  switch (range) {
    case 'today': {
      // The start of today in the user's own time zone, not UTC.
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'week':
      return new Date(now.getTime() - 7 * DAY_MS);
    case 'month':
      return new Date(now.getTime() - 30 * DAY_MS);
    default:
      return null;
  }
}

/** Does a phrase belong in the list under this filter? Mirrors what the server filters on. */
export function matchesFilter(
  item: { source: string; created_at: string },
  filter: HistoryFilter,
  now: Date = new Date(),
): boolean {
  if (filter.source !== 'all' && item.source !== filter.source) return false;
  const since = sinceOf(filter.range, now);
  return since === null || new Date(item.created_at) >= since;
}

export const sameFilter = (a: HistoryFilter, b: HistoryFilter) =>
  a.source === b.source && a.range === b.range;
