import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { useScore } from './useScore';

/** Compact XP pill for the header; opens Profile where the full breakdown is. */
export function ScoreChip() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { summary } = useScore();

  if (!summary) return null;

  return (
    <Pressable
      onPress={() => router.push('/profile')}
      style={styles.chip}
      accessibilityRole="button"
      accessibilityLabel={`${summary.total_points} points, level ${summary.level}`}
    >
      <Ionicons name="flash" size={13} color={colors.accent} />
      <Text style={styles.text}>{summary.total_points}</Text>
    </Pressable>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: c.accentSoft,
    },
    text: { color: c.accent, fontSize: 13, fontWeight: '800' },
  });
