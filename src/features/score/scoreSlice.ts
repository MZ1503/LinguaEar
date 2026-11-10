import { createSlice } from '@reduxjs/toolkit';

import { logout } from '@/src/features/auth';

import { fetchScore } from './scoreThunks';
import type { ScoreState } from './scoreTypes';

const initialState: ScoreState = { summary: null };

const scoreSlice = createSlice({
  name: 'score',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScore.fulfilled, (state, { payload }) => {
        state.summary = payload;
      })
      // Never show one account's points to the next person who signs in.
      .addCase(logout.fulfilled, () => initialState);
  },
});

export default scoreSlice.reducer;
