import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { CATEGORIES, listTickets } from './supportService';
import type { Ticket } from './supportService';

const labelOf = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** The user's support requests, with a button to send a new one. */
export function SupportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setTickets(await listTickets());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // Reload whenever the screen comes back into view, so a ticket just sent shows up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={tickets ?? []}
      keyExtractor={(t) => String(t.id)}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      ListHeaderComponent={
        <View style={styles.head}>
          <Text style={styles.intro}>
            Something not working or have a question? Send us a message and we will answer by email.
          </Text>
          <Pressable
            style={styles.newButton}
            onPress={() => router.push('/new-ticket')}
            accessibilityRole="button"
          >
            <Ionicons name="create-outline" size={20} color={colors.onAccent} />
            <Text style={styles.newText}>New request</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push({ pathname: '/ticket', params: { id: String(item.id) } })}
          accessibilityRole="button"
        >
          <View style={styles.cardTop}>
            <Text style={styles.meta}>
              #{item.id} · {formatDate(item.created_at)}
            </Text>
            <View style={[styles.pill, item.status === 'open' ? styles.pillOpen : styles.pillClosed]}>
              <Text
                style={[styles.pillText, { color: item.status === 'open' ? colors.accent : colors.muted }]}
              >
                {item.status === 'open' ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
          <Text style={styles.subject}>{item.subject}</Text>
          <Text style={styles.meta}>{labelOf(item.category)}</Text>
        </Pressable>
      )}
      ListEmptyComponent={
        tickets === null && !failed ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : (
          <Text style={styles.empty}>
            {failed
              ? 'Could not load your requests. Pull down to try again.'
              : 'You have not sent any requests yet.'}
          </Text>
        )
      }
    />
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, gap: 12, flexGrow: 1 },
    head: { gap: 14, marginBottom: 8 },
    intro: { color: c.muted, fontSize: 15, lineHeight: 22 },
    newButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.accent,
      borderRadius: 14,
      paddingVertical: 14,
    },
    newText: { color: c.onAccent, fontSize: 16, fontWeight: '700' },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: 16,
      gap: 4,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    meta: { color: c.muted, fontSize: 12, fontWeight: '600' },
    subject: { color: c.text, fontSize: 16, fontWeight: '700' },
    pill: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
    pillOpen: { backgroundColor: c.accentSoft },
    pillClosed: { backgroundColor: c.border },
    pillText: { fontSize: 12, fontWeight: '800' },
    empty: { color: c.muted, fontSize: 14, textAlign: 'center', marginTop: 24 },
  });
