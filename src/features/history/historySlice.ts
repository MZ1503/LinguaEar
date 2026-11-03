import { createSlice } from '@reduxjs/toolkit';

import { logout } from '@/src/features/auth';

import { PAGE_SIZE } from './historyService';
import { deleteAnalysis, fetchHistory, saveAnalysis, updateQuizScore } from './historyThunks';
import type { HistoryState } from './historyTypes';

const initialState: HistoryState = { items: [], status: 'idle', hasMore: true };

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    clearHistory: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchHistory.fulfilled, (state, { payload }) => {
        state.items = payload.reset ? payload.items : [...state.items, ...payload.items];
        state.hasMore = payload.items.length === PAGE_SIZE;
        state.status = 'idle';
      })
      .addCase(fetchHistory.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(saveAnalysis.fulfilled, (state, { payload }) => {
        state.items.unshift(payload);
      })
      .addCase(updateQuizScore.fulfilled, (state, { payload }) => {
        const i = state.items.findIndex((item) => item.id === payload.id);
        if (i >= 0) state.items[i] = payload;
      })
      // Never show one account's saved phrases to the next person who signs in.
      .addCase(logout.fulfilled, () => initialState)
      .addCase(deleteAnalysis.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((i) => i.id !== payload);
      });
  },
});

export const { clearHistory } = historySlice.actions;
export default historySlice.reducer;
