import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CompoundCard } from '@/src/shared/german/CompoundCard';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import type { SavedAnalysis } from './historyTypes';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

type Props = {
  item: SavedAnalysis;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

/** One saved phrase: collapsed shows the transcript and compounds, open shows the full result. */
export function HistoryCard({ item, open, onToggle, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={styles.rowTop}>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
        </View>
        <Text style={styles.transcript}>“{item.transcript}”</Text>
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
          {!!item.quiz && (
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
