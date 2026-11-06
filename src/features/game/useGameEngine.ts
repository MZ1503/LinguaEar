import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

import { setStatus } from './gameActions';
import { selectGame } from './gameSelectors';
import { resetGame, setAiPrompt, setLevel, setScore, startScenario } from './gameSlice';
import type { GameLevel, GameScenario, LevelId } from './gameTypes';
import { processUserSpeech } from './gameThunks';

/** Game state lives in the Redux store, so it survives tab switches. */
export function useGameEngine() {
  const dispatch = useAppDispatch();
  const game = useAppSelector(selectGame);

  return {
    ...game,
    startScenario: (scenario: GameScenario, level: GameLevel) => dispatch(startScenario({ scenario, level })),
    setLevel: (level: LevelId) => dispatch(setLevel(level)),
    setStatus: (status: string) => dispatch(setStatus(status)),
    setScore: (score: number) => dispatch(setScore(score)),
    setAiPrompt: (prompt: string) => dispatch(setAiPrompt(prompt)),
    processUserSpeech: (text: string) => dispatch(processUserSpeech(text)),
    resetGame: () => dispatch(resetGame()),
  };
}
