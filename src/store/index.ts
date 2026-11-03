import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from '@/src/features/auth';
import { gameReducer } from '@/src/features/game';
import { historyReducer } from '@/src/features/history';
import themeReducer from '@/src/shared/theme/themeSlice';

// Register each feature's reducer here when adding a feature.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    history: historyReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
