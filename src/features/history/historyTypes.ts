import type { Compound } from '@/src/shared/german/compounds';
import type { QuizQuestion } from '@/src/shared/german/quiz';

export type SavedArticle = { word: string; gender: string };

export type AnalysisSource = 'speech' | 'scan';

/** What the app sends when saving. Only the transcript is required; the server fills in the rest. */
export type AnalysisDraft = {
  /** The phrase itself: what was said, or the text read from the camera. */
  transcript: string;
  source?: AnalysisSource;
  /** Translation of a camera scan. */
  translation?: string;
  explanation?: string;
  tone?: string;
  grammar?: string;
  quiz?: string;
  articles?: SavedArticle[];
  compounds?: Compound[];
  quiz_questions?: QuizQuestion[];
  /** Latest quiz result; both are null until the quiz has been finished. */
  quiz_score?: number | null;
  quiz_total?: number | null;
};

/** A saved row as the API returns it: every field is present. */
export type SavedAnalysis = Required<Omit<AnalysisDraft, 'quiz_score' | 'quiz_total'>> & {
  id: number;
  created_at: string;
  quiz_score: number | null;
  quiz_total: number | null;
};

export type HistoryState = {
  items: SavedAnalysis[];
  status: 'idle' | 'loading' | 'failed';
  /** False once a page comes back shorter than the page size. */
  hasMore: boolean;
};

export type HistoryRootState = { history: HistoryState };
