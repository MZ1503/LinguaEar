export type Breakdown = { word: string; meaning: string };

export type GameState = {
  currentMode: string | null;
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
