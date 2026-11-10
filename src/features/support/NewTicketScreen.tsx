import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { TextField } from '@/src/shared/ui/TextField';

import { CATEGORIES, createTicket } from './supportService';
import type { TicketCategory } from './supportService';
import { useAlert } from '@/src/shared/ui/AlertProvider';

/** Form for a new support request. */
export function NewTicketScreen() {
  const router = useRouter();
  const alert = useAlert();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [category, setCategory] = useState<TicketCategory>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    if (subject.trim().length < 3) e.subject = 'Give your request a short title (at least 3 characters).';
    if (message.trim().length < 10) e.message = 'Please describe it in at least 10 characters.';
    setErrors(e);
    setFormError('');
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      await createTicket(category, subject.trim(), message.trim());
      alert.success(
        'Request sent',
        'We will reply to your email address. A confirmation is on its way.',
        () => router.back(),
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>What is it about?</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={[styles.chip, category === c.id && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: category === c.id }}
            >
              <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        <TextField
          label="Title"
          value={subject}
          onChangeText={setSubject}
          error={errors.subject}
          maxLength={120}
          placeholder="Short summary"
        />
        <TextField
          label="Details"
          value={message}
          onChangeText={setMessage}
          error={errors.message}
          maxLength={2000}
          multiline
          placeholder="What happened? What did you expect?"
          style={styles.message}
          hint={`${message.length}/2000`}
        />

        {!!formError && <Text style={styles.formError}>{formError}</Text>}

        <Pressable
          onPress={submit}
          disabled={busy}
          style={[styles.button, busy && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.buttonText}>Send request</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 40 },
    label: { color: c.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    chipActive: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipText: { color: c.text, fontSize: 14, fontWeight: '600' },
    chipTextActive: { color: c.accent },
    message: { minHeight: 140, textAlignVertical: 'top' },
    formError: { color: c.error, fontSize: 14, marginBottom: 12 },
    button: { backgroundColor: c.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    buttonText: { color: c.onAccent, fontSize: 16, fontWeight: '700' },
  });
