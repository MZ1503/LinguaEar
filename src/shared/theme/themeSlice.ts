import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark';

type ThemeState = { mode: ThemeMode };
type ThemeRootState = { theme: ThemeState };

const STORAGE_KEY = 'linguaear.theme';

const initialState: ThemeState = { mode: Appearance.getColorScheme() === 'light' ? 'light' : 'dark' };

/** Restores the saved choice; with none saved, the system setting from start-up stays. */
export const hydrateTheme = createAsyncThunk('theme/hydrate', async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
});

export const toggleTheme = createAsyncThunk<ThemeMode, void, { state: ThemeRootState }>(
  'theme/toggle',
  async (_, { getState }) => {
    const next: ThemeMode = getState().theme.mode === 'dark' ? 'light' : 'dark';
    await AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    return next;
  },
);

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, { payload }: PayloadAction<ThemeMode>) => {
      state.mode = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateTheme.fulfilled, (state, { payload }) => {
        if (payload) state.mode = payload;
      })
      // Flip immediately; the write to storage happens in the background.
      .addCase(toggleTheme.pending, (state) => {
        state.mode = state.mode === 'dark' ? 'light' : 'dark';
      });
  },
});

export const { setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;

export const selectThemeMode = (s: ThemeRootState) => s.theme.mode;
