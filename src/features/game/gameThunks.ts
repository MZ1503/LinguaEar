import { createAsyncThunk } from '@reduxjs/toolkit';

import { recordGame } from '@/src/features/score/scoreThunks';
import { aiChat } from '@/src/features/ai';

import { parseGameResponse } from './gameParser';
import type { GameRootState } from './gameTypes';
import { LOADING_MESSAGES, OUTPUT_TOKENS_INSTRUCTION } from './immigrationData';
import { setStatus, speechHeard } from './gameActions';

export const processUserSpeech = createAsyncThunk<string, string, { state: GameRootState }>(
  'game/processUserSpeech',
  async (text, { dispatch, getState }) => {
    const { scenario, levelRules, aiPrompt } = getState().game;
    if (!scenario) throw new Error('No scenario selected');

    dispatch(speechHeard(text));

    let i = 0;
    const interval = setInterval(() => {
      if (i < LOADING_MESSAGES.length) dispatch(setStatus(LOADING_MESSAGES[i++]));
    }, 1200);

    try {
      const systemPayload = `${scenario.persona}\n\n${levelRules}\n\n${OUTPUT_TOKENS_INSTRUCTION}`;
      // The model keeps no memory between turns, so it is told what it last said and how the player answered.
      const turn = aiPrompt
        ? `You just said: "${aiPrompt}"\nThe player answered: "${text}"`
        : `The player said: "${text}"`;
      const reply = await aiChat('game', [
        { role: 'system', content: systemPayload },
        { role: 'user', content: turn },
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
