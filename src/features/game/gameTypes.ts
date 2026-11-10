export type Breakdown = { word: string; meaning: string };

export type LevelId = 'beginner' | 'intermediate' | 'professional';

export type GameLevel = {
  id: LevelId;
  label: string;
  cefr: string;
  description: string;
  /** Added to the AI's instructions so it talks and judges at this level. */
  rules: string;
};

export type KeyPhrase = { de: string; en: string };

/** A role-play situation. These come from the backend, so new ones appear without an app update. */
export type GameScenario = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  /** An Ionicons name. */
  icon: string;
  tint: string;
  persona: string;
  openings: Record<LevelId, string>;
  key_phrases: KeyPhrase[];
  sort_order: number;
};

export type GameState = {
  scenario: GameScenario | null;
  level: LevelId;
  levelRules: string;
  status: string;
  score: number;
  heard: string;
  explanation: string;
  aiPrompt: string;
  breakdowns: Breakdown[];
  /** True while the reply is being fetched from the model. */
  processing: boolean;
};

/** Shape the game thunks need from the root state, so they don't import the store. */
export type GameRootState = { game: GameState };
