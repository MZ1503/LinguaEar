import { createAsyncThunk } from '@reduxjs/toolkit';

import * as api from './historyService';
import type { AnalysisDraft, HistoryRootState, SavedAnalysis } from './historyTypes';

const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.');

type Config = { rejectValue: string; state: HistoryRootState };

/** `reset` reloads from the first page; otherwise the next page is appended. */
export const fetchHistory = createAsyncThunk<
  { items: SavedAnalysis[]; reset: boolean },
  { reset?: boolean } | undefined,
  Config
>('history/fetch', async (arg, { getState, rejectWithValue }) => {
  const reset = !!arg?.reset;
  try {
    const offset = reset ? 0 : getState().history.items.length;
    return { items: await api.listAnalyses(offset), reset };
  } catch (err) {
    return rejectWithValue(messageOf(err));
  }
});

export const saveAnalysis = createAsyncThunk<SavedAnalysis, AnalysisDraft, Config>(
  'history/save',
  async (draft, { rejectWithValue }) => {
    try {
      return await api.saveAnalysis(draft);
    } catch (err) {
      return rejectWithValue(messageOf(err));
    }
  },
);

export const updateQuizScore = createAsyncThunk<
  SavedAnalysis,
  { id: number; score: number; total: number },
  Config
>('history/quizScore', async ({ id, score, total }, { rejectWithValue }) => {
  try {
    return await api.updateQuizScore(id, score, total);
  } catch (err) {
    return rejectWithValue(messageOf(err));
  }
});

export const deleteAnalysis = createAsyncThunk<number, number, Config>(
  'history/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteAnalysis(id);
      return id;
    } catch (err) {
      return rejectWithValue(messageOf(err));
    }
  },
);
