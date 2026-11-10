import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { GENDERS, GENDER_COLORS, GENDER_MEANING, GENDER_UNDERLINE, markNouns } from './gender';
import type { Gender, NounInfo } from './gender';

type Props = {
  children: string;
  nouns: NounInfo[];
  style?: StyleProp<TextStyle>;
};

/** German text with each named noun, and its article, in the colour of its gender. */
export function GenderText({ children, nouns, style }: Props) {
  const segments = useMemo(() => markNouns(children, nouns), [children, nouns]);

  return (
    <Text style={style}>
      {segments.map((s, i) =>
        s.gender ? (
          <Text
            key={i}
            style={{
              color: GENDER_COLORS[s.gender],
              fontWeight: '700',
              textDecorationLine: 'underline',
              textDecorationStyle: GENDER_UNDERLINE[s.gender],
              textDecorationColor: GENDER_COLORS[s.gender],
            }}
          >
            {s.text}
          </Text>
        ) : (
          s.text
        ),
      )}
    </Text>
  );
}

/** A small key for the three colours: der, die, das. */
export function GenderLegend() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row} accessibilityLabel="Colour key: der masculine, die feminine, das neuter">
      {GENDERS.map((g: Gender) => (
        <View key={g} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: GENDER_COLORS[g] }]} />
          <Text
            style={[
              styles.text,
              {
                color: GENDER_COLORS[g],
                textDecorationLine: 'underline',
                textDecorationStyle: GENDER_UNDERLINE[g],
                textDecorationColor: GENDER_COLORS[g],
              },
            ]}
          >
            {g}
          </Text>
          <Text style={styles.meaning}>{GENDER_MEANING[g]}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    text: { fontSize: 13, fontWeight: '800' },
    meaning: { color: c.muted, fontSize: 12 },
  });
