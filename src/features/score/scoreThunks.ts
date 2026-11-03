import { createAsyncThunk } from '@reduxjs/toolkit';

import * as api from './scoreService';

/** Loads the summary; a failure just keeps whatever is already shown. */
export const fetchScore = createAsyncThunk('score/fetch', () => api.getScore());

/** Reports a finished quiz and refreshes the summary. Resolves to the points awarded (0 on a retake). */
export const recordQuiz = createAsyncThunk<
  number,
  { correct: number; total: number; analysisId: number | null },
  { rejectValue: string }
>('score/quiz', async ({ correct, total, analysisId }, { dispatch, rejectWithValue }) => {
  try {
    const { points } = await api.postQuiz(correct, total, analysisId);
    dispatch(fetchScore());
    return points;
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : 'Could not record your score.');
  }
});

export const recordGame = createAsyncThunk<number, number, { rejectValue: string }>(
  'score/game',
  async (points, { dispatch, rejectWithValue }) => {
    try {
      const result = await api.postGame(points);
      dispatch(fetchScore());
      return result.points;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Could not record your score.');
    }
  },
);
