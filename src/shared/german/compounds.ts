export type CompoundPart = {
  text: string;
  /** English meaning; empty for a linking letter such as the "s" in Arbeit-s-platz. */
  meaning: string;
};

export type Compound = {
  word: string;
  parts: CompoundPart[];
  meaning: string;
};

const MAX_COMPOUNDS = 6;

/**
 * The model's split is only shown if the parts really spell the word, so a
 * hallucinated split never reaches the screen.
 */
export function sanitizeCompounds(raw: unknown): Compound[] {
  if (!Array.isArray(raw)) return [];

  const result: Compound[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item.word !== 'string' || !Array.isArray(item.parts)) continue;

    const parts: CompoundPart[] = item.parts
      .filter((p: unknown): p is { text: string; meaning?: unknown } => typeof (p as any)?.text === 'string')
      .map((p: { text: string; meaning?: unknown }) => ({
        text: p.text.trim(),
        meaning: typeof p.meaning === 'string' ? p.meaning.trim() : '',
      }))
      .filter((p: CompoundPart) => p.text);

    const word = item.word.trim();
    const key = word.toLowerCase();
    const spelled = parts
      .map((p) => p.text)
      .join('')
      .toLowerCase();

    if (parts.length < 2 || spelled !== key || seen.has(key)) continue;

    seen.add(key);
    result.push({ word, parts, meaning: typeof item.meaning === 'string' ? item.meaning.trim() : '' });
    if (result.length === MAX_COMPOUNDS) break;
  }

  return result;
}
