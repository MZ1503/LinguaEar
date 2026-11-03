/** Palettes built around the ear logo's cyan. */
export type Palette = {
  bg: string;
  card: string;
  border: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  /** Text/icon colour on top of a solid accent fill. */
  onAccent: string;
  text: string;
  muted: string;
  error: string;
};

export const darkPalette: Palette = {
  bg: '#0b0f19',
  card: '#151b2b',
  border: '#252d42',
  accent: '#00d2ff',
  accentSoft: 'rgba(0, 210, 255, 0.14)',
  accentBorder: 'rgba(0, 210, 255, 0.35)',
  onAccent: '#0b0f19',
  text: '#ffffff',
  muted: '#8b93a7',
  error: '#ff6b6b',
};

export const lightPalette: Palette = {
  bg: '#f3f7fb',
  card: '#ffffff',
  border: '#e2e8f0',
  accent: '#0096c7',
  accentSoft: 'rgba(0, 150, 199, 0.12)',
  accentBorder: 'rgba(0, 150, 199, 0.35)',
  onAccent: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  error: '#dc2626',
};

export const palettes = { dark: darkPalette, light: lightPalette };

/** Fixed dark palette, used by screens that don't follow the theme toggle (login, onboarding). */
export const brand = darkPalette;
