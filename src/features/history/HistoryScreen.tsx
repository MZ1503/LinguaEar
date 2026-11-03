import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { HistoryCard } from './HistoryCard';
import { useDeleteConfirm } from './useDeleteConfirm';
import { useHistory } from './useHistory';

/** Full list of saved phrases, with paging. */
export function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { items, status, hasMore, refresh, loadMore } = useHistory();
  const confirmDelete = useDeleteConfirm();
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    refresh();
    // Load once on open; pull-to-refresh handles later updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(i) => String(i.id)}
      renderItem={({ item }) => (
        <HistoryCard
          item={item}
          open={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          onDelete={() => confirmDelete(item)}
        />
      )}
      onRefresh={refresh}
      refreshing={status === 'loading' && items.length === 0}
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        status === 'loading' && items.length > 0 ? <ActivityIndicator color={colors.accent} /> : undefined
      }
      ListEmptyComponent={
        status === 'loading' ? undefined : (
          <View style={styles.empty}>
            <Ionicons
              name={status === 'failed' ? 'cloud-offline-outline' : 'bookmark-outline'}
              size={40}
              color={colors.muted}
            />
            <Text style={styles.emptyTitle}>
              {status === 'failed' ? 'Could not load your phrases' : 'Nothing saved yet'}
            </Text>
            <Text style={styles.emptyText}>
              {status === 'failed'
                ? 'Check your connection and pull down to try again.'
                : 'Tap Save to history under a result on the home screen and it will show up here.'}
            </Text>
          </View>
        )
      }
    />
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, gap: 12, flexGrow: 1 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
    emptyTitle: { color: c.text, fontSize: 18, fontWeight: '700' },
    emptyText: { color: c.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  });
