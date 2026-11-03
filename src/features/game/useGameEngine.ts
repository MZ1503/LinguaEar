import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

import { setStatus } from './gameActions';
import { selectGame } from './gameSelectors';
import { resetGame, setAiPrompt, setCurrentMode, setScore } from './gameSlice';
import { processUserSpeech } from './gameThunks';

/** Game state lives in the Redux store, so it survives tab switches. */
export function useGameEngine() {
  const dispatch = useAppDispatch();
  const game = useAppSelector(selectGame);

  return {
    ...game,
    setCurrentMode: (mode: string | null) => dispatch(setCurrentMode(mode)),
    setStatus: (status: string) => dispatch(setStatus(status)),
    setScore: (score: number) => dispatch(setScore(score)),
    setAiPrompt: (prompt: string) => dispatch(setAiPrompt(prompt)),
    processUserSpeech: (text: string) => dispatch(processUserSpeech(text)),
    resetGame: () => dispatch(resetGame()),
  };
}
