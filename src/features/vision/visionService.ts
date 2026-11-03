import { aiChat } from '@/src/features/ai';

export type Direction = 'de-en' | 'en-de' | 'auto';

export type ScannedPhrase = {
  original: string;
  translation: string;
  /** Language of `original`: "de", "en" or something else. */
  language: string;
};

const DIRECTION_RULE: Record<Direction, string> = {
  'de-en': 'Translate each item into English.',
  'en-de': 'Translate each item into German.',
  auto: 'Translate German items into English and English items into German.',
};

const systemPrompt = (direction: Direction) => `
You are the camera translator inside LinguaEar, a German learning app.
Read all legible text in the photo and group it into natural phrases or sentences (signs, menu items and labels each stay one item; do not split a sentence by line breaks).
${DIRECTION_RULE[direction]}
Keep "original" exactly as printed. Keep translations short and natural.
"original_language" is the language the PRINTED text is written in ("de" for German, "en" for English, or another code). It is not the language you translate into.

Respond with JSON only, in exactly this shape:
{ "items": [ { "original": "text as printed", "original_language": "en", "translation": "the translation" } ] }
Use "items": [] if there is no readable text. Return at most 8 items.
`;

/** Reads the text in a photo and translates it. `base64` is a JPEG without the data: prefix. */
export async function scanImage(base64: string, direction: Direction): Promise<ScanResult> {
  const content = await aiChat(
    'scan',
    [
      { role: 'system', content: systemPrompt(direction) },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Translate the text in this photo.' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        ],
      },
    ],
    { json: true, temperature: 0.1 },
  );
  return resolveScan(parsePhrases(content), direction);
}

const SOURCE_LANGUAGES: Record<Direction, string[]> = {
  'de-en': ['de'],
  'en-de': ['en'],
  auto: ['de', 'en'],
};

const LANGUAGE_ALIASES: Record<string, string> = {
  de: 'de',
  deu: 'de',
  ger: 'de',
  german: 'de',
  deutsch: 'de',
  en: 'en',
  eng: 'en',
  english: 'en',
};

/** Maps what the model wrote ("German", "de-DE", "EN") to "de" / "en"; anything else is kept lower-cased. */
export function normalizeLanguage(raw: string): string {
  const key = raw.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] ?? LANGUAGE_ALIASES[key.split(/[-_]/)[0]] ?? key;
}

/** Keeps items whose printed text is in the direction's source language. */
export function filterByDirection(phrases: ScannedPhrase[], direction: Direction): ScannedPhrase[] {
  return phrases.filter((p) => SOURCE_LANGUAGES[direction].includes(p.language));
}

export type ScanResult = {
  phrases: ScannedPhrase[];
  /** Text that was read but is in the other language, e.g. German found while set to EN → DE. */
  skippedLanguage: 'de' | 'en' | null;
};

/** Tolerant parser: the model's JSON is untrusted, so keep only well-formed items. */
export function parsePhrases(content: unknown): ScannedPhrase[] {
  if (typeof content !== 'string') return [];
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  const list = Array.isArray(parsed?.items) ? parsed.items : [];
  const seen = new Set<string>();
  const result: ScannedPhrase[] = [];

  for (const item of list) {
    const original = typeof item?.original === 'string' ? item.original.trim() : '';
    const translation = typeof item?.translation === 'string' ? item.translation.trim() : '';
    if (!original || !translation || seen.has(original.toLowerCase())) continue;
    seen.add(original.toLowerCase());

    // `original_language` is the field the prompt asks for; `language` is the older name.
    const language = item?.original_language ?? item?.language;
    result.push({
      original,
      translation,
      language: typeof language === 'string' ? normalizeLanguage(language) : '',
    });
  }
  return result;
}

/** Applies the direction and reports when text was found only in the other language. */
export function resolveScan(phrases: ScannedPhrase[], direction: Direction): ScanResult {
  const kept = filterByDirection(phrases, direction);
  if (kept.length > 0 || phrases.length === 0) return { phrases: kept, skippedLanguage: null };
  const other = phrases[0].language;
  return { phrases: [], skippedLanguage: other === 'de' || other === 'en' ? other : null };
}
