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
} from 'react-native';

import { useAuth } from '@/src/features/auth';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { TextField } from '@/src/shared/ui/TextField';
import { useAlert } from '@/src/shared/ui/AlertProvider';

type Errors = { current?: string; next?: string; confirm?: string };

export function ChangePasswordScreen() {
  const router = useRouter();
  const alert = useAlert();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { changePassword } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!current) e.current = 'Enter your current password.';
    if (next.length < 8) e.next = 'Use at least 8 characters.';
    else if (next === current) e.next = 'Choose a password different from the current one.';
    if (confirm !== next) e.confirm = 'Passwords do not match.';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    setFormError('');
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      await changePassword(current, next);
      alert.success('Password changed', 'Your other devices have been signed out.', () => router.back());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          error={errors.current}
          secureTextEntry
          autoComplete="current-password"
        />
        <TextField
          label="New password"
          value={next}
          onChangeText={setNext}
          error={errors.next}
          hint="At least 8 characters."
          secureTextEntry
          autoComplete="new-password"
        />
        <TextField
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={submit}
        />

        {!!formError && <Text style={styles.formError}>{formError}</Text>}

        <Pressable
          onPress={submit}
          disabled={busy}
          style={[styles.button, busy && styles.buttonDisabled]}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.buttonText}>Update password</Text>
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
    formError: { color: c.error, fontSize: 14, marginBottom: 12 },
    button: {
      backgroundColor: c.accent,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 4,
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: c.onAccent, fontSize: 16, fontWeight: '700' },
  });
