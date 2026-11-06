import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/src/features/auth';
import { SubscriptionCard, usePlanLabel } from '@/src/features/billing';
import { useScore } from '@/src/features/score';
import { UsageCard } from '@/src/features/usage';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { useAlert } from '@/src/shared/ui/AlertProvider';

const capitalize = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : '—');

export function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, logout } = useAuth();
  const alert = useAlert();
  const { summary } = useScore();
  const plan = usePlanLabel();
  const router = useRouter();

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
          {plan && (
            <TouchableOpacity
              style={[styles.planBadge, plan.warn && styles.planBadgeWarn]}
              onPress={() => router.push('/paywall')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Plan: ${plan.text}`}
            >
              <Ionicons name={plan.icon} size={14} color={plan.warn ? colors.error : colors.accent} />
              <Text style={[styles.planText, plan.warn && { color: colors.error }]}>{plan.text}</Text>
            </TouchableOpacity>
          )}
          {!!user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        <View style={styles.stats}>
          <Stat icon="flag-outline" label="Goal" value={capitalize(user.goal)} />
          <Stat icon="stats-chart-outline" label="English" value={capitalize(user.level)} />
          <Stat icon="flash-outline" label="Total XP" value={String(summary?.total_points ?? 0)} />
        </View>

        {summary && (
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text style={styles.levelText}>Level {summary.level}</Text>
              <Text style={styles.levelXp}>
                {summary.level_points} / {summary.level_size} XP
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${(summary.level_points / summary.level_size) * 100}%` }]}
              />
            </View>
            <View style={styles.progressBottom}>
              <View style={styles.pill}>
                <Ionicons name="flame-outline" size={14} color={colors.accent} />
                <Text style={styles.pillText}>
                  {summary.streak_days} day{summary.streak_days === 1 ? '' : 's'} streak
                </Text>
              </View>
              <Text style={styles.today}>+{summary.today_points} XP today</Text>
            </View>
          </View>
        )}

        <Text style={styles.section}>Subscription</Text>
        <SubscriptionCard />

        <Text style={styles.section}>Today&apos;s limits</Text>
        <UsageCard />

        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/settings')} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={22} color={colors.accent} />
            <Text style={styles.rowText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logout} onPress={confirmLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.accent} />
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
    progressCard: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 28,
    },
    progressTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 10,
    },
    levelText: { color: c.text, fontSize: 18, fontWeight: '800' },
    levelXp: { color: c.muted, fontSize: 13, fontWeight: '600' },
    track: { height: 8, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4, backgroundColor: c.accent },
    progressBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.accentSoft,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    pillText: { color: c.accent, fontSize: 12, fontWeight: '700' },
    today: { color: c.muted, fontSize: 12, fontWeight: '600' },
    rowDivider: { borderTopWidth: 1, borderTopColor: c.border },
    planBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.accentSoft,
    },
    planBadgeWarn: { backgroundColor: 'rgba(239, 68, 68, 0.14)' },
    planText: { color: c.accent, fontSize: 13, fontWeight: '800' },
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
      borderColor: c.accent,
    },
    logoutText: { color: c.accent, fontSize: 16, fontWeight: '600' },
  });
