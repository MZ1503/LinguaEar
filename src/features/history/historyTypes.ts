import type { Compound } from '@/src/shared/german/compounds';

export type SavedArticle = { word: string; gender: string };

/** What the app sends when saving a tutor result. */
export type AnalysisDraft = {
  transcript: string;
  explanation: string;
  tone: string;
  grammar: string;
  quiz: string;
  articles: SavedArticle[];
  compounds: Compound[];
};

export type SavedAnalysis = AnalysisDraft & { id: number; created_at: string };

export type HistoryState = {
  items: SavedAnalysis[];
  status: 'idle' | 'loading' | 'failed';
  /** False once a page comes back shorter than the page size. */
  hasMore: boolean;
};

export type HistoryRootState = { history: HistoryState };
