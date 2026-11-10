import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/features/auth';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { useAlert } from '@/src/shared/ui/AlertProvider';

type Item = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href?: Href;
  danger?: boolean;
  onPress?: () => void;
};

/** One place for account, subscription, notifications, help and legal pages. */
export function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { logout } = useAuth();
  const alert = useAlert();

  const confirmLogout = () =>
    alert.show({
      type: 'question',
      icon: 'log-out',
      title: 'Log out?',
      message: 'You will need to sign in again to use LinguaEar.',
      buttons: [
        { text: 'Log out', onPress: () => logout() },
        { text: 'Stay signed in', style: 'cancel' },
      ],
    });

  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit profile', href: '/edit-profile' },
        { icon: 'lock-closed-outline', label: 'Change password', href: '/change-password' },
        { icon: 'log-out-outline', label: 'Log out', onPress: confirmLogout },
      ],
    },
    {
      title: 'Plan',
      items: [{ icon: 'ribbon-outline', label: 'Subscription', href: '/paywall' }],
    },
    {
      title: 'Preferences',
      items: [{ icon: 'notifications-outline', label: 'Email notifications', href: '/notifications' }],
    },
    {
      title: 'Help & legal',
      items: [
        { icon: 'help-buoy-outline', label: 'Contact support', href: '/support' },
        { icon: 'document-text-outline', label: 'Terms & conditions', href: '/terms' },
        { icon: 'shield-checkmark-outline', label: 'Privacy policy', href: '/privacy' },
        { icon: 'business-outline', label: 'Legal notice (Impressum)', href: '/impressum' },
      ],
    },
    {
      title: 'Danger zone',
      items: [{ icon: 'trash-outline', label: 'Delete account', href: '/delete-account', danger: true }],
    },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {groups.map((group) => (
        <View key={group.title}>
          <Text style={styles.section}>{group.title}</Text>
          <View style={styles.card}>
            {group.items.map((item, i) => (
              <Pressable
                key={item.label}
                style={[styles.row, i > 0 && styles.divider]}
                onPress={item.onPress ?? (() => item.href && router.push(item.href))}
                accessibilityRole="button"
              >
                <Ionicons name={item.icon} size={22} color={item.danger ? colors.error : colors.accent} />
                <Text style={[styles.label, item.danger && { color: colors.error }]}>{item.label}</Text>
                {item.href && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.version}>LinguaEar {Constants.expoConfig?.version ?? ''}</Text>
    </ScrollView>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 48 },
    section: {
      color: c.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingHorizontal: 16,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
    divider: { borderTopWidth: 1, borderTopColor: c.border },
    label: { flex: 1, color: c.text, fontSize: 16 },
    version: { color: c.muted, fontSize: 12, textAlign: 'center', marginTop: 28 },
  });
