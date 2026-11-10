import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { setStatus, speechHeard } from './gameActions';
import { parseGameResponse } from './gameParser';
import { processUserSpeech } from './gameThunks';
import type { GameLevel, GameScenario, GameState, LevelId } from './gameTypes';

const IDLE_STATUS = 'Pick a scenario to start.';

const initialState: GameState = {
  scenario: null,
  level: 'beginner',
  levelRules: '',
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
    /** Starts a scenario at a level: the other person opens the conversation. */
    startScenario: (
      state,
      { payload }: PayloadAction<{ scenario: GameScenario; level: GameLevel }>,
    ) => {
      const { scenario, level } = payload;
      state.scenario = scenario;
      state.level = level.id;
      state.levelRules = level.rules;
      state.aiPrompt = scenario.openings[level.id] ?? '';
      state.status = `${scenario.title} is ready.`;
      state.heard = '';
      state.explanation = '';
      state.breakdowns = [];
    },
    setLevel: (state, { payload }: PayloadAction<LevelId>) => {
      state.level = payload;
    },
    setScore: (state, { payload }: PayloadAction<number>) => {
      state.score = payload;
    },
    setAiPrompt: (state, { payload }: PayloadAction<string>) => {
      state.aiPrompt = payload;
    },
    // Leaving a scenario keeps the chosen level.
    resetGame: (state) => ({ ...initialState, level: state.level }),
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
        state.status = state.scenario ? `${state.scenario.title}` : 'Your turn';
      })
      .addCase(processUserSpeech.rejected, (state, { error }) => {
        console.error(error);
        state.processing = false;
        state.status = 'System Processing Error';
      });
  },
});

export const { startScenario, setLevel, setScore, setAiPrompt, resetGame } = gameSlice.actions;
export default gameSlice.reducer;
