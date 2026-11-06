import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/src/shared/theme/useTheme';

/**
 * A "Back" button for screen headers. It goes back when there is a screen to go back to, and otherwise to
 * the start screen, so it still works when a page was opened directly and has nothing behind it.
 */
export function BackButton() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={10}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={24} color={colors.accent} />
      <Text style={[styles.text, { color: colors.accent }]}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', marginLeft: -6 },
  text: { fontSize: 17 },
});
