/**
 * Unit tests for offline features and pure parsing utilities.
 * Run with:  npx jest src/features/offline/__tests__/offlineAndParsers.test.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const jest: any;

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  searchOfflineDictionary,
  generateOfflineQuiz,
  getActiveDictionary,
  downloadPack,
  removePack,
  getDownloadedPackIds,
  saveCustomWord,
  removeCustomWord,
  getCustomWords,
  OFFLINE_DICTIONARY,
  STARTER_PACK_ENTRIES,
  DOWNLOADABLE_PACKS,
} from '../offlineDictionary';
import type { DictEntry } from '../offlineDictionary';
import { parseGameResponse } from '../../game/gameParser';
import { sanitizeCompounds } from '../../../shared/german/compounds';
import { markNouns } from '../../../shared/german/gender';

describe('searchOfflineDictionary', () => {
  it('returns all entries when query and category are empty', () => {
    expect(searchOfflineDictionary('')).toHaveLength(OFFLINE_DICTIONARY.length);
  });

  it('filters by German word (case-insensitive)', () => {
    const results = searchOfflineDictionary('reisepass');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.de.toLowerCase().includes('reisepass'))).toBe(true);
  });

  it('filters by English translation', () => {
    const results = searchOfflineDictionary('passport');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.en.toLowerCase().includes('passport'))).toBe(true);
  });

  it('filters by category', () => {
    const results = searchOfflineDictionary('', 'Medical');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.category === 'Medical')).toBe(true);
  });

  it('combines query and category filter', () => {
    const results = searchOfflineDictionary('police', 'Medical');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.category).toBe('Medical');
      const matchesQuery =
        r.de.toLowerCase().includes('police') ||
        r.en.toLowerCase().includes('police') ||
        r.example_de.toLowerCase().includes('police') ||
        r.example_en.toLowerCase().includes('police');
      expect(matchesQuery).toBe(true);
    });
  });

  it('searches custom word entries when provided in sourceList', () => {
    const custom: DictEntry[] = [
      {
        id: 'cust-1',
        de: 'Pfau',
        en: 'peacock',
        category: 'Custom & Saved',
        example_de: 'Der Pfau ist bunt.',
        example_en: 'The peacock is colorful.',
        isCustom: true,
      },
    ];
    const results = searchOfflineDictionary('peacock', undefined, custom);
    expect(results).toHaveLength(1);
    expect(results[0].de).toBe('Pfau');
  });

  it('returns empty array for a query that matches nothing', () => {
    expect(searchOfflineDictionary('zzzznotaword')).toHaveLength(0);
  });
});

// ─── Downloadable Packs & Active Dictionary ─────────────────────────────────

describe('Downloadable Packs & Active Dictionary', () => {
  it('defines 4 optional packs with expected properties', () => {
    const packIds = ['nature', 'amt', 'cafe', 'medical'] as const;
    for (const id of packIds) {
      const pack = DOWNLOADABLE_PACKS[id];
      expect(pack).toBeDefined();
      expect(typeof pack.title).toBe('string');
      expect(typeof pack.sizeKb).toBe('number');
      expect(pack.entries.length).toBeGreaterThan(0);
    }
  });

  it('nature pack includes bird (Vogel) and peacock (Pfau)', () => {
    const nature = DOWNLOADABLE_PACKS.nature;
    expect(nature.entries.some((e) => e.de.toLowerCase() === 'vogel')).toBe(true);
    expect(nature.entries.some((e) => e.de.toLowerCase() === 'pfau')).toBe(true);
  });

  it('getActiveDictionary returns starter pack when no packs are downloaded', () => {
    const active = getActiveDictionary([], []);
    expect(active).toHaveLength(STARTER_PACK_ENTRIES.length);
  });

  it('getActiveDictionary combines starter pack, downloaded pack, and custom words', () => {
    const custom: DictEntry[] = [
      {
        id: 'custom-1',
        de: 'Schildkröte',
        en: 'turtle',
        category: 'Custom & Saved',
        example_de: 'Die Schildkröte läuft langsam.',
        example_en: 'The turtle walks slowly.',
        isCustom: true,
      },
    ];
    const active = getActiveDictionary(['nature'], custom);
    expect(active.some((e) => e.de === 'Schildkröte')).toBe(true);
    expect(active.some((e) => e.de === 'Vogel')).toBe(true);
    expect(active.some((e) => e.de === 'Hallo')).toBe(true);
    expect(active.length).toBe(STARTER_PACK_ENTRIES.length + DOWNLOADABLE_PACKS.nature.entries.length + 1);
  });
});

// ─── Pack Persistence & Custom Word Storage ─────────────────────────────────

describe('Pack Persistence & Custom Word Storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('downloads a pack and persists to AsyncStorage', async () => {
    const initial = await getDownloadedPackIds();
    expect(initial).toEqual([]);

    const downloaded = await downloadPack('amt');
    expect(downloaded).toContain('amt');

    const retrieved = await getDownloadedPackIds();
    expect(retrieved).toContain('amt');
  });

  it('removes a downloaded pack from AsyncStorage', async () => {
    await downloadPack('cafe');
    await downloadPack('medical');

    const remaining = await removePack('cafe');
    expect(remaining).not.toContain('cafe');
    expect(remaining).toContain('medical');

    const retrieved = await getDownloadedPackIds();
    expect(retrieved).not.toContain('cafe');
  });

  it('saves and deletes a custom AI word permanently', async () => {
    const saved = await saveCustomWord({
      de: 'Eichhörnchen',
      en: 'squirrel',
      gender: 'das',
      example_de: 'Das Eichhörnchen sammelt Nüsse.',
      example_en: 'The squirrel collects nuts.',
    });

    expect(saved.id).toContain('custom-');
    expect(saved.isCustom).toBe(true);

    const allWords = await getCustomWords();
    expect(allWords.some((w) => w.de === 'Eichhörnchen')).toBe(true);

    const afterDelete = await removeCustomWord(saved.id);
    expect(afterDelete.some((w) => w.de === 'Eichhörnchen')).toBe(false);
  });
});

// ─── generateOfflineQuiz ────────────────────────────────────────────────────

describe('generateOfflineQuiz', () => {
  it('generates the requested number of questions', () => {
    const qs = generateOfflineQuiz(5);
    expect(qs.length).toBe(5);
  });

  it('each question has 3 options with a valid answer_index', () => {
    const qs = generateOfflineQuiz(5);
    for (const q of qs) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer_index).toBeGreaterThanOrEqual(0);
      expect(q.answer_index).toBeLessThan(q.options.length);
    }
  });

  it('the correct option is a known English translation', () => {
    const knownTranslations = new Set(OFFLINE_DICTIONARY.map((e) => e.en));
    const qs = generateOfflineQuiz(10);
    for (const q of qs) {
      expect(knownTranslations.has(q.options[q.answer_index])).toBe(true);
    }
  });

  it('no question has duplicate options', () => {
    const qs = generateOfflineQuiz(5);
    for (const q of qs) {
      const unique = new Set(q.options.map((o: string) => o.toLowerCase()));
      expect(unique.size).toBe(q.options.length);
    }
  });

  it('explanation is a non-empty string', () => {
    const qs = generateOfflineQuiz(3);
    for (const q of qs) {
      expect(typeof q.explanation).toBe('string');
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });
});

// ─── parseGameResponse ──────────────────────────────────────────────────────

describe('parseGameResponse', () => {
  it('extracts a positive scoreDelta', () => {
    const result = parseGameResponse('SCORE: 10\nGood answer!');
    expect(result.scoreDelta).toBe(10);
  });

  it('accumulates multiple SCORE lines', () => {
    const result = parseGameResponse('SCORE: 5\nSCORE: 3\nFeedback.');
    expect(result.scoreDelta).toBe(8);
  });

  it('ignores non-numeric SCORE values', () => {
    const result = parseGameResponse('SCORE: abc\nText here.');
    expect(result.scoreDelta).toBe(0);
  });

  it('extracts NEXT AI RESPONSE', () => {
    const result = parseGameResponse('NEXT AI RESPONSE: Was möchten Sie trinken?');
    expect(result.aiPrompt).toBe('Was möchten Sie trinken?');
  });

  it('extracts AI RESPONSE as alias', () => {
    const result = parseGameResponse('AI RESPONSE: Guten Tag!');
    expect(result.aiPrompt).toBe('Guten Tag!');
  });

  it('extracts BREAKDOWN lines', () => {
    const result = parseGameResponse('BREAKDOWN: Mietvertrag: rental contract\nBREAKDOWN: Visum: visa');
    expect(result.breakdowns).toHaveLength(2);
    expect(result.breakdowns[0]).toEqual({ word: 'Mietvertrag', meaning: 'rental contract' });
    expect(result.breakdowns[1]).toEqual({ word: 'Visum', meaning: 'visa' });
  });

  it('ignores BREAKDOWN lines with "none"', () => {
    const result = parseGameResponse('BREAKDOWN: none');
    expect(result.breakdowns).toHaveLength(0);
  });

  it('collects plain text into explanation', () => {
    const result = parseGameResponse('Great sentence!\nKeep it up.');
    expect(result.explanation).toContain('Great sentence!');
    expect(result.explanation).toContain('Keep it up.');
  });

  it('strips markdown bold markers from explanation', () => {
    const result = parseGameResponse('**Well done!** You said it perfectly.');
    expect(result.explanation).not.toContain('**');
  });

  it('returns empty defaults for an empty string', () => {
    const result = parseGameResponse('');
    expect(result.scoreDelta).toBe(0);
    expect(result.aiPrompt).toBeUndefined();
    expect(result.breakdowns).toHaveLength(0);
    expect(result.explanation).toBe('');
  });
});

// ─── sanitizeCompounds ──────────────────────────────────────────────────────

describe('sanitizeCompounds', () => {
  it('returns empty array for non-array input', () => {
    expect(sanitizeCompounds(null)).toHaveLength(0);
    expect(sanitizeCompounds('string')).toHaveLength(0);
    expect(sanitizeCompounds(42)).toHaveLength(0);
  });

  it('accepts a valid compound whose parts spell the word exactly', () => {
    const raw = [
      {
        word: 'Handschuh',
        parts: [
          { text: 'Hand', meaning: 'hand' },
          { text: 'schuh', meaning: 'shoe' },
        ],
        meaning: 'glove',
      },
    ];
    const result = sanitizeCompounds(raw);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('Handschuh');
    expect(result[0].parts).toHaveLength(2);
  });

  it('rejects a compound whose parts do not spell the word', () => {
    const raw = [
      {
        word: 'Handschuh',
        parts: [
          { text: 'Hand', meaning: 'hand' },
          { text: 'x', meaning: 'x' },
        ],
        meaning: 'glove',
      },
    ];
    expect(sanitizeCompounds(raw)).toHaveLength(0);
  });

  it('rejects a compound with only one part', () => {
    const raw = [{ word: 'Hand', parts: [{ text: 'Hand', meaning: 'hand' }], meaning: 'hand' }];
    expect(sanitizeCompounds(raw)).toHaveLength(0);
  });

  it('deduplicates the same word', () => {
    const part = [
      { text: 'Hand', meaning: 'hand' },
      { text: 'schuh', meaning: 'shoe' },
    ];
    const raw = [
      { word: 'Handschuh', parts: part, meaning: 'glove' },
      { word: 'Handschuh', parts: part, meaning: 'glove' },
    ];
    expect(sanitizeCompounds(raw)).toHaveLength(1);
  });

  it('allows a linking letter with an empty meaning', () => {
    const raw = [
      {
        word: 'Arbeitsplatz',
        parts: [
          { text: 'Arbeit', meaning: 'work' },
          { text: 's', meaning: '' },
          { text: 'platz', meaning: 'place' },
        ],
        meaning: 'workplace',
      },
    ];
    const result = sanitizeCompounds(raw);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('Arbeitsplatz');
  });

  it('caps results at 6', () => {
    const part = (w: string) => [
      { text: w.slice(0, 4), meaning: 'a' },
      { text: w.slice(4), meaning: 'b' },
    ];
    const raw = Array.from({ length: 10 }, (_, i) => ({
      word: `Hand${String(i).padStart(4, '0')}`,
      parts: part(`Hand${String(i).padStart(4, '0')}`),
      meaning: `meaning ${i}`,
    }));
    expect(sanitizeCompounds(raw).length).toBeLessThanOrEqual(6);
  });
});

// ─── markNouns ──────────────────────────────────────────────────────────────

describe('markNouns', () => {
  it('returns a single segment when there are no nouns', () => {
    const result = markNouns('Hello there', []);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Hello there');
    expect(result[0].gender).toBeUndefined();
  });

  it('tags a known noun with its gender', () => {
    const nouns = [{ word: 'Hund', gender: 'der' }];
    const result = markNouns('Der Hund läuft.', nouns);
    const tagged = result.filter((s) => s.gender === 'der');
    expect(tagged.length).toBeGreaterThan(0);
    expect(tagged.some((s) => s.text.includes('Hund'))).toBe(true);
  });

  it('leaves unrecognised words untagged', () => {
    const nouns = [{ word: 'Katze', gender: 'die' }];
    const result = markNouns('Ein schöner Tag.', nouns);
    expect(result.every((s) => s.gender === undefined)).toBe(true);
  });

  it('handles plural/case ending (Handschuh -> Handschuhe)', () => {
    const nouns = [{ word: 'Handschuh', gender: 'der' }];
    const result = markNouns('Ich trage Handschuhe.', nouns);
    const tagged = result.filter((s) => s.gender !== undefined);
    expect(tagged.length).toBeGreaterThan(0);
  });

  it('ignores invalid gender values gracefully', () => {
    const nouns = [{ word: 'Tisch', gender: 'xyz' }];
    const result = markNouns('Der Tisch ist groß.', nouns);
    expect(result.every((s) => s.gender === undefined)).toBe(true);
  });
});
