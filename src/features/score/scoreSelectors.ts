import type { ScoreRootState } from './scoreTypes';

export const selectScore = (s: ScoreRootState) => s.score.summary;
