import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';

import { DEFAULT_FILTER, isFiltered, sameFilter } from './historyFilter';
import type { HistoryFilter, RangeFilter, SourceFilter } from './historyFilter';
import { useHistory } from './useHistory';

const SOURCES: { id: SourceFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'speech', label: 'Speak', icon: 'mic-outline' },
  { id: 'scan', label: 'Scan', icon: 'camera-outline' },
];

const RANGES: { id: RangeFilter; label: string }[] = [
  { id: 'all', label: 'Any date' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'Last 30 days' },
];

/** A filter icon (with a count when filters are on) that opens a popup to choose type and date. */
export function HistoryFilterButton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { filter, setFilter } = useHistory();

  const [open, setOpen] = useState(false);
  // Choices are held here until Apply, so closing the popup leaves the list as it was.
  const [draft, setDraft] = useState<HistoryFilter>(filter);

  const activeCount = (filter.source !== 'all' ? 1 : 0) + (filter.range !== 'all' ? 1 : 0);

  const show = () => {
    setDraft(filter);
    setOpen(true);
  };

  const apply = () => {
    setOpen(false);
    if (!sameFilter(draft, filter)) setFilter(draft);
  };

  const chip = (
    active: boolean,
    label: string,
    onPress: () => void,
    icon?: keyof typeof Ionicons.glyphMap,
  ) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon && <Ionicons name={icon} size={15} color={active ? colors.accent : colors.muted} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <>
      <Pressable
        onPress={show}
        hitSlop={8}
        style={[styles.button, isFiltered(filter) && styles.buttonActive]}
        accessibilityRole="button"
        accessibilityLabel={activeCount ? `Filter, ${activeCount} active` : 'Filter'}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={isFiltered(filter) ? colors.accent : colors.muted}
        />
        {activeCount > 0 && (
          <View style={styles.count}>
            <Text style={styles.countText}>{activeCount}</Text>
          </View>
        )}
      </Pressable>

      <Modal
        transparent
        animationType="fade"
        visible={open}
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close filters"
          />
          <View style={styles.card} accessibilityViewIsModal>
            <View style={styles.head}>
              <Text style={styles.title}>Filter history</Text>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.chips}>
              {SOURCES.map((s) =>
                chip(draft.source === s.id, s.label, () => setDraft({ ...draft, source: s.id }), s.icon),
              )}
            </View>

            <Text style={styles.label}>Date</Text>
            <View style={styles.chips}>
              {RANGES.map((r) =>
                chip(draft.range === r.id, r.label, () => setDraft({ ...draft, range: r.id })),
              )}
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => setDraft(DEFAULT_FILTER)}
                style={[styles.action, styles.actionQuiet]}
                accessibilityRole="button"
              >
                <Text style={[styles.actionText, { color: colors.text }]}>Reset</Text>
              </Pressable>
              <Pressable
                onPress={apply}
                style={[styles.action, styles.actionMain]}
                accessibilityRole="button"
              >
                <Text style={styles.actionText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    button: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    buttonActive: { borderColor: c.accent, backgroundColor: c.accentSoft },
    count: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 17,
      height: 17,
      borderRadius: 9,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.accent,
    },
    countText: { color: c.onAccent, fontSize: 10, fontWeight: '800' },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
    },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    title: { color: c.text, fontSize: 19, fontWeight: '700' },
    label: {
      color: c.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 16,
      marginBottom: 8,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    chipActive: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipText: { color: c.muted, fontSize: 14, fontWeight: '600' },
    chipTextActive: { color: c.accent },
    actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
    action: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    actionQuiet: { borderWidth: 1, borderColor: c.border },
    actionMain: { backgroundColor: c.accent },
    actionText: { color: c.onAccent, fontSize: 15, fontWeight: '700' },
  });
