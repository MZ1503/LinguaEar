import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/src/features/auth';
import { useTheme } from '@/src/shared/theme/useTheme';

/** Round avatar for the header; opens the Profile tab. */
export function ProfileButton() {
  const router = useRouter();
  const active = usePathname() === '/profile';
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => router.push('/profile')}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      hitSlop={6}
      style={[
        styles.avatar,
        {
          backgroundColor: active ? colors.accent : colors.accentSoft,
          borderColor: colors.accent,
        },
      ]}
    >
      <Text style={[styles.initial, { color: active ? colors.onAccent : colors.accent }]}>
        {user?.name[0]?.toUpperCase() ?? '?'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 16, fontWeight: '800' },
});
