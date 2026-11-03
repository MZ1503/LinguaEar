import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { setStatus, speechHeard } from './gameActions';
import { parseGameResponse } from './gameParser';
import { processUserSpeech } from './gameThunks';
import type { GameState } from './gameTypes';

const IDLE_STATUS = 'Select a level to start roleplaying!';

const initialState: GameState = {
  currentMode: null,
  status: IDLE_STATUS,
  score: 0,
  heard: '',
  explanation: '',
  aiPrompt: '',
  breakdowns: [],
  processing: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentMode: (state, { payload }: PayloadAction<string | null>) => {
      state.currentMode = payload;
    },
    setScore: (state, { payload }: PayloadAction<number>) => {
      state.score = payload;
    },
    setAiPrompt: (state, { payload }: PayloadAction<string>) => {
      state.aiPrompt = payload;
    },
    resetGame: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(setStatus, (state, { payload }) => {
        state.status = payload;
      })
      .addCase(speechHeard, (state, { payload }) => {
        state.heard = payload;
      })
      .addCase(processUserSpeech.pending, (state) => {
        state.processing = true;
      })
      .addCase(processUserSpeech.fulfilled, (state, { payload }) => {
        state.processing = false;
        const parsed = parseGameResponse(payload);
        state.score += parsed.scoreDelta;
        if (parsed.aiPrompt !== undefined) state.aiPrompt = parsed.aiPrompt;
        state.explanation = parsed.explanation;
        state.breakdowns = parsed.breakdowns;
        state.status = `Playing Level: ${state.currentMode?.toUpperCase()}`;
      })
      .addCase(processUserSpeech.rejected, (state, { error }) => {
        console.error(error);
        state.processing = false;
        state.status = 'System Processing Error';
      });
  },
});

export const { setCurrentMode, setScore, setAiPrompt, resetGame } = gameSlice.actions;
export default gameSlice.reducer;
