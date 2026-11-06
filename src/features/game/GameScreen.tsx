import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAudioProcessor } from '@/src/features/speech';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { MicButton } from '@/src/shared/ui/MicButton';
import type { MicState } from '@/src/shared/ui/MicButton';
import { Section } from '@/src/shared/ui/Section';

import type { GameScenario, LevelId } from './gameTypes';
import { readSavedLevel, saveLevel, useScenarios } from './useScenarios';
import { useGameEngine } from './useGameEngine';

const XP_GOAL = 100;

export function GameScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const game = useGameEngine();
  const { levels, scenarios } = useScenarios();
  const [isRecording, setIsRecording] = useState(false);

  const { startRecording, stopRecording, isProcessing } = useAudioProcessor(
    (text: string) => {
      game.processUserSpeech(text);
    },
    (err: string) => {
      game.setStatus(`Error: ${err}`);
      setIsRecording(false);
    },
  );

  useEffect(() => {
    readSavedLevel().then((saved) => saved && game.setLevel(saved));
    // Restore once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const level = game.scenario;
  const current = levels.find((l) => l.id === game.level) ?? levels[0];
  const groups = useMemo(() => {
    const map = new Map<string, GameScenario[]>();
    scenarios.forEach((sc) => map.set(sc.category, [...(map.get(sc.category) ?? []), sc]));
    return [...map.entries()];
  }, [scenarios]);
  const pickLevel = (id: LevelId) => {
    game.setLevel(id);
    saveLevel(id);
  };
  const state: MicState = isRecording ? 'recording' : isProcessing || game.processing ? 'processing' : 'idle';
  const xp = Math.min(game.score, XP_GOAL);

  const start = (sc: GameScenario) => current && game.startScenario(sc, current);

  async function toggleMicrophone() {
    if (!level) return;
    try {
      if (isRecording) {
        game.setStatus('Transcribing your speech…');
        setIsRecording(false);
        if (Platform.OS !== 'web') await stopRecording();
      } else {
        game.setStatus('Listening…');
        setIsRecording(true);
        if (Platform.OS === 'web') {
          const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SR) {
            const rec = new SR();
            rec.lang = 'de-DE';
            rec.onresult = (e: any) => {
              game.processUserSpeech(e.results[0][0].transcript);
            };
            rec.start();
          } else {
            game.setStatus('Web audio not supported');
          }
        } else {
          await startRecording();
        }
      }
    } catch {
      setIsRecording(false);
    }
  }

  if (!level) {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Practice scenarios</Text>
        <Text style={styles.subtitle}>
          Choose your level, then pick a real-life situation and talk it through in German. You earn XP for every good answer.
        </Text>

        <View style={styles.levelRow}>
          {levels.map((l) => {
            const on = l.id === game.level;
            return (
              <Pressable
                key={l.id}
                onPress={() => pickLevel(l.id)}
                style={[styles.levelChip, on && styles.levelChipOn]}
                accessibilityRole="button"
              >
                <Text style={[styles.levelChipText, on && { color: colors.onAccent }]}>{l.label}</Text>
                <Text style={[styles.levelChipCefr, on && { color: colors.onAccent }]}>{l.cefr}</Text>
              </Pressable>
            );
          })}
        </View>
        {!!current && <Text style={styles.levelDescription}>{current.description}</Text>}

        {groups.map(([category, items]) => (
          <View key={category} style={styles.group}>
            <Text style={styles.groupTitle}>{category}</Text>
            <View style={styles.levels}>
              {items.map((l) => (
                <Pressable
                  key={l.slug}
                  onPress={() => start(l)}
                  style={({ pressed }) => [styles.levelCard, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <View style={[styles.levelIcon, { backgroundColor: `${l.tint}22` }]}>
                    <Ionicons name={l.icon as keyof typeof Ionicons.glyphMap} size={24} color={l.tint} />
                  </View>
                  <View style={styles.levelText}>
                    <Text style={styles.levelTitle}>{l.title}</Text>
                    <Text style={styles.levelDesc}>{l.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable onPress={() => router.push('/suggest-scenario')} style={styles.suggest} accessibilityRole="button">
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.suggestText}>Suggest a scenario</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <Pressable onPress={game.resetGame} style={styles.back} hitSlop={8} accessibilityRole="button">
          <Ionicons name="chevron-back" size={18} color={colors.accent} />
          <Text style={styles.backText}>Scenarios</Text>
        </Pressable>
        <View style={[styles.levelPill, { backgroundColor: `${level.tint}22` }]}>
          <Ionicons name={level.icon as keyof typeof Ionicons.glyphMap} size={14} color={level.tint} />
          <Text style={[styles.levelPillText, { color: level.tint }]}>
            {level.title} · {current?.label}
          </Text>
        </View>
      </View>

      <View style={styles.xp}>
        <View style={styles.xpRow}>
          <Text style={styles.xpLabel}>Progress</Text>
          <Text style={styles.xpValue}>
            {xp} / {XP_GOAL} XP
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(xp / XP_GOAL) * 100}%` }]} />
        </View>
      </View>

      {level.key_phrases.length > 0 && (
        <Section title="Useful phrases" icon="chatbubbles-outline" tint="#6366F1" collapsible>
          {level.key_phrases.map((k) => (
            <View key={k.de} style={styles.phrase}>
              <Text style={styles.phraseDe}>{k.de}</Text>
              <Text style={styles.phraseEn}>{k.en}</Text>
            </View>
          ))}
        </Section>
      )}

      <View style={styles.thread}>
        {!!game.aiPrompt && (
          <View style={[styles.bubble, styles.theirs]}>
            <Text style={styles.speaker}>{level.title}</Text>
            <Text style={styles.line}>{game.aiPrompt}</Text>
          </View>
        )}
        {!!game.heard && (
          <View style={[styles.bubble, styles.mine]}>
            <Text style={[styles.speaker, { color: colors.onAccent, opacity: 0.8 }]}>You</Text>
            <Text style={[styles.line, { color: colors.onAccent }]}>{game.heard}</Text>
          </View>
        )}
        {!!game.explanation && (
          <Section title="Feedback" icon="bulb-outline" tint="#F59E0B">
            <Text style={styles.feedback}>{game.explanation}</Text>
          </Section>
        )}
      </View>

      <View style={styles.mic}>
        <MicButton state={state} onPress={toggleMicrophone} />
        <Text style={[styles.caption, state !== 'idle' && { color: colors.accent }]}>
          {state === 'recording'
            ? 'Listening… tap to stop'
            : state === 'processing'
              ? game.status
              : 'Tap to answer in German'}
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    content: { padding: 20, paddingBottom: 32 },
    title: { color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: c.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
    levelRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
    levelChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    levelChipOn: { backgroundColor: c.accent, borderColor: c.accent },
    levelChipText: { color: c.text, fontSize: 14, fontWeight: '700' },
    levelChipCefr: { color: c.muted, fontSize: 11, marginTop: 2 },
    levelDescription: { color: c.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
    group: { marginTop: 22 },
    groupTitle: { color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    suggest: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 24,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.accentBorder,
      backgroundColor: c.accentSoft,
    },
    suggestText: { color: c.accent, fontSize: 15, fontWeight: '700' },
    phrase: { paddingVertical: 6 },
    phraseDe: { color: c.text, fontSize: 15, fontWeight: '600' },
    phraseEn: { color: c.muted, fontSize: 13, marginTop: 1 },
    levels: { gap: 12, marginTop: 10 },
    levelCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      borderRadius: 18,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
    levelIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    levelText: { flex: 1 },
    levelTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    levelDesc: { color: c.muted, fontSize: 13, marginTop: 2 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    back: { flexDirection: 'row', alignItems: 'center' },
    backText: { color: c.accent, fontSize: 15, fontWeight: '600' },
    levelPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
    },
    levelPillText: { fontSize: 12, fontWeight: '700' },
    xp: { marginTop: 20 },
    xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    xpLabel: {
      color: c.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    xpValue: { color: c.text, fontSize: 12, fontWeight: '700' },
    track: { height: 8, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4, backgroundColor: c.accent },
    thread: { gap: 12, marginTop: 20 },
    bubble: { maxWidth: '86%', padding: 14, borderRadius: 18 },
    theirs: {
      alignSelf: 'flex-start',
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderBottomLeftRadius: 6,
    },
    mine: { alignSelf: 'flex-end', backgroundColor: c.accent, borderBottomRightRadius: 6 },
    speaker: {
      color: c.muted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    line: { color: c.text, fontSize: 16, lineHeight: 23, marginTop: 4 },
    feedback: { color: c.text, fontSize: 15, lineHeight: 23 },
    mic: { alignItems: 'center', marginTop: 12 },
    caption: { color: c.muted, fontSize: 15, fontWeight: '600', marginTop: -6, textAlign: 'center' },
  });
