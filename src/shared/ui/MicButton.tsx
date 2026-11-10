import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/src/shared/theme/useTheme';

export type MicState = 'idle' | 'recording' | 'processing';

const SIZE = 92;
const RING = 188;

function Ring({ active, delay, color }: { active: boolean; delay: number; color: string }) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (active) {
      t.value = 0;
      t.value = withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1, false),
      );
    } else {
      cancelAnimation(t);
      t.value = withTiming(0, { duration: 200 });
    }
  }, [active, delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: active ? 0.5 * (1 - t.value) : 0,
    transform: [{ scale: SIZE / RING + (1 - SIZE / RING) * t.value }],
  }));

  return <Animated.View pointerEvents="none" style={[styles.ring, { backgroundColor: color }, style]} />;
}

/** Record button: soft halo when idle, expanding rings while recording, spinner while processing. */
export function MicButton({ state, onPress }: { state: MicState; onPress: () => void }) {
  const { colors } = useTheme();
  const recording = state === 'recording';
  const scale = useSharedValue(1);

  const press = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.stage}>
      <View style={[styles.halo, { backgroundColor: colors.accentSoft }]} />
      <Ring active={recording} delay={0} color={colors.accent} />
      <Ring active={recording} delay={1000} color={colors.accent} />

      <Animated.View style={press}>
        <Pressable
          disabled={state === 'processing'}
          onPress={onPress}
          onPressIn={() => {
            scale.set(withSpring(0.93));
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onPressOut={() => {
            scale.set(withSpring(1));
          }}
          accessibilityRole="button"
          accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
          style={[
            styles.button,
            {
              backgroundColor: recording ? colors.error : colors.accent,
              shadowColor: recording ? colors.error : colors.accent,
            },
          ]}
        >
          {state === 'processing' ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Ionicons name={recording ? 'stop' : 'mic'} size={recording ? 30 : 38} color="#fff" />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 132, height: 132, borderRadius: 66 },
  ring: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2 },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
