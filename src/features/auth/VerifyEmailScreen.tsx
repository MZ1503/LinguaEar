import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authColors, authStyles as s } from './authStyles';
import { CODE_LENGTH, CodeInput } from './CodeInput';
import type { CodeInputHandle } from './CodeInput';
import { useAuth } from './useAuth';

/** Asks for the 6-digit code that was emailed after sign-up, and verifies it. */
export function VerifyEmailScreen() {
  const { user, verifyEmail, sendVerificationCode, logout } = useAuth();
  const input = useRef<CodeInputHandle>(null);

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [notice, setNotice] = useState('');

  // One tick per second while the resend button is cooling down.
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const requestCode = useCallback(
    async (manual: boolean) => {
      setError('');
      try {
        const result = await sendVerificationCode();
        setWait(result.retry_after);
        setNotice(
          result.sent
            ? 'A new code is on its way.'
            : manual
              ? 'A code was sent a moment ago. Please check your inbox.'
              : '',
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not send the code.');
      }
    },
    [sendVerificationCode],
  );

  // A code is sent at sign-up; this covers someone who signs in later without one. The server skips it if one is fresh.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestCode(false);
  }, [requestCode]);

  const submit = async (value: string) => {
    if (value.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError('');
    try {
      await verifyEmail(value);
      // The root layout moves on to onboarding once the user is verified.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setCode('');
      setBusy(false);
      input.current?.focus();
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Image source={require('@/assets/images/ear-logo.png')} style={s.logo} resizeMode="contain" />
          <Text style={s.title}>Check your email</Text>
          <Text style={s.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{user?.email}</Text>
          </Text>

          <CodeInput
            ref={input}
            value={code}
            onChange={(digits) => {
              setCode(digits);
              setError('');
            }}
            onComplete={submit}
            error={!!error}
            disabled={busy}
            autoFocus
          />

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!error && !!notice && <Text style={styles.notice}>{notice}</Text>}

          <Pressable
            style={[s.button, (busy || code.length !== CODE_LENGTH) && s.buttonDisabled]}
            onPress={() => submit(code)}
            disabled={busy || code.length !== CODE_LENGTH}
            accessibilityRole="button"
          >
            {busy ? <ActivityIndicator color={authColors.bg} /> : <Text style={s.buttonText}>Verify</Text>}
          </Pressable>

          <Pressable
            onPress={() => requestCode(true)}
            disabled={wait > 0 || busy}
            style={styles.link}
            accessibilityRole="button"
          >
            <Text style={[styles.linkText, (wait > 0 || busy) && { opacity: 0.5 }]}>
              {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
            </Text>
          </Pressable>

          <Text style={styles.hint}>
            Can&apos;t find it? Check your spam folder. The code expires in 10 minutes.
          </Text>

          <Pressable onPress={() => logout()} style={styles.link} accessibilityRole="button">
            <Text style={[styles.linkText, { color: authColors.muted }]}>Use a different account</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  email: { color: authColors.text, fontWeight: '700' },
  error: { color: authColors.error, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  notice: { color: authColors.muted, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  link: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: authColors.accent, fontSize: 15, fontWeight: '600' },
  hint: { color: authColors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 4 },
});
