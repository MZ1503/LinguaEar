import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/src/features/auth';
import { useGameEngine } from '@/src/features/game';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { PrivacyPolicy } from './PrivacyPolicy';

const capitalize = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : '—');

export function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, logout } = useAuth();
  const { score } = useGameEngine();
  const router = useRouter();
  const [showPrivacy, setShowPrivacy] = useState(false);

  const confirmLogout = () =>
    Alert.alert('Log out', 'Do you want to log out of LinguaEar?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);

  if (!user) return null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.initial}>{(user.fullName || user.name)[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.badge}>
              <Image
                source={require('@/assets/images/ear-logo.png')}
                style={styles.badgeLogo}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.name}>{user.fullName || user.name}</Text>
          <Text style={styles.email}>
            @{user.name} · {user.email}
          </Text>
          {!!user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        <View style={styles.stats}>
          <Stat icon="flag-outline" label="Goal" value={capitalize(user.goal)} />
          <Stat icon="stats-chart-outline" label="Level" value={capitalize(user.level)} />
          <Stat icon="trophy-outline" label="Score" value={String(score)} />
        </View>

        <Text style={styles.section}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={22} color={colors.accent} />
            <Text style={styles.rowText}>Edit profile</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, styles.rowDivider]}
            onPress={() => router.push('/change-password')}
            activeOpacity={0.7}
          >
            <Ionicons name="lock-closed-outline" size={22} color={colors.accent} />
            <Text style={styles.rowText}>Change password</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Legal</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => setShowPrivacy((v) => !v)} activeOpacity={0.7}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.accent} />
            <Text style={styles.rowText}>Privacy & Impressum</Text>
            <Ionicons name={showPrivacy ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
          </TouchableOpacity>
          {showPrivacy && (
            <View style={styles.policy}>
              <PrivacyPolicy />
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logout} onPress={confirmLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 40 },
    header: { alignItems: 'center', marginTop: 12, marginBottom: 28 },
    avatarRing: {
      width: 104,
      height: 104,
      borderRadius: 52,
      borderWidth: 2,
      borderColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.accent,
      shadowOpacity: 0.45,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 0 },
    },
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: { color: c.accent, fontSize: 40, fontWeight: '700' },
    badge: {
      position: 'absolute',
      right: -4,
      bottom: -2,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.bg,
      borderWidth: 2,
      borderColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeLogo: { width: 20, height: 20 },
    name: { color: c.text, fontSize: 24, fontWeight: '700', marginTop: 16 },
    bio: {
      color: c.text,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 10,
      paddingHorizontal: 12,
    },
    rowDivider: { borderTopWidth: 1, borderTopColor: c.border },
    email: { color: c.muted, fontSize: 14, marginTop: 4 },
    stats: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    stat: {
      flex: 1,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      gap: 6,
    },
    statValue: { color: c.text, fontSize: 16, fontWeight: '700' },
    statLabel: { color: c.muted, fontSize: 12 },
    section: {
      color: c.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
    rowText: { flex: 1, color: c.text, fontSize: 16 },
    policy: { paddingBottom: 16, borderTopWidth: 1, borderTopColor: c.border },
    logout: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.error,
    },
    logoutText: { color: c.error, fontSize: 16, fontWeight: '600' },
  });
