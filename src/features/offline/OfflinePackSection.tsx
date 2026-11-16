import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { aiChat } from '@/src/features/ai';
import type { QuizQuestion } from '@/src/shared/german/quiz';
import { QuizPlayer } from '@/src/shared/german/QuizPlayer';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { Section } from '@/src/shared/ui/Section';

import {
  DOWNLOADABLE_PACKS,
  downloadPack,
  generateOfflineQuiz,
  getActiveDictionary,
  getCustomWords,
  getDownloadedPackIds,
  removeCustomWord,
  removePack,
  saveCustomWord,
  searchOfflineDictionary,
} from './offlineDictionary';
import type { DictCategory, DictEntry, OfflinePackId } from './offlineDictionary';

const ALL_PACK_IDS: OfflinePackId[] = ['nature', 'amt', 'cafe', 'medical'];

const CATEGORIES: DictCategory[] = [
  'Essentials & Survival',
  'Animals & Nature',
  'Bureaucracy & Visa',
  'Food & Shopping',
  'Medical',
  'Custom & Saved',
];

const CATEGORY_ICONS: Record<DictCategory, keyof typeof Ionicons.glyphMap> = {
  'Essentials & Survival': 'flash-outline',
  'Animals & Nature': 'leaf-outline',
  'Bureaucracy & Visa': 'business-outline',
  'Food & Shopping': 'cafe-outline',
  'Medical': 'medkit-outline',
  'Custom & Saved': 'sparkles-outline',
};

const CATEGORY_TINTS: Record<DictCategory, string> = {
  'Essentials & Survival': '#00d2ff',
  'Animals & Nature': '#10B981',
  'Bureaucracy & Visa': '#6366F1',
  'Food & Shopping': '#F59E0B',
  'Medical': '#EF4444',
  'Custom & Saved': '#EC4899',
};

const GENDER_COLORS: Record<string, string> = {
  der: '#3B82F6',
  die: '#EC4899',
  das: '#10B981',
};

function EntryRow({
  entry,
  colors,
  onDelete,
}: {
  entry: DictEntry;
  colors: Palette;
  onDelete?: (id: string) => void;
}) {
  const [speaking, setSpeaking] = useState(false);

  const speak = async () => {
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    await Speech.speak(entry.de, {
      language: 'de-DE',
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
    });
  };

  const genderColor = entry.gender ? GENDER_COLORS[entry.gender] : colors.muted;

  return (
    <View
      style={{
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        paddingVertical: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {entry.gender && (
          <View
            style={{
              backgroundColor: `${genderColor}22`,
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: genderColor, fontSize: 11, fontWeight: '800' }}>
              {entry.gender}
            </Text>
          </View>
        )}
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 }}>
          {entry.de}
        </Text>
        {entry.isCustom && (
          <View
            style={{
              backgroundColor: `${colors.accent}22`,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              marginRight: 4,
            }}
          >
            <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '800' }}>
              AI SAVED
            </Text>
          </View>
        )}
        <Pressable onPress={speak} hitSlop={8} accessibilityLabel={`Speak ${entry.de}`}>
          <Ionicons
            name={speaking ? 'stop-circle-outline' : 'volume-high-outline'}
            size={22}
            color={speaking ? colors.accent : colors.muted}
          />
        </Pressable>
        {entry.isCustom && onDelete && (
          <Pressable onPress={() => onDelete(entry.id)} hitSlop={8} style={{ marginLeft: 6 }}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </Pressable>
        )}
      </View>
      <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>{entry.en}</Text>
      <Text style={{ color: colors.text, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
        {entry.example_de}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>{entry.example_en}</Text>
    </View>
  );
}

type Mode = 'browse' | 'packs' | 'quiz';

export function OfflinePackSection() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>('browse');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<DictCategory | undefined>(undefined);
  const [downloadedPacks, setDownloadedPacks] = useState<OfflinePackId[]>([]);
  const [customWords, setCustomWords] = useState<DictEntry[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null);

  // Load saved packs and custom words on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [packs, words] = await Promise.all([getDownloadedPackIds(), getCustomWords()]);
      if (mounted) {
        setDownloadedPacks(packs);
        setCustomWords(words);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activeDictionary = useMemo(
    () => getActiveDictionary(downloadedPacks, customWords),
    [downloadedPacks, customWords],
  );

  const results = useMemo(
    () => searchOfflineDictionary(query, activeCategory, activeDictionary),
    [query, activeCategory, activeDictionary],
  );

  const togglePack = async (packId: OfflinePackId) => {
    if (downloadedPacks.includes(packId)) {
      const updated = await removePack(packId);
      setDownloadedPacks(updated);
    } else {
      const updated = await downloadPack(packId);
      setDownloadedPacks(updated);
    }
  };

  const handleDeleteCustomWord = async (id: string) => {
    const updated = await removeCustomWord(id);
    setCustomWords(updated);
  };

  const handleAskAi = async () => {
    const word = query.trim();
    if (!word) return;

    setIsLookingUp(true);
    setAiMessage(null);

    const systemPrompt = `
You are LinguaEar's German vocabulary expert.
The user wants to look up and save the word or phrase: "${word}".
Identify whether this is English or German, and translate to the other.
If it is a noun, identify its correct German gender: 'der', 'die', or 'das'.
Return strictly valid JSON with these exact keys:
{
  "de": "German word or short phrase",
  "en": "English translation",
  "gender": "der" | "die" | "das" | null,
  "example_de": "Natural German example sentence",
  "example_en": "English translation of the example sentence"
}
`;

    try {
      const raw = await aiChat(
        'analyze',
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Word to translate: ${word}` },
        ],
        { json: true, temperature: 0.2 },
      );

      const parsed = JSON.parse(raw);
      if (!parsed.de || !parsed.en) {
        throw new Error('Invalid response from AI');
      }

      const gender =
        parsed.gender === 'der' || parsed.gender === 'die' || parsed.gender === 'das'
          ? parsed.gender
          : undefined;

      const saved = await saveCustomWord({
        de: String(parsed.de).trim(),
        en: String(parsed.en).trim(),
        gender,
        example_de: String(parsed.example_de ?? '').trim(),
        example_en: String(parsed.example_en ?? '').trim(),
      });

      setCustomWords((prev) => [saved, ...prev.filter((w) => w.id !== saved.id)]);
      setAiMessage(`Saved "${saved.de}" (${saved.en}) to offline storage!`);
    } catch (err) {
      console.warn('AI word lookup failed:', err);
      Alert.alert(
        'Lookup Unavailable',
        'Could not look up this word right now. Please check your internet connection to save new words with AI.',
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const startQuiz = () => {
    setQuizQuestions(generateOfflineQuiz(5, activeDictionary));
    setQuizResult(null);
    setMode('quiz');
  };

  const totalDownloadedKb = downloadedPacks.reduce(
    (acc, id) => acc + (DOWNLOADABLE_PACKS[id]?.sizeKb ?? 0),
    0,
  );

  return (
    <Section title="Offline Pack" icon="book-outline" tint="#00d2ff" collapsible>
      {/* 3-Way Mode Switcher */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
        <Pressable
          onPress={() => setMode('browse')}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: mode === 'browse' ? `${colors.accent}22` : colors.card,
            borderWidth: 1,
            borderColor: mode === 'browse' ? colors.accent : colors.border,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: mode === 'browse' ? colors.accent : colors.muted,
              fontWeight: '700',
              fontSize: 12,
            }}
          >
            Dictionary
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode('packs')}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: mode === 'packs' ? `${colors.accent}22` : colors.card,
            borderWidth: 1,
            borderColor: mode === 'packs' ? colors.accent : colors.border,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: mode === 'packs' ? colors.accent : colors.muted,
              fontWeight: '700',
              fontSize: 12,
            }}
          >
            Packs ({downloadedPacks.length}/4)
          </Text>
        </Pressable>

        <Pressable
          onPress={startQuiz}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: mode === 'quiz' ? `${colors.accent}22` : colors.card,
            borderWidth: 1,
            borderColor: mode === 'quiz' ? colors.accent : colors.border,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: mode === 'quiz' ? colors.accent : colors.muted,
              fontWeight: '700',
              fontSize: 12,
            }}
          >
            Offline Quiz
          </Text>
        </Pressable>
      </View>

      {/* ── Mode 1: Packs Manager (Google Translate style) ───────────────────── */}
      {mode === 'packs' && (
        <View>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>
            Downloadable Vocabulary Packs
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 12 }}>
            Manage offline packs on device. Currently using ~{totalDownloadedKb} KB of offline storage.
          </Text>

          {ALL_PACK_IDS.map((packId) => {
            const pack = DOWNLOADABLE_PACKS[packId];
            const isDownloaded = downloadedPacks.includes(packId);
            return (
              <View
                key={packId}
                style={{
                  backgroundColor: colors.bg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDownloaded ? colors.accent : colors.border,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>
                      {pack.title}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                      {pack.description}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '600' }}>
                        {pack.entries.length} words
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 11 }}>•</Text>
                      <Text style={{ color: colors.muted, fontSize: 11 }}>{pack.sizeKb} KB</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => togglePack(packId)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 7,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      backgroundColor: isDownloaded ? `${colors.error}18` : colors.accent,
                      borderWidth: isDownloaded ? 1 : 0,
                      borderColor: colors.error,
                    }}
                  >
                    <Ionicons
                      name={isDownloaded ? 'trash-outline' : 'cloud-download-outline'}
                      size={15}
                      color={isDownloaded ? colors.error : colors.onAccent}
                    />
                    <Text
                      style={{
                        color: isDownloaded ? colors.error : colors.onAccent,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {isDownloaded ? 'Remove Pack' : 'Download Pack'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Mode 2: Offline Quiz ────────────────────────────────────────────── */}
      {mode === 'quiz' && (
        <View>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>
            {quizResult
              ? `You scored ${quizResult.score}/${quizResult.total}! Tap "Offline Quiz" to try again.`
              : `Quiz drawn from your ${activeDictionary.length} offline words — no internet needed.`}
          </Text>
          {quizQuestions.length > 0 ? (
            <QuizPlayer
              questions={quizQuestions}
              onComplete={(score, total) => setQuizResult({ score, total })}
            />
          ) : (
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginVertical: 12 }}>
              Download at least one pack to practice with a larger quiz pool!
            </Text>
          )}
        </View>
      )}

      {/* ── Mode 3: Dictionary & AI Saver ───────────────────────────────────── */}
      {mode === 'browse' && (
        <View>
          {/* Search bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.bg,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 10,
              marginBottom: 10,
              gap: 6,
            }}
          >
            <Ionicons name="search-outline" size={16} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setAiMessage(null);
              }}
              placeholder="Search German or English…"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, color: colors.text, fontSize: 14, paddingVertical: 8 }}
            />
            {!!query && (
              <Pressable
                onPress={() => {
                  setQuery('');
                  setAiMessage(null);
                }}
                hitSlop={6}
              >
                <Ionicons name="close-circle" size={16} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {/* Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={() => setActiveCategory(undefined)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: !activeCategory ? `${colors.accent}22` : colors.bg,
                  borderWidth: 1,
                  borderColor: !activeCategory ? colors.accent : colors.border,
                }}
              >
                <Text
                  style={{
                    color: !activeCategory ? colors.accent : colors.muted,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  All ({activeDictionary.length})
                </Text>
              </Pressable>
              {CATEGORIES.map((cat) => {
                const tint = CATEGORY_TINTS[cat];
                const active = activeCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(active ? undefined : cat)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 999,
                      backgroundColor: active ? `${tint}22` : colors.bg,
                      borderWidth: 1,
                      borderColor: active ? tint : colors.border,
                    }}
                  >
                    <Ionicons name={CATEGORY_ICONS[cat]} size={12} color={active ? tint : colors.muted} />
                    <Text style={{ color: active ? tint : colors.muted, fontSize: 12, fontWeight: '700' }}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* AI Success Notification */}
          {aiMessage && (
            <View
              style={{
                backgroundColor: `${colors.accent}1f`,
                borderColor: colors.accent,
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>
                ✓ {aiMessage}
              </Text>
            </View>
          )}

          {/* Results count */}
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 6 }}>
            {results.length} offline entries found
          </Text>

          {/* Entry list */}
          {results.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              colors={colors}
              onDelete={handleDeleteCustomWord}
            />
          ))}

          {/* No matches: Google Translate style "Ask AI & Save Offline" Callout */}
          {results.length === 0 && !!query.trim() && (
            <View
              style={{
                backgroundColor: colors.bg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                marginTop: 8,
                alignItems: 'center',
              }}
            >
              <Ionicons name="sparkles" size={28} color={colors.accent} />
              <Text
                style={{
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: '700',
                  marginTop: 6,
                  textAlign: 'center',
                }}
              >
                "{query.trim()}" is not in your downloaded packs yet
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 12,
                  marginTop: 4,
                  textAlign: 'center',
                  lineHeight: 18,
                }}
              >
                Tap below to have AI look up the translation, article gender, and example phrase, and
                permanently save it to your device for offline use!
              </Text>

              <Pressable
                onPress={handleAskAi}
                disabled={isLookingUp}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.accent,
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 999,
                  marginTop: 14,
                }}
              >
                {isLookingUp ? (
                  <ActivityIndicator size="small" color={colors.onAccent} />
                ) : (
                  <>
                    <Ionicons name="cloud-download-outline" size={16} color={colors.onAccent} />
                    <Text style={{ color: colors.onAccent, fontSize: 13, fontWeight: '700' }}>
                      Ask AI & Save Offline
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {results.length === 0 && !query.trim() && (
            <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 12 }}>
              No entries in this category. Download more packs or search to add words!
            </Text>
          )}
        </View>
      )}
    </Section>
  );
}
