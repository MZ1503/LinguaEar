import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QuizQuestion } from '@/src/shared/german/quiz';

export type DictCategory =
  | 'Essentials & Survival'
  | 'Animals & Nature'
  | 'Bureaucracy & Visa'
  | 'Food & Shopping'
  | 'Medical'
  | 'Custom & Saved';

export type DictEntry = {
  id: string;
  de: string;
  en: string;
  gender?: 'der' | 'die' | 'das';
  category: DictCategory;
  example_de: string;
  example_en: string;
  isCustom?: boolean;
  packId?: string;
};

export type OfflinePackId = 'nature' | 'amt' | 'cafe' | 'medical';

export type OfflinePack = {
  id: OfflinePackId;
  title: string;
  description: string;
  category: DictCategory;
  sizeKb: number;
  entries: DictEntry[];
};

export const PACKS_STORAGE_KEY = 'linguaear.offline.packs';
export const CUSTOM_WORDS_STORAGE_KEY = 'linguaear.offline.customWords';

// ── 1. Lightweight Built-in Starter Pack (Always Available) ──────────────────
export const STARTER_PACK_ENTRIES: DictEntry[] = [
  {
    id: 'start-01',
    de: 'Hallo',
    en: 'hello',
    category: 'Essentials & Survival',
    example_de: 'Hallo, wie geht es Ihnen?',
    example_en: 'Hello, how are you?',
  },
  {
    id: 'start-02',
    de: 'Danke',
    en: 'thank you',
    category: 'Essentials & Survival',
    example_de: 'Vielen Dank für Ihre Hilfe.',
    example_en: 'Thank you very much for your help.',
  },
  {
    id: 'start-03',
    de: 'Bitte',
    en: 'please / you are welcome',
    category: 'Essentials & Survival',
    example_de: 'Können Sie mir bitte helfen?',
    example_en: 'Could you please help me?',
  },
  {
    id: 'start-04',
    de: 'Tschüss',
    en: 'bye',
    category: 'Essentials & Survival',
    example_de: 'Tschüss, bis morgen!',
    example_en: 'Bye, see you tomorrow!',
  },
  {
    id: 'start-05',
    de: 'Ja',
    en: 'yes',
    category: 'Essentials & Survival',
    example_de: 'Ja, das stimmt genau.',
    example_en: 'Yes, that is completely right.',
  },
  {
    id: 'start-06',
    de: 'Nein',
    en: 'no',
    category: 'Essentials & Survival',
    example_de: 'Nein, leider nicht.',
    example_en: 'No, unfortunately not.',
  },
  {
    id: 'start-07',
    de: 'Entschuldigung',
    en: 'excuse me / sorry',
    category: 'Essentials & Survival',
    example_de: 'Entschuldigung, wo ist der Bahnhof?',
    example_en: 'Excuse me, where is the station?',
  },
  {
    id: 'start-08',
    de: 'Hilfe',
    en: 'help',
    category: 'Essentials & Survival',
    example_de: 'Ich brauche Ihre Hilfe.',
    example_en: 'I need your help.',
  },
  {
    id: 'start-09',
    de: 'Englisch',
    en: 'English',
    category: 'Essentials & Survival',
    example_de: 'Sprechen Sie vielleicht Englisch?',
    example_en: 'Do you perhaps speak English?',
  },
  {
    id: 'start-10',
    de: 'Bahnhof',
    en: 'train station',
    gender: 'der',
    category: 'Essentials & Survival',
    example_de: 'Der Bahnhof ist fünf Minuten zu Fuß entfernt.',
    example_en: 'The train station is five minutes away on foot.',
  },
];

// ── 2. Downloadable On-Demand Offline Packs ─────────────────────────────────
export const DOWNLOADABLE_PACKS: Record<OfflinePackId, OfflinePack> = {
  nature: {
    id: 'nature',
    title: 'Animals & Nature',
    description: 'Essential flora, fauna, and everyday nature words',
    category: 'Animals & Nature',
    sizeKb: 18,
    entries: [
      {
        id: 'nat-01',
        de: 'Vogel',
        en: 'bird',
        gender: 'der',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Ein bunter Vogel singt im Baum.',
        example_en: 'A colorful bird is singing in the tree.',
      },
      {
        id: 'nat-02',
        de: 'Pfau',
        en: 'peacock',
        gender: 'der',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Der Pfau zeigt seine wunderschönen Federn.',
        example_en: 'The peacock displays its gorgeous feathers.',
      },
      {
        id: 'nat-03',
        de: 'Hund',
        en: 'dog',
        gender: 'der',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Der Hund läuft fröhlich durch den Park.',
        example_en: 'The dog runs happily through the park.',
      },
      {
        id: 'nat-04',
        de: 'Katze',
        en: 'cat',
        gender: 'die',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Die Katze schläft friedlich auf dem Stuhl.',
        example_en: 'The cat is sleeping peacefully on the chair.',
      },
      {
        id: 'nat-05',
        de: 'Pferd',
        en: 'horse',
        gender: 'das',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Das Pferd frisst frisches Heu auf der Wiese.',
        example_en: 'The horse eats fresh hay on the meadow.',
      },
      {
        id: 'nat-06',
        de: 'Baum',
        en: 'tree',
        gender: 'der',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Der alte Baum spendet im Sommer Schatten.',
        example_en: 'The old tree provides shade in summer.',
      },
      {
        id: 'nat-07',
        de: 'Blume',
        en: 'flower',
        gender: 'die',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Die Blume blüht im Frühling.',
        example_en: 'The flower blooms in spring.',
      },
      {
        id: 'nat-08',
        de: 'Wetter',
        en: 'weather',
        gender: 'das',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Wie ist das Wetter heute in Berlin?',
        example_en: 'How is the weather today in Berlin?',
      },
      {
        id: 'nat-09',
        de: 'Sonne',
        en: 'sun',
        gender: 'die',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Die Sonne scheint den ganzen Nachmittag.',
        example_en: 'The sun shines all afternoon.',
      },
      {
        id: 'nat-10',
        de: 'Regen',
        en: 'rain',
        gender: 'der',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Der Regen trommelt gegen das Fenster.',
        example_en: 'The rain drums against the window.',
      },
      {
        id: 'nat-11',
        de: 'Wald',
        en: 'forest',
        gender: 'der',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Wir spazieren am Wochenende gerne im Wald.',
        example_en: 'We enjoy walking in the forest at the weekend.',
      },
      {
        id: 'nat-12',
        de: 'Fluss',
        en: 'river',
        gender: 'der',
        category: 'Animals & Nature',
        packId: 'nature',
        example_de: 'Der Fluss fließt ruhig ins Tal.',
        example_en: 'The river flows calmly into the valley.',
      },
    ],
  },
  amt: {
    id: 'amt',
    title: 'Bureaucracy & Visa',
    description: 'Immigration, Bürgeramt, city registration and contracts',
    category: 'Bureaucracy & Visa',
    sizeKb: 24,
    entries: [
      {
        id: 'amt-01',
        de: 'Reisepass',
        en: 'passport',
        gender: 'der',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Zeigen Sie mir bitte Ihren Reisepass.',
        example_en: 'Please show me your passport.',
      },
      {
        id: 'amt-02',
        de: 'Aufenthaltserlaubnis',
        en: 'residence permit',
        gender: 'die',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Meine Aufenthaltserlaubnis läuft im Juni ab.',
        example_en: 'My residence permit expires in June.',
      },
      {
        id: 'amt-03',
        de: 'Anmeldung',
        en: 'registration (at town hall)',
        gender: 'die',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Ich brauche die Bestätigung der Anmeldung.',
        example_en: 'I need the confirmation of registration.',
      },
      {
        id: 'amt-04',
        de: 'Termin',
        en: 'appointment',
        gender: 'der',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Ich habe einen Termin um zehn Uhr.',
        example_en: 'I have an appointment at ten o\'clock.',
      },
      {
        id: 'amt-05',
        de: 'Mietvertrag',
        en: 'rental contract / lease',
        gender: 'der',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Hier ist die Kopie von meinem Mietvertrag.',
        example_en: 'Here is the copy of my rental contract.',
      },
      {
        id: 'amt-06',
        de: 'Personalausweis',
        en: 'identity card',
        gender: 'der',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Haben Sie Ihren Personalausweis dabei?',
        example_en: 'Do you have your identity card with you?',
      },
      {
        id: 'amt-07',
        de: 'Krankenversicherung',
        en: 'health insurance',
        gender: 'die',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Die Mitgliedsbescheinigung der Krankenversicherung fehlt noch.',
        example_en: 'The health insurance membership certificate is still missing.',
      },
      {
        id: 'amt-08',
        de: 'Visum',
        en: 'visa',
        gender: 'das',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Mein Visum wurde für ein Jahr verlängert.',
        example_en: 'My visa has been extended for one year.',
      },
      {
        id: 'amt-09',
        de: 'Formular',
        en: 'form',
        gender: 'das',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Bitte füllen Sie dieses Formular vollständig aus.',
        example_en: 'Please fill out this form completely.',
      },
      {
        id: 'amt-10',
        de: 'Unterschrift',
        en: 'signature',
        gender: 'die',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Hier unten fehlt noch Ihre Unterschrift.',
        example_en: 'Your signature is still missing down here.',
      },
      {
        id: 'amt-11',
        de: 'Ausländerbehörde',
        en: 'immigration office',
        gender: 'die',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Mein Termin bei der Ausländerbehörde ist morgen.',
        example_en: 'My appointment at the immigration office is tomorrow.',
      },
      {
        id: 'amt-12',
        de: 'Steuernummer',
        en: 'tax identification number',
        gender: 'die',
        category: 'Bureaucracy & Visa',
        packId: 'amt',
        example_de: 'Das Finanzamt schickt Ihnen die Steuernummer per Post.',
        example_en: 'The tax office sends your tax number by post.',
      },
    ],
  },
  cafe: {
    id: 'cafe',
    title: 'Food & Shopping',
    description: 'Ordering food, dining out, groceries and transactions',
    category: 'Food & Shopping',
    sizeKb: 20,
    entries: [
      {
        id: 'cafe-01',
        de: 'Kaffee',
        en: 'coffee',
        gender: 'der',
        category: 'Food & Shopping',
        packId: 'cafe',
        example_de: 'Einen großen Kaffee bitte, mit Hafermilch.',
        example_en: 'A large coffee please, with oat milk.',
      },
      {
        id: 'cafe-02',
        de: 'Rechnung',
        en: 'bill / check',
        gender: 'die',
        category: 'Food & Shopping',
        packId: 'cafe',
        example_de: 'Wir möchten gerne die Rechnung bezahlen.',
        example_en: 'We would like to pay the bill.',
      },
      {
        id: 'cafe-03',
        de: 'Trinkgeld',
        en: 'tip',
        gender: 'das',
        category: 'Food & Shopping',
        packId: 'cafe',
        example_de: 'Stimmt so — das ist Trinkgeld für Sie.',
        example_en: 'Keep the change — that is a tip for you.',
      },
      {
        id: 'cafe-04',
        de: 'Leitungswasser',
        en: 'tap water',
        gender: 'das',
        category: 'Food & Shopping',
        packId: 'cafe',
        example_de: 'Kann ich bitte ein Glas Leitungswasser haben?',
        example_en: 'Could I please have a glass of tap water?',
      },
      {
        id: 'cafe-05',
        de: 'Brötchen',
        en: 'bread roll',
        gender: 'das',
        category: 'Food & Shopping',
        packId: 'cafe',
        example_de: 'Zwei frische Brötchen vom Bäcker, bitte.',
        example_en: 'Two fresh bread rolls from the bakery, please.',
      },
      {
        id: 'cafe-06',
        de: 'Supermarkt',
        en: 'supermarket',
        gender: 'der',
        category: 'Food & Shopping',
        packId: 'cafe',
        example_de: 'Der Supermarkt hat bis zweiundzwanzig Uhr geöffnet.',
        example_en: 'The supermarket is open until 10 PM.',
      },
      {
        id: 'cafe-07',
        de: 'Pfand',
        en: 'bottle deposit',
        gender: 'das',
        category: 'Food & Shopping',
        packId: 'cafe',
        example_de: 'Am Automaten kann man die Pfandflaschen abgeben.',
        example_en: 'You can return deposit bottles at the machine.',
      },
      {
        id: 'cafe-08',
        de: 'Bargeld',
        en: 'cash',
        gender: 'das',
        category: 'Food & Shopping',
        packId: 'cafe',
        example_de: 'Akzeptieren Sie Karte oder nur Bargeld?',
        example_en: 'Do you accept card or cash only?',
      },
      {
        id: 'cafe-09',
        de: 'Öffnungszeiten',
        en: 'opening hours',
        gender: 'die',
        category: 'Food & Shopping',
        packId: 'cafe',
        example_de: 'Die Öffnungszeiten stehen an der Tür.',
        example_en: 'The opening hours are on the door.',
      },
      {
        id: 'cafe-10',
        de: 'Käse',
        en: 'cheese',
        gender: 'der',
        category: 'Food & Shopping',
        packId: 'cafe',
        example_de: 'Ich hätte gern zweihundert Gramm milden Käse.',
        example_en: 'I would like two hundred grams of mild cheese.',
      },
    ],
  },
  medical: {
    id: 'medical',
    title: 'Medical',
    description: 'Pharmacy, hospitals, doctor visits and emergency assistance',
    category: 'Medical',
    sizeKb: 22,
    entries: [
      {
        id: 'med-01',
        de: 'Notruf',
        en: 'emergency call (112)',
        gender: 'der',
        category: 'Medical',
        packId: 'medical',
        example_de: 'Wählen Sie sofort den Notruf!',
        example_en: 'Dial the emergency number immediately!',
      },
      {
        id: 'med-02',
        de: 'Krankenhaus',
        en: 'hospital',
        gender: 'das',
        category: 'Medical',
        packId: 'medical',
        example_de: 'Der Rettungswagen bringt den Patienten ins Krankenhaus.',
        example_en: 'The ambulance brings the patient to the hospital.',
      },
      {
        id: 'med-03',
        de: 'Apotheke',
        en: 'pharmacy',
        gender: 'die',
        category: 'Medical',
        packId: 'medical',
        example_de: 'Welche Apotheke hat heute Notdienst?',
        example_en: 'Which pharmacy is on emergency duty today?',
      },
      {
        id: 'med-04',
        de: 'Schmerzmittel',
        en: 'painkiller',
        gender: 'das',
        category: 'Medical',
        packId: 'medical',
        example_de: 'Haben Sie ein wirksames Schmerzmittel gegen Kopfschmerzen?',
        example_en: 'Do you have an effective painkiller for headaches?',
      },
      {
        id: 'med-05',
        de: 'Allergie',
        en: 'allergy',
        gender: 'die',
        category: 'Medical',
        packId: 'medical',
        example_de: 'Ich habe eine starke Allergie gegen Penicillin.',
        example_en: 'I have a severe allergy to penicillin.',
      },
      {
        id: 'med-06',
        de: 'Rezept',
        en: 'prescription',
        gender: 'das',
        category: 'Medical',
        packId: 'medical',
        example_de: 'Der Arzt hat mir ein Rezept ausgestellt.',
        example_en: 'The doctor issued a prescription for me.',
      },
      {
        id: 'med-07',
        de: 'Schwindel',
        en: 'dizziness',
        gender: 'der',
        category: 'Medical',
        packId: 'medical',
        example_de: 'Mir ist schwindelig und mir wird schwarz vor Augen.',
        example_en: 'I feel dizzy and everything is going black.',
      },
      {
        id: 'med-08',
        de: 'Blutgruppe',
        en: 'blood type',
        gender: 'die',
        category: 'Medical',
        packId: 'medical',
        example_de: 'Meine Blutgruppe ist Null positiv.',
        example_en: 'My blood type is O positive.',
      },
      {
        id: 'med-09',
        de: 'Feuerwehr',
        en: 'fire brigade',
        gender: 'die',
        category: 'Medical',
        packId: 'medical',
        example_de: 'Rufen Sie die Feuerwehr, es brennt!',
        example_en: 'Call the fire brigade, it is burning!',
      },
      {
        id: 'med-10',
        de: 'Polizei',
        en: 'police',
        gender: 'die',
        category: 'Medical',
        packId: 'medical',
        example_de: 'Die Polizei ist bereits auf dem Weg.',
        example_en: 'The police are already on their way.',
      },
    ],
  },
};

/** All entries combined for backward compatibility */
export const OFFLINE_DICTIONARY: DictEntry[] = [
  ...STARTER_PACK_ENTRIES,
  ...DOWNLOADABLE_PACKS.nature.entries,
  ...DOWNLOADABLE_PACKS.amt.entries,
  ...DOWNLOADABLE_PACKS.cafe.entries,
  ...DOWNLOADABLE_PACKS.medical.entries,
];

// ── 3. AsyncStorage Persistence Helpers ─────────────────────────────────────

/** Returns the list of installed pack IDs from local storage */
export async function getDownloadedPackIds(): Promise<OfflinePackId[]> {
  try {
    const raw = await AsyncStorage.getItem(PACKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflinePackId[]) : [];
  } catch {
    return [];
  }
}

/** Marks a pack as downloaded on the device */
export async function downloadPack(id: OfflinePackId): Promise<OfflinePackId[]> {
  const current = await getDownloadedPackIds();
  if (current.includes(id)) return current;
  const updated = [...current, id];
  try {
    await AsyncStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

/** Removes a downloaded pack from the device */
export async function removePack(id: OfflinePackId): Promise<OfflinePackId[]> {
  const current = await getDownloadedPackIds();
  const updated = current.filter((p) => p !== id);
  try {
    await AsyncStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

/** Returns user words saved via "Ask AI & Save Offline" */
export async function getCustomWords(): Promise<DictEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_WORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DictEntry[]) : [];
  } catch {
    return [];
  }
}

/** Permanently saves a new custom word to AsyncStorage */
export async function saveCustomWord(
  entry: Omit<DictEntry, 'id' | 'isCustom' | 'category'> & { category?: DictCategory },
): Promise<DictEntry> {
  const current = await getCustomWords();
  const newEntry: DictEntry = {
    ...entry,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: entry.category ?? 'Custom & Saved',
    isCustom: true,
  };
  const updated = [newEntry, ...current.filter((w) => w.de.toLowerCase() !== newEntry.de.toLowerCase())];
  try {
    await AsyncStorage.setItem(CUSTOM_WORDS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return newEntry;
}

/** Deletes a custom saved word from AsyncStorage */
export async function removeCustomWord(id: string): Promise<DictEntry[]> {
  const current = await getCustomWords();
  const updated = current.filter((w) => w.id !== id);
  try {
    await AsyncStorage.setItem(CUSTOM_WORDS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

/** Assembles the active dictionary combining starter words, downloaded packs, and custom saved words */
export function getActiveDictionary(
  downloadedIds: OfflinePackId[],
  customWords: DictEntry[] = [],
): DictEntry[] {
  const packEntries = downloadedIds.flatMap((id) => DOWNLOADABLE_PACKS[id]?.entries ?? []);
  return [...customWords, ...STARTER_PACK_ENTRIES, ...packEntries];
}

// ── 4. Pure Search & Quiz Logic ─────────────────────────────────────────────

/** Case-insensitive search across German, English, and example phrases */
export function searchOfflineDictionary(
  query: string,
  category?: DictCategory,
  sourceList: DictEntry[] = OFFLINE_DICTIONARY,
): DictEntry[] {
  const q = query.trim().toLowerCase();
  return sourceList.filter((entry) => {
    if (category && entry.category !== category) return false;
    if (!q) return true;
    return (
      entry.de.toLowerCase().includes(q) ||
      entry.en.toLowerCase().includes(q) ||
      entry.example_de.toLowerCase().includes(q) ||
      entry.example_en.toLowerCase().includes(q)
    );
  });
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Generates randomized QuizQuestion items from available entries */
export function generateOfflineQuiz(
  count = 5,
  sourceList: DictEntry[] = OFFLINE_DICTIONARY,
): QuizQuestion[] {
  if (sourceList.length < 3) return [];

  const questions: QuizQuestion[] = [];
  const shuffledPool = shuffle([...sourceList]);

  for (const entry of shuffledPool) {
    const distractors = shuffle(sourceList.filter((s) => s.id !== entry.id && s.en !== entry.en))
      .slice(0, 2)
      .map((s) => s.en);

    if (distractors.length < 2) continue;

    const options = shuffle([entry.en, ...distractors]);
    const answer_index = options.indexOf(entry.en);

    questions.push({
      question: `What does "${entry.de}" mean?`,
      options,
      answer_index,
      explanation: `"${entry.de}" means "${entry.en}". Example: ${entry.example_de}`,
    });

    if (questions.length === count) break;
  }

  return questions;
}
