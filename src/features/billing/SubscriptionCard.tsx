import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { useBilling } from './useBilling';
import { useAlert } from '@/src/shared/ui/AlertProvider';

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Profile card: trial countdown, current plan and a way to change it. */
export function SubscriptionCard() {
  const router = useRouter();
  const alert = useAlert();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { status, manage } = useBilling();
  const [busy, setBusy] = useState(false);

  // No paywall on this server (development), or the status isn't known yet.
  if (!status || status.state === 'free') return null;

  const openManage = async () => {
    setBusy(true);
    try {
      await manage();
    } catch (err) {
      alert.error('Could not open billing', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const subscribed = status.state === 'subscribed';
  const title = subscribed
    ? `${status.tier === 'pro' ? 'Pro' : 'Standard'} plan`
    : status.state === 'trial'
      ? 'Free trial'
      : 'Trial ended';
  const detail = subscribed
    ? status.cancel_at_period_end
      ? `Ends on ${date(status.current_period_end)}`
      : `Renews on ${date(status.current_period_end)}`
    : status.state === 'trial'
      ? `${status.trial_days_left} day${status.trial_days_left === 1 ? '' : 's'} left`
      : 'Subscribe to keep using LinguaEar';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name={subscribed ? 'ribbon-outline' : 'time-outline'} size={20} color={colors.accent} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
      </View>

      <Pressable
        onPress={subscribed ? openManage : () => router.push('/paywall')}
        disabled={busy}
        style={styles.button}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color={colors.onAccent} />
        ) : (
          <Text style={styles.buttonText}>{subscribed ? 'Manage subscription' : 'Choose a plan'}</Text>
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      gap: 14,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1 },
    title: { color: c.text, fontSize: 16, fontWeight: '700' },
    detail: { color: c.muted, fontSize: 13, marginTop: 2 },
    button: { backgroundColor: c.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    buttonText: { color: c.onAccent, fontSize: 15, fontWeight: '700' },
  });
