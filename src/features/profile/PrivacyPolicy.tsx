import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Data Collection',
    body: 'LinguaEar records audio only when you press the Listen button. Audio is processed by our AI systems and immediately deleted. Nothing is stored.',
  },
  {
    heading: '2. Data Storage',
    body: 'Audio is processed in real time and immediately discarded. Your account (username, email and your learning preferences) is kept on our server and on this device. Phrases you choose to save (the text of what you said and the feedback, never the audio) are stored with your account until you delete them.',
  },
  {
    heading: '3. GDPR',
    body: 'We keep only the data needed to run your account. Audio is processed and immediately discarded. You are always in control.',
  },
  { heading: '4. Contact', body: 'linguaear@gmail.com' },
  {
    heading: 'Impressum',
    body: 'Name: LinguaEar\nAddress: Cologne, Germany\nEmail: linguaear@gmail.com',
  },
];

export function PrivacyPolicy() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View>
      {SECTIONS.map((s) => (
        <View key={s.heading}>
          <Text style={styles.heading}>{s.heading}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    heading: { color: c.accent, fontSize: 15, fontWeight: '700', marginTop: 14, marginBottom: 4 },
    body: { color: c.muted, fontSize: 14, lineHeight: 21 },
  });
