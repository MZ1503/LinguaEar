import AsyncStorage from '@react-native-async-storage/async-storage';

import { authedFetch } from '@/src/features/auth';

import { matchesFilter, sinceOf } from './historyFilter';
import type { HistoryFilter } from './historyFilter';
import type { AnalysisDraft, SavedAnalysis } from './historyTypes';

export const PAGE_SIZE = 20;

const CACHE_KEY = 'linguaear.history.cache';

/** Returns true when the error is a network/connectivity failure (not an HTTP error). */
function isOfflineError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('could not reach the server') ||
    msg.includes('something went wrong')
  );
}

/** Reads the full cache array; returns [] on a parse error or cache miss. */
async function readCache(): Promise<SavedAnalysis[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SavedAnalysis[]) : [];
  } catch {
    return [];
  }
}

/** Persists a full replacement cache. Swallows storage errors so callers stay clean. */
async function writeCache(items: SavedAnalysis[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items));
  } catch {
    // AsyncStorage is best-effort for the cache; losing it is not fatal.
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Something went wrong.');
  }
  return body as T;
}

/** Fetches one page of analyses and refreshes the cache on success. Falls back to cache when offline. */
export const listAnalyses = async (offset: number, filter: HistoryFilter): Promise<SavedAnalysis[]> => {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (filter.source !== 'all') params.set('source', filter.source);
  const since = sinceOf(filter.range);
  // toISOString() is in UTC ("Z"), so the "+" of a zone offset never has to be encoded.
  if (since) params.set('since', since.toISOString());
  try {
    const items = await authedFetch(`/analyses?${params}`).then((r) => parse<SavedAnalysis[]>(r));
    // On a fresh fetch (offset 0, no filter) replace the cache; on pagination merge it.
    const existing = await readCache();
    if (offset === 0) {
      await writeCache(items);
    } else {
      const ids = new Set(items.map((i) => i.id));
      const merged = [...existing.filter((i) => !ids.has(i.id)), ...items].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      await writeCache(merged);
    }
    return items;
  } catch (err) {
    if (!isOfflineError(err)) throw err;
    // Offline: return matching items from the local cache, paged and filtered.
    const cached = await readCache();
    const filtered = cached.filter((item) => matchesFilter(item, filter));
    return filtered.slice(offset, offset + PAGE_SIZE);
  }
};

/** Saves an analysis to the server and upserts it into the local cache. Falls back to local-only when offline. */
export const saveAnalysis = async (draft: AnalysisDraft): Promise<SavedAnalysis> => {
  try {
    const saved = await authedFetch('/analyses', { method: 'POST', body: JSON.stringify(draft) }).then((r) =>
      parse<SavedAnalysis>(r),
    );
    const existing = await readCache();
    await writeCache([saved, ...existing]);
    return saved;
  } catch (err) {
    if (!isOfflineError(err)) throw err;
    // Offline: mint a temporary local record (negative id) so the UI can render it immediately.
    const localItem: SavedAnalysis = {
      id: -(Date.now()),
      transcript: draft.transcript,
      source: draft.source ?? 'speech',
      translation: draft.translation ?? '',
      explanation: draft.explanation ?? '',
      tone: draft.tone ?? '',
      grammar: draft.grammar ?? '',
      quiz: draft.quiz ?? '',
      articles: draft.articles ?? [],
      compounds: draft.compounds ?? [],
      quiz_questions: draft.quiz_questions ?? [],
      quiz_score: draft.quiz_score ?? null,
      quiz_total: draft.quiz_total ?? null,
      created_at: new Date().toISOString(),
    };
    const existing = await readCache();
    await writeCache([localItem, ...existing]);
    return localItem;
  }
};

/** Updates a quiz score in the backend and in the local cache. Falls back to local-only when offline. */
export const updateQuizScore = async (id: number, score: number, total: number): Promise<SavedAnalysis> => {
  try {
    const updated = await authedFetch(`/analyses/${id}/quiz-score`, {
      method: 'PATCH',
      body: JSON.stringify({ quiz_score: score, quiz_total: total }),
    }).then((r) => parse<SavedAnalysis>(r));
    const existing = await readCache();
    await writeCache(existing.map((i) => (i.id === id ? updated : i)));
    return updated;
  } catch (err) {
    if (!isOfflineError(err)) throw err;
    // Offline: update the cached item in-place.
    const existing = await readCache();
    const item = existing.find((i) => i.id === id);
    if (!item) throw new Error('Item not found in cache.');
    const updated = { ...item, quiz_score: score, quiz_total: total };
    await writeCache(existing.map((i) => (i.id === id ? updated : i)));
    return updated;
  }
};

/** Deletes an analysis from the backend and removes it from the local cache. */
export const deleteAnalysis = async (id: number): Promise<void> => {
  try {
    await authedFetch(`/analyses/${id}`, { method: 'DELETE' }).then((r) => parse<void>(r));
  } catch (err) {
    if (!isOfflineError(err)) throw err;
    // Even if offline we can at least remove it from the cache.
  }
  const existing = await readCache();
  await writeCache(existing.filter((i) => i.id !== id));
};
