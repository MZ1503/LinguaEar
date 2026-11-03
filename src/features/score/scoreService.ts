import { authedFetch } from '@/src/features/auth';

import type { ScoreSummary } from './scoreTypes';

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Something went wrong.');
  }
  return body as T;
}

const post = (path: string, body: unknown) =>
  authedFetch(path, { method: 'POST', body: JSON.stringify(body) }).then((r) =>
    parse<{ points: number; total_points: number }>(r),
  );

export const getScore = () => authedFetch('/scores/me').then((r) => parse<ScoreSummary>(r));

export const postQuiz = (correct: number, total: number, analysisId: number | null) =>
  post('/scores/quiz', { correct, total, analysis_id: analysisId });

export const postGame = (points: number) => post('/scores/game', { points });
