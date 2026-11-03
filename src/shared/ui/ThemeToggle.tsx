import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/src/shared/theme/useTheme';

const WIDTH = 58;
const HEIGHT = 32;
const KNOB = 24;
const INSET = 4;

/** Day / night switch: the knob slides and shows a sun or a moon. */
export function ThemeToggle() {
  const { isDark, colors, toggle } = useTheme();
  const x = useSharedValue(isDark ? WIDTH - KNOB - INSET * 2 : 0);

  useEffect(() => {
    x.value = withSpring(isDark ? WIDTH - KNOB - INSET * 2 : 0, { damping: 15, stiffness: 200 });
  }, [isDark, x]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggle();
      }}
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: isDark }}
      hitSlop={8}
      style={[styles.track, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Ionicons name="sunny" size={13} color={isDark ? colors.muted : colors.accent} style={styles.sun} />
      <Ionicons name="moon" size={13} color={isDark ? colors.accent : colors.muted} style={styles.moon} />
      <Animated.View style={[styles.knob, { backgroundColor: colors.accent }, knob]}>
        <Ionicons name={isDark ? 'moon' : 'sunny'} size={14} color={colors.onAccent} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderWidth: 1,
    justifyContent: 'center',
  },
  sun: { position: 'absolute', left: 8 },
  moon: { position: 'absolute', right: 8 },
  knob: {
    position: 'absolute',
    left: INSET - 1,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
