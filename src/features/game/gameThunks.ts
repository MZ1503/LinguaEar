import { createAsyncThunk } from '@reduxjs/toolkit';

import { recordGame } from '@/src/features/score/scoreThunks';
import { aiChat } from '@/src/features/ai';

import { parseGameResponse } from './gameParser';
import type { GameRootState } from './gameTypes';
import { GERMAN_TEACHER_PROMPTS, LOADING_MESSAGES, OUTPUT_TOKENS_INSTRUCTION } from './immigrationData';
import { setStatus, speechHeard } from './gameActions';

export const processUserSpeech = createAsyncThunk<string, string, { state: GameRootState }>(
  'game/processUserSpeech',
  async (text, { dispatch, getState }) => {
    const { currentMode } = getState().game;
    if (!currentMode) throw new Error('No level selected');

    dispatch(speechHeard(text));

    let i = 0;
    const interval = setInterval(() => {
      if (i < LOADING_MESSAGES.length) dispatch(setStatus(LOADING_MESSAGES[i++]));
    }, 1200);

    try {
      const systemPayload = `${GERMAN_TEACHER_PROMPTS[currentMode]}\n\n${OUTPUT_TOKENS_INSTRUCTION}`;
      const reply = await aiChat('game', [
        { role: 'system', content: systemPayload },
        { role: 'user', content: `I just said: ${text}` },
      ]);
      // Points earned this turn go to the server, where the user's total lives.
      const { scoreDelta } = parseGameResponse(reply);
      if (scoreDelta > 0) dispatch(recordGame(scoreDelta));
      return reply;
    } finally {
      clearInterval(interval);
    }
  },
);
