import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { CATEGORIES, closeTicket, getTicket } from './supportService';
import type { Ticket } from './supportService';
import { useAlert } from '@/src/shared/ui/AlertProvider';

/** One support request. Replies arrive by email. */
export function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = useAlert();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getTicket(Number(id))
      .then(setTicket)
      .catch(() => setFailed(true));
  }, [id]);

  const close = async () => {
    if (!ticket) return;
    setBusy(true);
    try {
      setTicket(await closeTicket(ticket.id));
    } catch (err) {
      alert.error('Could not close it', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (failed) return <Text style={styles.empty}>This request could not be loaded.</Text>;
  if (!ticket) return <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.meta}>
        #{ticket.id} · {CATEGORIES.find((c) => c.id === ticket.category)?.label} ·{' '}
        {ticket.status === 'open' ? 'Open' : 'Closed'}
      </Text>
      <Text style={styles.subject}>{ticket.subject}</Text>
      <Text style={styles.message}>{ticket.message}</Text>
      <Text style={styles.note}>
        {ticket.status === 'open'
          ? 'We will reply to the email address on your account.'
          : 'This request is closed. Send a new one if you still need help.'}
      </Text>

      {ticket.status === 'open' && (
        <Pressable onPress={close} disabled={busy} style={styles.button} accessibilityRole="button">
          {busy ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.buttonText}>Mark as solved</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, gap: 12 },
    empty: { color: c.muted, textAlign: 'center', marginTop: 40 },
    meta: { color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    subject: { color: c.text, fontSize: 22, fontWeight: '800' },
    message: { color: c.text, fontSize: 16, lineHeight: 24 },
    note: { color: c.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
    button: {
      borderWidth: 1.5,
      borderColor: c.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonText: { color: c.accent, fontSize: 15, fontWeight: '700' },
  });
