import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { authedFetch } from '@/src/features/auth';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { useAlert } from '@/src/shared/ui/AlertProvider';

type Prefs = { practice_reminders: boolean; product_updates: boolean; billing_emails: boolean };

const ROWS: { key: keyof Prefs; title: string; text: string }[] = [
  {
    key: 'practice_reminders',
    title: 'Practice reminders',
    text: 'A friendly email in the afternoon on days you have not practised yet.',
  },
  {
    key: 'product_updates',
    title: 'Product updates',
    text: 'News about new features and improvements.',
  },
  {
    key: 'billing_emails',
    title: 'Subscription emails',
    text: 'Notes about your plan, such as renewals and payment problems.',
  },
];

async function request(method: 'GET' | 'PUT', prefs?: Prefs): Promise<Prefs> {
  const res = await authedFetch('/notifications/preferences', {
    method,
    ...(prefs ? { body: JSON.stringify(prefs) } : {}),
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

/** Email preferences. Each switch saves straight away. */
export function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const alert = useAlert();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    request('GET')
      .then(setPrefs)
      .catch(() => setFailed(true));
  }, []);

  const toggle = useCallback(
    async (key: keyof Prefs, value: boolean) => {
      if (!prefs) return;
      const previous = prefs;
      const next = { ...prefs, [key]: value };
      setPrefs(next); // optimistic: the switch moves at once
      try {
        setPrefs(await request('PUT', next));
      } catch {
        setPrefs(previous);
        alert.error('Could not save', 'Check your connection and try again.');
      }
    },
    [prefs, alert],
  );

  if (failed) return <Text style={styles.empty}>Could not load your settings. Please try again later.</Text>;
  if (!prefs) return <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Choose which emails you want to get.</Text>

      <View style={styles.card}>
        {ROWS.map((row, i) => (
          <View key={row.key} style={[styles.row, i > 0 && styles.divider]}>
            <View style={styles.rowText}>
              <Text style={styles.title}>{row.title}</Text>
              <Text style={styles.text}>{row.text}</Text>
            </View>
            <Switch
              value={prefs[row.key]}
              onValueChange={(v) => toggle(row.key, v)}
              trackColor={{ true: colors.accent, false: colors.border }}
              accessibilityLabel={row.title}
            />
          </View>
        ))}
      </View>

      <Text style={styles.note}>
        Security emails, such as verification and password reset codes, and replies to your support requests
        are always sent. Every optional email has an unsubscribe link.
      </Text>
    </ScrollView>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 40 },
    empty: { color: c.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
    intro: { color: c.muted, fontSize: 15, marginBottom: 16 },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
    divider: { borderTopWidth: 1, borderTopColor: c.border },
    rowText: { flex: 1 },
    title: { color: c.text, fontSize: 16, fontWeight: '600' },
    text: { color: c.muted, fontSize: 13, lineHeight: 19, marginTop: 2 },
    note: { color: c.muted, fontSize: 13, lineHeight: 20, marginTop: 16 },
  });
