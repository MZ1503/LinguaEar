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

import { deleteAccount, useAuth } from '@/src/features/auth';
import type { Palette } from '@/src/shared/theme/brand';
import { useTheme } from '@/src/shared/theme/useTheme';
import { TextField } from '@/src/shared/ui/TextField';
import { useAlert } from '@/src/shared/ui/AlertProvider';

/** Permanent account deletion, confirmed with the password. */
export function DeleteAccountScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { logout } = useAuth();
  const alert = useAlert();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      await deleteAccount(password);
      // The account is gone on the server; clear the local session. The root layout then shows the login screen.
      await logout().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  const confirm = () => {
    if (!password) return setError('Enter your password to confirm.');
    alert.show({
      type: 'danger',
      icon: 'trash',
      title: 'Delete your account?',
      message: 'This cannot be undone. Your account and all its data will be removed.',
      buttons: [
        { text: 'Delete my account', style: 'destructive', onPress: run },
        { text: 'Keep my account', style: 'cancel' },
      ],
    });
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Delete your account</Text>
        <Text style={styles.text}>This permanently removes:</Text>
        <Text style={styles.bullet}>• your profile and login</Text>
        <Text style={styles.bullet}>• your saved phrases, quiz results and points</Text>
        <Text style={styles.bullet}>• your support requests and email preferences</Text>
        <Text style={[styles.text, { marginTop: 12 }]}>
          If you have a subscription, it is cancelled first, so you will not be charged again. Payment records
          may be kept where tax law requires it.
        </Text>

        <TextField
          label="Your password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError('');
          }}
          secureTextEntry
          autoComplete="current-password"
          error={error}
        />

        <Pressable
          onPress={confirm}
          disabled={busy}
          style={[styles.button, busy && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Delete my account</Text>
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
    title: { color: c.text, fontSize: 24, fontWeight: '800', marginBottom: 12 },
    text: { color: c.muted, fontSize: 15, lineHeight: 22, marginBottom: 6 },
    bullet: { color: c.text, fontSize: 15, lineHeight: 24 },
    button: {
      backgroundColor: c.error,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 4,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
