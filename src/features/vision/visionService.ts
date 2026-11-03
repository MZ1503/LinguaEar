export type Direction = 'de-en' | 'en-de' | 'auto';

export type ScannedPhrase = {
  original: string;
  translation: string;
  /** Language of `original`: "de", "en" or something else. */
  language: string;
};

const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Must be a vision-capable model.
const VISION_MODEL = process.env.EXPO_PUBLIC_GROQ_VISION_MODEL || 'qwen/qwen3.8-27b';

const DIRECTION_RULE: Record<Direction, string> = {
  'de-en': 'Translate German text into English. Skip text that is not German.',
  'en-de': 'Translate English text into German. Skip text that is not English.',
  auto: 'Translate German text into English and English text into German. Skip other languages.',
};

const systemPrompt = (direction: Direction) => `
You are the camera translator inside LinguaEar, a German learning app.
Read all legible text in the photo and group it into natural phrases or sentences (signs, menu items and labels each stay one item; do not split a sentence by line breaks).
${DIRECTION_RULE[direction]}
Keep "original" exactly as printed. Keep translations short and natural.

Respond with JSON only, in exactly this shape:
{ "items": [ { "original": "text as printed", "translation": "the translation", "language": "de" } ] }
Use "items": [] if there is no readable text. Return at most 8 items.
`;

/** Reads the text in a photo and translates it. `base64` is a JPEG without the data: prefix. */
export async function scanImage(
  base64: string,
  direction: Direction,
  signal?: AbortSignal,
): Promise<ScannedPhrase[]> {
  if (!groqApiKey) throw new Error('Missing Groq API Key configuration.');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    signal,
    headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: VISION_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt(direction) },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Translate the text in this photo.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Scan failed (${response.status}). ${body.slice(0, 120)}`);
  }

  const data = await response.json();
  return filterByDirection(parsePhrases(data?.choices?.[0]?.message?.content), direction);
}

const SOURCE_LANGUAGES: Record<Direction, string[]> = {
  'de-en': ['de'],
  'en-de': ['en'],
  auto: ['de', 'en'],
};

/** The model sometimes translates text in the wrong source language; drop those items. */
export function filterByDirection(phrases: ScannedPhrase[], direction: Direction): ScannedPhrase[] {
  return phrases.filter((p) => SOURCE_LANGUAGES[direction].includes(p.language));
}

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
    result.push({
      original,
      translation,
      language: typeof item?.language === 'string' ? item.language.toLowerCase() : '',
    });
  }
  return result;
}
