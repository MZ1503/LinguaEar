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

const USERNAME_RE = /^[A-Za-z0-9_.]{3,30}$/;

export function EditProfileScreen() {
  const router = useRouter();
  const alert = useAlert();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, saveProfile } = useAuth();

  const [username, setUsername] = useState(user?.name ?? '');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [errors, setErrors] = useState<{ username?: string }>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const changed =
    username.trim() !== user.name ||
    fullName.trim() !== (user.fullName ?? '') ||
    bio.trim() !== (user.bio ?? '');

  const submit = async () => {
    const usernameError = USERNAME_RE.test(username.trim())
      ? undefined
      : '3-30 characters: letters, numbers, _ or .';
    setErrors({ username: usernameError });
    setFormError('');
    if (usernameError) return;

    setBusy(true);
    try {
      await saveProfile({ username, fullName, bio });
      alert.success('Profile updated', 'Your changes have been saved.', () => router.back());
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
          label="Username"
          value={username}
          onChangeText={setUsername}
          error={errors.username}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
        />
        <TextField
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Optional"
          maxLength={100}
          autoComplete="name"
        />
        <TextField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us a little about yourself"
          maxLength={500}
          multiline
          style={styles.bio}
          hint={`${bio.length}/500`}
        />
        <TextField
          label="Email"
          value={user.email}
          editable={false}
          hint="Email changes need a confirmation link, so it can't be edited here yet."
        />

        {!!formError && <Text style={styles.formError}>{formError}</Text>}

        <Pressable
          onPress={submit}
          disabled={busy || !changed}
          style={[styles.button, (busy || !changed) && styles.buttonDisabled]}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.buttonText}>Save changes</Text>
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
    bio: { minHeight: 96, textAlignVertical: 'top' },
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
