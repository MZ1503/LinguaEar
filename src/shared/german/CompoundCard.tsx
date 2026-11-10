import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import type { Compound } from './compounds';

const PART_COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];

/** Shows one compound as coloured blocks: Hand + Schuh = glove. */
export function CompoundCard({ compound }: { compound: Compound }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Linking letters stay grey; real parts cycle through the palette.
  let n = 0;
  const parts = compound.parts.map((p) => ({
    ...p,
    link: !p.meaning,
    color: p.meaning ? PART_COLORS[n++ % PART_COLORS.length] : colors.muted,
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.word} accessibilityLabel={compound.word}>
        {parts.map((p, i) => (
          <Text key={i} style={{ color: p.color }}>
            {p.text}
          </Text>
        ))}
      </Text>

      <View style={styles.row}>
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Text style={styles.op}>+</Text>}
            <View
              style={[
                styles.block,
                p.link ? styles.linkBlock : { backgroundColor: `${p.color}1f`, borderColor: `${p.color}55` },
              ]}
            >
              <Text style={[styles.blockText, { color: p.color }]}>{p.text}</Text>
              {!p.link && <Text style={styles.blockMeaning}>{p.meaning}</Text>}
            </View>
          </React.Fragment>
        ))}
        {!!compound.meaning && (
          <>
            <Text style={styles.op}>=</Text>
            <View style={styles.result}>
              <Text style={styles.resultText}>{compound.meaning}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    card: { paddingVertical: 12, gap: 12 },
    word: { fontSize: 22, fontWeight: '800', letterSpacing: 0.2 },
    row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
    op: { color: c.muted, fontSize: 18, fontWeight: '600' },
    block: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
    },
    linkBlock: {
      backgroundColor: 'transparent',
      borderColor: c.border,
      borderStyle: 'dashed',
      paddingHorizontal: 9,
    },
    blockText: { fontSize: 15, fontWeight: '800' },
    blockMeaning: { color: c.muted, fontSize: 11, marginTop: 2 },
    result: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: c.accent,
    },
    resultText: { color: c.onAccent, fontSize: 15, fontWeight: '800' },
  });
