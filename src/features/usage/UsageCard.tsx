import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { useUsage } from './useUsage';
import type { QuotaItem } from './useUsage';

/** Daily limits at a glance: one bar per feature. */
export function UsageCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { usage, failed } = useUsage();

  if (failed && !usage) return null;
  if (!usage) return null;

  const rows: { label: string; item: QuotaItem }[] = [
    { label: 'Phrase analyses', item: usage.limits.analyze },
    { label: 'Camera scans', item: usage.limits.scan },
    { label: 'Game replies', item: usage.limits.game },
    { label: 'Voice recordings', item: usage.limits.transcribe },
    { label: 'Saved phrases', item: usage.saved_phrases },
  ];

  return (
    <View style={styles.card}>
      {rows.map(({ label, item }, i) => {
        const ratio = Math.min(item.used / item.limit, 1);
        const full = item.used >= item.limit;
        return (
          <View key={label} style={[styles.row, i > 0 && styles.rowGap]}>
            <View style={styles.top}>
              <Text style={styles.label}>{label}</Text>
              <Text style={[styles.count, full && { color: colors.error }]}>
                {item.used} / {item.limit}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${ratio * 100}%`, backgroundColor: full ? colors.error : colors.accent },
                ]}
              />
            </View>
          </View>
        );
      })}
      <Text style={styles.note}>Daily limits reset at midnight UTC.</Text>
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    row: {},
    rowGap: { marginTop: 14 },
    top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    label: { color: c.text, fontSize: 14, fontWeight: '600' },
    count: { color: c.muted, fontSize: 13, fontWeight: '700' },
    track: { height: 6, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' },
    fill: { height: 6, borderRadius: 3 },
    note: { color: c.muted, fontSize: 12, marginTop: 14 },
  });
