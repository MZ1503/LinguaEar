import { authedFetch } from '@/src/features/auth';

import type { GameLevel, GameScenario } from './gameTypes';

export type ScenarioRequest = {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string;
  created_at: string;
};

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail;
    throw new Error(
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? String(detail[0].msg)
          : 'Something went wrong.',
    );
  }
  return body as T;
}

export const fetchScenarios = () =>
  authedFetch('/scenarios').then((r) => parse<{ levels: GameLevel[]; scenarios: GameScenario[] }>(r));

export const sendScenarioRequest = (title: string, description: string) =>
  authedFetch('/scenarios/requests', { method: 'POST', body: JSON.stringify({ title, description }) }).then(
    (r) => parse<ScenarioRequest>(r),
  );

export const fetchMyScenarioRequests = () =>
  authedFetch('/scenarios/requests/mine').then((r) => parse<ScenarioRequest[]>(r));
