export type ScoreSummary = {
  total_points: number;
  level: number;
  /** Points earned inside the current level. */
  level_points: number;
  level_size: number;
  streak_days: number;
  today_points: number;
};

export type ScoreState = {
  summary: ScoreSummary | null;
};

export type ScoreRootState = { score: ScoreState };
