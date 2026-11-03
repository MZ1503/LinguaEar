import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RecentHistory, useHistory } from '@/src/features/history';
import { CompoundCard } from '@/src/shared/german/CompoundCard';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { MicButton } from '@/src/shared/ui/MicButton';
import type { MicState } from '@/src/shared/ui/MicButton';
import { Section } from '@/src/shared/ui/Section';

import { useNormalAudioProcessor } from './useNormalAudioProcessor';

// Gender colours; chips use them as low-alpha tints so they read on light and dark.
const ARTICLE_COLORS: Record<string, string> = {
  der: '#3B82F6',
  die: '#EC4899',
  das: '#10B981',
};

export function SpeakScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { status, isRecording, isProcessing, heard, analysis, resetApp, startRecording, stopRecording } =
    useNormalAudioProcessor();

  const state: MicState = isRecording ? 'recording' : isProcessing ? 'processing' : 'idle';
  const caption =
    state === 'recording'
      ? 'Listening… tap to stop'
      : state === 'processing'
        ? status
        : status.startsWith('Error')
          ? 'Something went wrong. Tap to try again.'
          : 'Tap to speak';

  const { explanation, tone, grammar, quiz, articles, compounds } = analysis;

  const history = useHistory();
  const [saving, setSaving] = useState(false);
  // Remember which transcript was saved, so a new recording offers Save again.
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const saved = savedFor === heard;

  const save = async () => {
    setSaving(true);
    try {
      await history.save({ transcript: heard, explanation, tone, grammar, quiz, articles, compounds });
      setSavedFor(heard);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Say it in German</Text>
      <Text style={styles.subtitle}>
        Speak naturally and get a transcript, a word-by-word breakdown and a quick quiz.
      </Text>

      <View style={styles.mic}>
        <MicButton state={state} onPress={() => (isRecording ? stopRecording() : startRecording())} />
        <Text style={[styles.caption, state !== 'idle' && { color: colors.accent }]}>{caption}</Text>
      </View>

      {!!heard && (
        <View style={styles.results}>
          <Section
            title="Transcript"
            icon="chatbubble-ellipses-outline"
            tint="#10B981"
            action={{ label: 'New recording', onPress: resetApp }}
          >
            <Text style={styles.quote}>“{heard}”</Text>
          </Section>

          {!!explanation && (
            <Section title="Breakdown" icon="analytics-outline">
              <Text style={styles.body}>{explanation}</Text>
              {!!tone && (
                <View style={styles.tone}>
                  <Text style={styles.toneLabel}>Tone</Text>
                  <Text style={styles.toneValue}>{tone}</Text>
                </View>
              )}
              {articles.length > 0 && (
                <View style={styles.articles}>
                  <Text style={styles.articlesTitle}>Nouns and articles</Text>
                  <View style={styles.chips}>
                    {articles.map((a, i) => {
                      const color = ARTICLE_COLORS[a.gender?.toLowerCase()] ?? colors.muted;
                      return (
                        <View
                          key={i}
                          style={[styles.chip, { backgroundColor: `${color}1f`, borderColor: `${color}55` }]}
                        >
                          <Text style={[styles.chipArticle, { color }]}>{a.gender}</Text>
                          <Text style={styles.chipWord}>{a.word}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </Section>
          )}

          {compounds.length > 0 && (
            <Section title="Word builder" icon="construct-outline" tint="#F59E0B">
              <View style={styles.compounds}>
                {compounds.map((c) => (
                  <CompoundCard key={c.word} compound={c} />
                ))}
              </View>
            </Section>
          )}

          {!!grammar && (
            <Section title="Grammar" icon="library-outline" tint="#6366F1" collapsible>
              <Text style={styles.body}>{grammar}</Text>
            </Section>
          )}

          {!!quiz && (
            <Section title="Quick quiz" icon="help-circle-outline" tint="#8B5CF6" collapsible>
              <Text style={styles.body}>{quiz}</Text>
            </Section>
          )}

          <Pressable
            onPress={save}
            disabled={saving || saved}
            accessibilityRole="button"
            style={[styles.save, saved && styles.saved]}
          >
            {saving ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <>
                <Ionicons
                  name={saved ? 'checkmark-circle' : 'bookmark-outline'}
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.saveText}>{saved ? 'Saved to history' : 'Save to history'}</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      <RecentHistory />
    </ScrollView>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    content: { padding: 20, paddingBottom: 32 },
    title: { color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: c.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
    mic: { alignItems: 'center', marginTop: 12, marginBottom: 8 },
    caption: { color: c.muted, fontSize: 15, fontWeight: '600', marginTop: -6 },
    results: { gap: 12, marginTop: 20 },
    compounds: { marginVertical: -12 },
    save: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.accentBorder,
      backgroundColor: c.accentSoft,
    },
    saved: { opacity: 0.7 },
    saveText: { color: c.accent, fontSize: 15, fontWeight: '700' },
    quote: { color: c.text, fontSize: 19, lineHeight: 28, fontWeight: '500' },
    body: { color: c.text, fontSize: 15, lineHeight: 23 },
    tone: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      marginTop: 14,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.accentSoft,
    },
    toneLabel: { color: c.muted, fontSize: 12, fontWeight: '600' },
    toneValue: { color: c.accent, fontSize: 12, fontWeight: '700' },
    articles: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    articlesTitle: { color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 10 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
    },
    chipArticle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    chipWord: { color: c.text, fontSize: 14, fontWeight: '600' },
  });
