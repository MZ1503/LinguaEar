import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { useAlert } from '@/src/shared/ui/AlertProvider';
import { TextField } from '@/src/shared/ui/TextField';

import { fetchMyScenarioRequests, sendScenarioRequest } from './gameApi';
import type { ScenarioRequest } from './gameApi';

const STATUS_LABEL: Record<ScenarioRequest['status'], string> = {
  pending: 'In review',
  approved: 'Added',
  rejected: 'Not added',
};

/** Lets a player suggest a new practice scenario and shows what happened to earlier suggestions. */
export function ScenarioRequestScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const alert = useAlert();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<ScenarioRequest[]>([]);

  const load = useCallback(() => {
    fetchMyScenarioRequests().then(setMine).catch(() => {});
  }, []);
  useFocusEffect(load);

  const statusColor = (s: ScenarioRequest['status']) =>
    s === 'approved' ? '#10B981' : s === 'rejected' ? colors.muted : '#F59E0B';

  const submit = async () => {
    const e: typeof errors = {};
    if (title.trim().length < 3) e.title = 'Give it a short name (at least 3 characters).';
    if (description.trim().length < 10) e.description = 'Describe the situation in at least 10 characters.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      await sendScenarioRequest(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      load();
      alert.success('Suggestion sent', 'Thanks! We will review it and add it to the scenarios.');
    } catch (err) {
      alert.error('Could not send', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Missing a situation you need? Tell us where you want to practise, for example “Renting a flat” or “Calling
          the doctor”.
        </Text>
        <TextField label="Scenario" value={title} onChangeText={setTitle} error={errors.title} maxLength={80} />
        <TextField
          label="What happens?"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          multiline
          maxLength={500}
          style={styles.multiline}
        />
        <Pressable onPress={submit} disabled={busy} style={[styles.button, busy && { opacity: 0.6 }]} accessibilityRole="button">
          {busy ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.buttonText}>Send suggestion</Text>}
        </Pressable>

        {mine.length > 0 && (
          <View style={styles.list}>
            <Text style={styles.heading}>Your suggestions</Text>
            {mine.map((r) => (
              <View key={r.id} style={styles.item}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemTitle}>{r.title}</Text>
                  <Text style={[styles.status, { color: statusColor(r.status) }]}>{STATUS_LABEL[r.status]}</Text>
                </View>
                {!!r.admin_note && <Text style={styles.note}>{r.admin_note}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, gap: 14, paddingBottom: 40 },
    intro: { color: c.muted, fontSize: 14, lineHeight: 21 },
    multiline: { minHeight: 110, textAlignVertical: 'top' },
    button: { backgroundColor: c.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    buttonText: { color: c.onAccent, fontSize: 16, fontWeight: '700' },
    list: { gap: 10, marginTop: 14 },
    heading: { color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    item: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      gap: 4,
    },
    itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    itemTitle: { color: c.text, fontSize: 15, fontWeight: '600', flex: 1 },
    status: { fontSize: 12, fontWeight: '700' },
    note: { color: c.muted, fontSize: 13, lineHeight: 19 },
  });
