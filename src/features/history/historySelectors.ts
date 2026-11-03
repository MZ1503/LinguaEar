import type { HistoryRootState } from './historyTypes';

export const selectHistory = (s: HistoryRootState) => s.history;
