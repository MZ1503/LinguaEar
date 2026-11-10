import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import type { LegalDocument } from './legalContent';

/** Renders a legal document (terms or privacy policy) as a readable page. */
export function LegalScreen({ document }: { document: LegalDocument }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{document.title}</Text>
      <Text style={styles.updated}>Last updated: {document.updated}</Text>
      <Text style={styles.paragraph}>{document.intro}</Text>

      {document.sections.map((section) => (
        <View key={section.heading}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.paragraphs.map((p) => (
            <Text key={p} style={styles.paragraph}>
              {p}
            </Text>
          ))}
          {section.bullets?.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.paragraph, styles.bulletText]}>{b}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 48 },
    title: { color: c.text, fontSize: 28, fontWeight: '800' },
    updated: { color: c.muted, fontSize: 13, marginTop: 4, marginBottom: 16 },
    heading: { color: c.accent, fontSize: 16, fontWeight: '700', marginTop: 22, marginBottom: 6 },
    paragraph: { color: c.text, fontSize: 15, lineHeight: 23, marginBottom: 8 },
    bulletRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
    bullet: { color: c.muted, fontSize: 15, lineHeight: 23 },
    bulletText: { flex: 1, marginBottom: 6 },
  });
