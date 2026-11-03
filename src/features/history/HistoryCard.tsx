import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CompoundCard } from '@/src/shared/german/CompoundCard';
import { useScore } from '@/src/features/score';
import { QuizPlayer } from '@/src/shared/german/QuizPlayer';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import type { SavedAnalysis } from './historyTypes';
import { useHistory } from './useHistory';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

type Props = {
  item: SavedAnalysis;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

const hasScore = (i: SavedAnalysis) => i.quiz_score !== null && i.quiz_total !== null;

/** One saved phrase: collapsed shows the transcript and compounds, open shows the full result. */
export function HistoryCard({ item, open, onToggle, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { saveQuizScore } = useHistory();
  const { reportQuiz } = useScore();
  const [reward, setReward] = useState<number | null>(null);

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={styles.rowTop}>
          <View style={styles.dateRow}>
            {item.source === 'scan' && <Ionicons name="camera-outline" size={14} color={colors.muted} />}
            <Text style={styles.date}>
              {item.source === 'scan' ? 'Scanned · ' : ''}
              {formatDate(item.created_at)}
            </Text>
          </View>
          <View style={styles.rowRight}>
            {hasScore(item) && (
              <View style={styles.score}>
                <Ionicons name="trophy-outline" size={12} color={colors.accent} />
                <Text style={styles.scoreText}>
                  {item.quiz_score}/{item.quiz_total}
                </Text>
              </View>
            )}
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
          </View>
        </View>
        <Text style={styles.transcript}>“{item.transcript}”</Text>
        {!!item.translation && <Text style={styles.translation}>{item.translation}</Text>}
        {!open && item.compounds.length > 0 && (
          <View style={styles.chips}>
            {item.compounds.map((c) => (
              <View key={c.word} style={styles.chip}>
                <Text style={styles.chipText}>{c.word}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>

      {open && (
        <View style={styles.detail}>
          {!!item.explanation && <Text style={styles.body}>{item.explanation}</Text>}
          {item.compounds.map((c) => (
            <CompoundCard key={c.word} compound={c} />
          ))}
          {!!item.grammar && (
            <>
              <Text style={styles.label}>Grammar</Text>
              <Text style={styles.body}>{item.grammar}</Text>
            </>
          )}
          {item.quiz_questions.length > 0 && (
            <>
              <Text style={styles.label}>Quiz</Text>
              <QuizPlayer
                questions={item.quiz_questions}
                reward={reward}
                previous={hasScore(item) ? { score: item.quiz_score!, total: item.quiz_total! } : null}
                onComplete={(score, total) => {
                  saveQuizScore(item.id, score, total).catch(() => {});
                  setReward(null);
                  reportQuiz(score, total, item.id).then(setReward);
                }}
              />
            </>
          )}
          {item.quiz_questions.length === 0 && !!item.quiz && (
            <>
              <Text style={styles.label}>Quiz</Text>
              <Text style={styles.body}>{item.quiz}</Text>
            </>
          )}
          <Pressable onPress={onDelete} style={styles.delete} accessibilityRole="button">
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: 16,
    },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    score: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.accentSoft,
      borderRadius: 999,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    scoreText: { color: c.accent, fontSize: 12, fontWeight: '800' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    translation: { color: c.accent, fontSize: 16, lineHeight: 23, fontWeight: '600', marginTop: 6 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    date: { color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
    transcript: { color: c.text, fontSize: 17, lineHeight: 25, fontWeight: '500' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    chip: { backgroundColor: c.accentSoft, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
    chipText: { color: c.accent, fontSize: 12, fontWeight: '700' },
    detail: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      gap: 8,
    },
    body: { color: c.text, fontSize: 15, lineHeight: 23 },
    label: {
      color: c.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 8,
    },
    delete: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingVertical: 6,
    },
    deleteText: { color: c.error, fontSize: 14, fontWeight: '600' },
  });
