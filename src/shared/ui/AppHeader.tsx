import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/shared/theme/useTheme';

/** Top bar with the logo on the left and whatever actions the caller passes on the right. */
export function AppHeader({ right }: { right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + 8, backgroundColor: colors.bg, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.brand}>
        <View
          style={[styles.logoWrap, { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }]}
        >
          <Image source={require('@/assets/images/ear-logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          Lingua<Text style={{ color: colors.accent }}>Ear</Text>
        </Text>
      </View>
      <View style={styles.actions}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 24, height: 24 },
  name: { fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
