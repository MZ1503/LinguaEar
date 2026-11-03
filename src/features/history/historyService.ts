import { authedFetch } from '@/src/features/auth';

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

export const listAnalyses = (offset: number) =>
  authedFetch(`/analyses?limit=${PAGE_SIZE}&offset=${offset}`).then((r) => parse<SavedAnalysis[]>(r));

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
