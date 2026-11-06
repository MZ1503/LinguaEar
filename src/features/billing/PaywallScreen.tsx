import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/features/auth';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import type { PlanInfo, Tier } from './billingTypes';
import { useBilling } from './useBilling';
import { useAlert } from '@/src/shared/ui/AlertProvider';

const NAMES: Record<Tier, string> = { standard: 'Standard', pro: 'Pro' };

const features = (p: PlanInfo) => [
  `${p.analyze_per_day} phrase analyses a day`,
  `${p.scan_per_day} camera scans a day`,
  `${p.game_per_day} game replies a day`,
  `${p.saved_phrases} saved phrases`,
];

/** Plan chooser. Shown instead of the app when the trial has ended, and from Profile for anyone who wants to subscribe. */
export function PaywallScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { logout } = useAuth();
  const alert = useAlert();
  const router = useRouter();
  const { status, subscribe, manage, refresh, hasAccess } = useBilling();
  const hadAccess = useRef(hasAccess);
  const [busy, setBusy] = useState<Tier | 'manage' | 'refresh' | null>(null);

  useEffect(() => {
    // Someone who got here because the trial ended goes straight into the app once they subscribe.
    if (!hadAccess.current && hasAccess) router.replace('/(tabs)');
    hadAccess.current = hasAccess;
  }, [hasAccess, router]);

  const expired = status?.state === 'expired';
  const subscribed = status?.state === 'subscribed';

  const run = async (key: NonNullable<typeof busy>, job: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await job();
    } catch (err) {
      alert.error('Something went wrong', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const choose = (tier: Tier) =>
    run(tier, async () => {
      const outcome = await subscribe(tier);
      // Only a payment that was started but not yet confirmed needs an explanation.
      if (outcome === 'pending')
        alert.show({
          type: 'info',
          title: 'Still waiting',
          message: "If you finished paying, it can take a moment. Tap 'I've already paid' in a few seconds.",
        });
    });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Image source={require('@/assets/images/ear-logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{expired ? 'Your free trial has ended' : 'Choose your plan'}</Text>
      <Text style={styles.subtitle}>
        {expired
          ? 'Subscribe to keep practising. Your saved phrases and progress are waiting for you.'
          : 'Unlock more every day. Cancel any time.'}
      </Text>

      {!status && <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />}

      {status?.plans.map((plan) => {
        const current = subscribed && status.tier === plan.tier;
        const pro = plan.tier === 'pro';
        return (
          <View key={plan.tier} style={[styles.card, pro && styles.cardPro]}>
            <View style={styles.cardTop}>
              <Text style={styles.planName}>{NAMES[plan.tier]}</Text>
              {pro && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Most popular</Text>
                </View>
              )}
            </View>
            <Text style={styles.price}>{plan.price_label}</Text>

            <View style={styles.list}>
              {features(plan).map((f) => (
                <View key={f} style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            {current ? (
              <View style={styles.currentPill}>
                <Text style={styles.currentText}>Your current plan</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => (subscribed ? run('manage', manage) : choose(plan.tier))}
                disabled={busy !== null}
                style={[
                  styles.button,
                  pro ? styles.buttonPro : styles.buttonOutline,
                  busy !== null && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
              >
                {busy === plan.tier ? (
                  <ActivityIndicator color={pro ? colors.onAccent : colors.accent} />
                ) : (
                  <Text
                    style={[styles.buttonText, pro ? { color: colors.onAccent } : { color: colors.accent }]}
                  >
                    {subscribed ? 'Switch in Manage subscription' : `Subscribe to ${NAMES[plan.tier]}`}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        );
      })}

      {subscribed && (
        <Pressable onPress={() => run('manage', manage)} style={styles.link} accessibilityRole="button">
          <Text style={styles.linkText}>Manage subscription</Text>
        </Pressable>
      )}

      <Pressable
        onPress={() => run('refresh', refresh)}
        disabled={busy !== null}
        style={styles.link}
        accessibilityRole="button"
      >
        {busy === 'refresh' ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text style={styles.linkText}>I&apos;ve already paid, refresh</Text>
        )}
      </Pressable>

      {expired && (
        <Pressable onPress={() => logout()} style={styles.link} accessibilityRole="button">
          <Text style={[styles.linkText, { color: colors.muted }]}>Log out</Text>
        </Pressable>
      )}

      <Text style={styles.legal}>
        Payment is handled securely by Stripe. Your subscription renews each month until you cancel it in
        Manage subscription.
      </Text>
    </ScrollView>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 48, alignItems: 'center' },
    logo: { width: 64, height: 64, marginTop: 12 },
    title: { color: c.text, fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 16 },
    subtitle: {
      color: c.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 20,
    },
    card: {
      width: '100%',
      backgroundColor: c.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      marginBottom: 14,
    },
    cardPro: { borderColor: c.accent, borderWidth: 2 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    planName: { color: c.text, fontSize: 20, fontWeight: '800' },
    badge: { backgroundColor: c.accentSoft, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
    badgeText: { color: c.accent, fontSize: 12, fontWeight: '800' },
    price: { color: c.accent, fontSize: 18, fontWeight: '700', marginTop: 6 },
    list: { gap: 10, marginVertical: 16 },
    feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureText: { color: c.text, fontSize: 15 },
    button: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    buttonPro: { backgroundColor: c.accent },
    buttonOutline: { borderWidth: 1.5, borderColor: c.accent },
    buttonText: { fontSize: 15, fontWeight: '700' },
    currentPill: {
      backgroundColor: c.accentSoft,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },
    currentText: { color: c.accent, fontSize: 14, fontWeight: '700' },
    link: { paddingVertical: 12 },
    linkText: { color: c.accent, fontSize: 15, fontWeight: '600' },
    legal: {
      color: c.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: 8,
    },
  });
