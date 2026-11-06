import { authedFetch } from '@/src/features/auth';

import { sinceOf } from './historyFilter';
import type { HistoryFilter } from './historyFilter';
import type { AnalysisDraft, SavedAnalysis } from './historyTypes';

export const PAGE_SIZE = 20;

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Something went wrong.');
  }
  return body as T;
}

export const listAnalyses = (offset: number, filter: HistoryFilter) => {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (filter.source !== 'all') params.set('source', filter.source);
  const since = sinceOf(filter.range);
  // toISOString() is in UTC ("Z"), so the "+" of a zone offset never has to be encoded.
  if (since) params.set('since', since.toISOString());
  return authedFetch(`/analyses?${params}`).then((r) => parse<SavedAnalysis[]>(r));
};

export const saveAnalysis = (draft: AnalysisDraft) =>
  authedFetch('/analyses', { method: 'POST', body: JSON.stringify(draft) }).then((r) =>
    parse<SavedAnalysis>(r),
  );

export const updateQuizScore = (id: number, score: number, total: number) =>
  authedFetch(`/analyses/${id}/quiz-score`, {
    method: 'PATCH',
    body: JSON.stringify({ quiz_score: score, quiz_total: total }),
  }).then((r) => parse<SavedAnalysis>(r));

export const deleteAnalysis = (id: number) =>
  authedFetch(`/analyses/${id}`, { method: 'DELETE' }).then((r) => parse<void>(r));
