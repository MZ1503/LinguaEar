import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

import { selectHistory } from './historySelectors';
import { deleteAnalysis, fetchHistory, saveAnalysis, updateQuizScore } from './historyThunks';
import type { AnalysisDraft } from './historyTypes';

/** unwrap() rejects with the thunk's string; callers expect an Error. */
async function settle<T>(action: { unwrap: () => Promise<T> }): Promise<T> {
  try {
    return await action.unwrap();
  } catch (err) {
    throw err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Something went wrong.');
  }
}

export function useHistory() {
  const dispatch = useAppDispatch();
  const { items, status, hasMore } = useAppSelector(selectHistory);

  return {
    items,
    status,
    hasMore,
    refresh: () => dispatch(fetchHistory({ reset: true })),
    loadMore: () => {
      if (status !== 'loading' && hasMore) dispatch(fetchHistory());
    },
    save: (draft: AnalysisDraft) => settle(dispatch(saveAnalysis(draft))),
    saveQuizScore: (id: number, score: number, total: number) =>
      settle(dispatch(updateQuizScore({ id, score, total }))),
    remove: (id: number) => settle(dispatch(deleteAnalysis(id))),
  };
}
