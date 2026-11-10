import type { BottomTabBarProps } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

const PAD = 6;
const SPRING = { damping: 16, stiffness: 190, mass: 0.8 };

/** Floating pill tab bar: a cyan capsule glides under the active tab. */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);

  // Hidden screens (like Profile, via `href: null`) stay routable but get no tab.
  const routes = state.routes.filter((r) => !descriptors[r.key].options.hidden);
  const activeKey = state.routes[state.index].key;
  const activeIndex = routes.findIndex((r) => r.key === activeKey);
  const itemWidth = width ? (width - PAD * 2) / routes.length : 0;

  useEffect(() => {
    if (itemWidth && activeIndex >= 0) x.value = withSpring(activeIndex * itemWidth, SPRING);
  }, [activeIndex, itemWidth, x]);

  const capsule = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {!!itemWidth && activeIndex >= 0 && (
          <Animated.View style={[styles.capsule, { width: itemWidth }, capsule]} />
        )}

        {routes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = route.key === activeKey;
          const color = focused ? colors.accent : colors.muted;
          const label = typeof options.title === 'string' ? options.title : route.name;

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          return (
            <Pressable
              key={route.key}
              style={styles.item}
              onPress={onPress}
              onPressIn={() => {
                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            >
              <TabIcon focused={focused}>{options.tabBarIcon?.({ focused, color, size: 24 })}</TabIcon>
              <Text style={[styles.label, { color }, focused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const scale = useSharedValue(focused ? 1.12 : 1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.12 : 1, SPRING);
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: c.bg },
    bar: {
      flexDirection: 'row',
      padding: PAD,
      borderRadius: 30,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.accent,
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 4 },
      elevation: 10,
    },
    capsule: {
      position: 'absolute',
      top: PAD,
      bottom: PAD,
      left: PAD,
      borderRadius: 24,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accentBorder,
    },
    item: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
    label: { fontSize: 11, fontWeight: '600' },
    labelActive: { fontWeight: '700' },
  });
