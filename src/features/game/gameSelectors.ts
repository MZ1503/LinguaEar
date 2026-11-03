import type { GameRootState } from './gameTypes';

export const selectGame = (s: GameRootState) => s.game;
export const selectScore = (s: GameRootState) => s.game.score;
export const selectCurrentMode = (s: GameRootState) => s.game.currentMode;
