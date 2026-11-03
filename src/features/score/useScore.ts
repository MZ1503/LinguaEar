import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

import { selectScore } from './scoreSelectors';
import { fetchScore, recordGame, recordQuiz } from './scoreThunks';

/** The signed-in user's score summary, plus actions that report points. */
export function useScore() {
  const dispatch = useAppDispatch();
  const summary = useAppSelector(selectScore);

  return {
    summary,
    refresh: () => dispatch(fetchScore()),
    /** Resolves to the points awarded, or null if reporting failed. */
    reportQuiz: (correct: number, total: number, analysisId: number | null) =>
      dispatch(recordQuiz({ correct, total, analysisId })).then((a) =>
        recordQuiz.fulfilled.match(a) ? a.payload : null,
      ),
    reportGame: (points: number) => dispatch(recordGame(points)),
  };
}

/** Loads the score once when the signed-in area mounts. */
export function useScoreSync() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchScore());
  }, [dispatch]);
}
