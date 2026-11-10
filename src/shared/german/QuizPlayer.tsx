import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { GENDER_COLORS, GENDER_UNDERLINE, parseGender } from './gender';
import type { QuizQuestion } from './quiz';

type Props = {
  questions: QuizQuestion[];
  /** Called when the last question is answered, and again after every retry. */
  onComplete?: (score: number, total: number) => void;
  /** Result from an earlier attempt, shown until the user starts again. */
  previous?: { score: number; total: number } | null;
  /** XP earned for the last finish; 0 means the quiz was already counted. Shown under the score. */
  reward?: number | null;
};

const GREEN = '#10B981';

/** Steps through multiple-choice questions, marks each answer and ends with a score. */
export function QuizPlayer({ questions, onComplete, previous, reward }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  const total = questions.length;
  const question = questions[index];

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === question.answer_index;
    if (correct) setScore((s) => s + 1);
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(
        correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      );
    }
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    setDone(true);
    onComplete?.(score, total);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setStarted(true);
  };

  // An earlier result is shown first, with a button to try again.
  if (!started && previous) {
    return (
      <View style={styles.summary}>
        <Text style={styles.big}>
          {previous.score}/{previous.total}
        </Text>
        <Text style={styles.summaryText}>Your last quiz result</Text>
        <Pressable style={styles.secondary} onPress={restart} accessibilityRole="button">
          <Ionicons name="refresh" size={16} color={colors.accent} />
          <Text style={styles.secondaryText}>Retake quiz</Text>
        </Pressable>
      </View>
    );
  }

  if (done) {
    const ratio = score / total;
    return (
      <View style={styles.summary}>
        <Text style={styles.big}>
          {score}/{total}
        </Text>
        <Text style={styles.summaryText}>
          {ratio === 1
            ? 'Perfect!'
            : ratio >= 0.6
              ? 'Nice work, keep going.'
              : 'Good try. Review it and have another go.'}
        </Text>
        {reward !== null && reward !== undefined && (
          <Text style={styles.reward}>{reward > 0 ? `+${reward} XP` : 'Already counted for XP'}</Text>
        )}
        <Pressable style={styles.secondary} onPress={restart} accessibilityRole="button">
          <Ionicons name="refresh" size={16} color={colors.accent} />
          <Text style={styles.secondaryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.progressRow}>
        <Text style={styles.progress}>
          Question {index + 1} of {total}
        </Text>
        <View style={styles.dots}>
          {questions.map((_, i) => (
            <View key={i} style={[styles.dot, i <= index && { backgroundColor: colors.accent }]} />
          ))}
        </View>
      </View>

      <Text style={styles.question}>{question.question}</Text>

      <View style={styles.options}>
        {question.options.map((option, i) => {
          const isAnswer = i === question.answer_index;
          const gender = parseGender(option);
          const revealed = picked !== null;
          const wrongPick = revealed && picked === i && !isAnswer;
          return (
            <Pressable
              key={`${option}-${i}`}
              onPress={() => pick(i)}
              disabled={revealed}
              accessibilityRole="button"
              style={[
                styles.option,
                revealed && isAnswer && styles.optionCorrect,
                wrongPick && styles.optionWrong,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  revealed && !isAnswer && !wrongPick && { opacity: 0.55 },
                  // Article answers (der / die / das) wear their gender colour, so the colour becomes familiar.
                  gender && {
                    color: GENDER_COLORS[gender],
                    fontWeight: '800',
                    textDecorationLine: 'underline',
                    textDecorationStyle: GENDER_UNDERLINE[gender],
                    textDecorationColor: GENDER_COLORS[gender],
                  },
                ]}
              >
                {option}
              </Text>
              {revealed && isAnswer && <Ionicons name="checkmark-circle" size={20} color={GREEN} />}
              {wrongPick && <Ionicons name="close-circle" size={20} color={colors.error} />}
            </Pressable>
          );
        })}
      </View>

      {picked !== null && (
        <>
          {!!question.explanation && <Text style={styles.explanation}>{question.explanation}</Text>}
          <Pressable style={styles.next} onPress={next} accessibilityRole="button">
            <Text style={styles.nextText}>{index + 1 < total ? 'Next question' : 'See my score'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    progress: { color: c.muted, fontSize: 12, fontWeight: '700' },
    dots: { flexDirection: 'row', gap: 4 },
    dot: { width: 18, height: 4, borderRadius: 2, backgroundColor: c.border },
    question: { color: c.text, fontSize: 17, lineHeight: 25, fontWeight: '600', marginBottom: 12 },
    options: { gap: 8 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    optionCorrect: { borderColor: GREEN, backgroundColor: 'rgba(16, 185, 129, 0.12)' },
    optionWrong: { borderColor: c.error, backgroundColor: 'rgba(239, 68, 68, 0.12)' },
    optionText: { flex: 1, color: c.text, fontSize: 15, fontWeight: '500' },
    explanation: { color: c.muted, fontSize: 14, lineHeight: 21, marginTop: 12 },
    next: {
      backgroundColor: c.accent,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 14,
    },
    nextText: { color: c.onAccent, fontSize: 15, fontWeight: '700' },
    summary: { alignItems: 'center', paddingVertical: 8, gap: 6 },
    big: { color: c.accent, fontSize: 44, fontWeight: '800' },
    reward: { color: '#10B981', fontSize: 14, fontWeight: '800' },
    summaryText: { color: c.muted, fontSize: 14 },
    secondary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 999,
      backgroundColor: c.accentSoft,
    },
    secondaryText: { color: c.accent, fontSize: 14, fontWeight: '700' },
  });
