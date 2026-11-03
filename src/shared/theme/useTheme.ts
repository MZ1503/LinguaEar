import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

import { palettes } from './brand';
import { selectThemeMode, toggleTheme } from './themeSlice';

export function useTheme() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectThemeMode);

  return {
    mode,
    isDark: mode === 'dark',
    colors: palettes[mode],
    toggle: () => dispatch(toggleTheme()),
  };
}
