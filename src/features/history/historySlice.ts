import { createSlice } from '@reduxjs/toolkit';

import { logout } from '@/src/features/auth';

import { DEFAULT_FILTER, matchesFilter, sameFilter } from './historyFilter';
import type { HistoryFilter } from './historyFilter';
import { PAGE_SIZE } from './historyService';
import { deleteAnalysis, fetchHistory, saveAnalysis, updateQuizScore } from './historyThunks';
import type { HistoryState } from './historyTypes';
import type { PayloadAction } from '@reduxjs/toolkit';

const initialState: HistoryState = { items: [], filter: DEFAULT_FILTER, status: 'idle', hasMore: true };

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    clearHistory: () => initialState,
    /** Changes the filter and empties the list; the caller then reloads from the first page. */
    setFilter: (state, { payload }: PayloadAction<Partial<HistoryFilter>>) => {
      state.filter = { ...state.filter, ...payload };
      state.items = [];
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchHistory.fulfilled, (state, { payload }) => {
        // An answer for a filter that has since been changed is stale; the newer request will fill the list.
        if (!sameFilter(payload.filter, state.filter)) return;
        state.items = payload.reset ? payload.items : [...state.items, ...payload.items];
        state.hasMore = payload.items.length === PAGE_SIZE;
        state.status = 'idle';
      })
      .addCase(fetchHistory.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(saveAnalysis.fulfilled, (state, { payload }) => {
        // A new phrase only joins the list if it fits the filter being shown.
        if (matchesFilter(payload, state.filter)) state.items.unshift(payload);
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

export const { clearHistory, setFilter } = historySlice.actions;
export default historySlice.reducer;
