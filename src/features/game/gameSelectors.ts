import type { GameRootState } from './gameTypes';

export const selectGame = (s: GameRootState) => s.game;
export const selectScore = (s: GameRootState) => s.game.score;
export const selectScenario = (s: GameRootState) => s.game.scenario;
