import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAudioProcessor } from '@/src/features/speech';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { MicButton } from '@/src/shared/ui/MicButton';
import type { MicState } from '@/src/shared/ui/MicButton';
import { Section } from '@/src/shared/ui/Section';

import { useGameEngine } from './useGameEngine';

type Level = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  opening: string;
};

const LEVELS: Level[] = [
  {
    id: 'immigration',
    title: 'Immigration Office',
    description: 'Ausländerbehörde: documents and appointments',
    icon: 'business-outline',
    tint: '#6366F1',
    opening: 'Guten Tag. Zeigen Sie mir bitte Ihren Reisepass.',
  },
  {
    id: 'cafe',
    title: 'German Café',
    description: 'Order food and drinks like a local',
    icon: 'cafe-outline',
    tint: '#F59E0B',
    opening: 'Hallo! Was darf ich Ihnen heute bringen?',
  },
  {
    id: 'taxi',
    title: 'Taxi Ride',
    description: 'Give directions and agree on the fare',
    icon: 'car-outline',
    tint: '#10B981',
    opening: 'Moin! Wohin soll es denn gehen?',
  },
];

const XP_GOAL = 100;

export function GameScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const game = useGameEngine();
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

  const level = LEVELS.find((l) => l.id === game.currentMode);
  const state: MicState = isRecording ? 'recording' : isProcessing || game.processing ? 'processing' : 'idle';
  const xp = Math.min(game.score, XP_GOAL);

  const start = (l: Level) => {
    game.setCurrentMode(l.id);
    game.setStatus(`${l.title} is ready.`);
    game.setAiPrompt(l.opening);
  };

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
          Pick a real-life situation and hold the conversation in German. You earn XP for every good answer.
        </Text>

        <View style={styles.levels}>
          {LEVELS.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => start(l)}
              style={({ pressed }) => [styles.levelCard, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <View style={[styles.levelIcon, { backgroundColor: `${l.tint}22` }]}>
                <Ionicons name={l.icon} size={24} color={l.tint} />
              </View>
              <View style={styles.levelText}>
                <Text style={styles.levelTitle}>{l.title}</Text>
                <Text style={styles.levelDesc}>{l.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          ))}
        </View>
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
          <Ionicons name={level.icon} size={14} color={level.tint} />
          <Text style={[styles.levelPillText, { color: level.tint }]}>{level.title}</Text>
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
    levels: { gap: 12, marginTop: 24 },
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
