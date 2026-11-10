import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Tint for the icon tile; defaults to the theme accent. */
  tint?: string;
  action?: { label: string; onPress: () => void };
  /** Makes the header tappable and hides the body until opened. */
  collapsible?: boolean;
  /** Small pill next to the title, e.g. a quiz score. */
  badge?: string;
  children: React.ReactNode;
};

/** Titled card used for results: a tinted icon tile, an uppercase label and the content below. */
export function Section({ title, icon, tint, action, collapsible, badge, children }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(!collapsible);
  const color = tint ?? colors.accent;

  const header = (
    <View style={styles.header}>
      <View style={[styles.tile, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!badge && (
        <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.badgeText, { color }]}>{badge}</Text>
        </View>
      )}
      {action && (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={[styles.action, { color: colors.accent }]}>{action.label}</Text>
        </Pressable>
      )}
      {collapsible && <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />}
    </View>
  );

  return (
    <View style={styles.card}>
      {collapsible ? (
        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
        >
          {header}
        </Pressable>
      ) : (
        header
      )}
      {/* Stay mounted while collapsed so a quiz in progress isn't lost. */}
      <View style={[styles.body, !open && styles.hidden]}>{children}</View>
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: 16,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tile: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    title: {
      flex: 1,
      color: c.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    badge: { borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
    badgeText: { fontSize: 12, fontWeight: '800' },
    action: { fontSize: 13, fontWeight: '600' },
    body: { marginTop: 12 },
    hidden: { display: 'none' },
  });
