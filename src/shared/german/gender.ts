/**
 * Colour grading for German noun genders: der (masculine) blue, die (feminine) pink, das (neuter) green.
 * Colour is never the only signal: each gender also has its own underline style and the article is
 * always written out, so it still works for people who can't tell the colours apart.
 */
export type Gender = 'der' | 'die' | 'das';

export const GENDERS: Gender[] = ['der', 'die', 'das'];

export const GENDER_COLORS: Record<Gender, string> = {
  der: '#3B82F6',
  die: '#EC4899',
  das: '#10B981',
};

export const GENDER_UNDERLINE: Record<Gender, 'solid' | 'dotted' | 'dashed'> = {
  der: 'solid',
  die: 'dotted',
  das: 'dashed',
};

export const GENDER_MEANING: Record<Gender, string> = {
  der: 'masculine',
  die: 'feminine',
  das: 'neuter',
};

export function parseGender(value: unknown): Gender | null {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return v === 'der' || v === 'die' || v === 'das' ? v : null;
}

/** Articles that come before a noun, in any case (den, dem, des, ein, eine...). */
const ARTICLES = new Set([
  'der',
  'die',
  'das',
  'den',
  'dem',
  'des',
  'ein',
  'eine',
  'einen',
  'einem',
  'einer',
  'eines',
]);

export type NounInfo = { word: string; gender: string };
export type Segment = { text: string; gender?: Gender };

/** A noun may appear with a plural or case ending (Handschuh -> Handschuhe), so a short ending still counts. */
const MAX_ENDING = 3;

function buildLookup(nouns: NounInfo[]): Map<string, Gender> {
  const lookup = new Map<string, Gender>();
  for (const n of nouns) {
    const gender = parseGender(n.gender);
    const word = n.word?.trim().split(/\s+/).pop()?.toLowerCase();
    if (gender && word) lookup.set(word, gender);
  }
  return lookup;
}

function genderOf(token: string, lookup: Map<string, Gender>): Gender | undefined {
  const t = token.toLowerCase();
  const exact = lookup.get(t);
  if (exact) return exact;
  for (const [noun, gender] of lookup) {
    if (t.length > noun.length && t.length - noun.length <= MAX_ENDING && t.startsWith(noun)) return gender;
  }
  return undefined;
}

/**
 * Splits `text` into pieces and tags each noun the model named, and the article right before it, with that
 * noun's gender. Only nouns that were actually named are tagged, because guessing from the text alone
 * would give wrong colours (der can be masculine or feminine, die can be plural).
 */
export function markNouns(text: string, nouns: NounInfo[]): Segment[] {
  const lookup = buildLookup(nouns);
  if (lookup.size === 0) return [{ text }];

  const parts = text.match(/\p{L}+|[^\p{L}]+/gu) ?? [text];
  const segments: Segment[] = parts.map((p) => ({ text: p }));
  const isWord = (i: number) => /^\p{L}/u.test(parts[i]);

  for (let i = 0; i < parts.length; i++) {
    if (!isWord(i)) continue;
    const gender = genderOf(parts[i], lookup);
    if (!gender) continue;
    segments[i].gender = gender;

    // The article sits just before the noun, separated by a single space.
    const gap = i - 1;
    const articleAt =
      gap >= 1 && !isWord(gap) && parts[gap].trim() === '' && parts[gap].length === 1 ? i - 2 : -1;
    if (articleAt >= 0 && isWord(articleAt) && ARTICLES.has(parts[articleAt].toLowerCase())) {
      // "die" before a masculine or neuter noun is the plural article, which says nothing about its gender.
      const plural = parts[articleAt].toLowerCase() === 'die' && gender !== 'die';
      if (!plural) {
        segments[articleAt].gender = gender;
        segments[gap].gender = gender; // the space too, so "der Hund" reads as one coloured phrase
      }
    }
  }

  // Merge neighbours so the article, the space and the noun read as one coloured phrase.
  const merged: Segment[] = [];
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const last = merged[merged.length - 1];
    if (last && last.gender === s.gender) last.text += s.text;
    else merged.push({ ...s });
  }
  return merged;
}
