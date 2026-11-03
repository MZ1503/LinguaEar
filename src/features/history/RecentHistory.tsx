import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { HistoryCard } from './HistoryCard';
import { useDeleteConfirm } from './useDeleteConfirm';
import { useHistory } from './useHistory';

const RECENT_COUNT = 5;

/** Latest saved phrases for the home screen, with a link to the full list. */
export function RecentHistory() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { items, status, hasMore, refresh } = useHistory();
  const confirmDelete = useDeleteConfirm();
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    refresh();
    // Load once when the home screen mounts; new saves are added to the list directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recent = items.slice(0, RECENT_COUNT);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="time-outline" size={18} color={colors.muted} />
          <Text style={styles.title}>History</Text>
        </View>
        {(items.length > RECENT_COUNT || hasMore) && (
          <Pressable onPress={() => router.push('/history')} hitSlop={8} accessibilityRole="button">
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        )}
      </View>

      {recent.length === 0 ? (
        status === 'loading' ? (
          <ActivityIndicator color={colors.accent} style={styles.loading} />
        ) : (
          <Text style={styles.empty}>
            {status === 'failed' ? 'Could not load your history.' : 'Phrases you save will appear here.'}
          </Text>
        )
      ) : (
        <View style={styles.list}>
          {recent.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              onDelete={() => confirmDelete(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { marginTop: 28 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    viewAll: { color: c.accent, fontSize: 13, fontWeight: '600' },
    list: { gap: 12 },
    loading: { marginVertical: 16 },
    empty: { color: c.muted, fontSize: 14, lineHeight: 21 },
  });
