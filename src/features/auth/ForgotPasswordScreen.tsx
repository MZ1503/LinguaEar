import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestPasswordReset, resetPassword } from './authService';
import { authColors, authStyles as s } from './authStyles';
import { CODE_LENGTH, CodeInput } from './CodeInput';
import type { CodeInputHandle } from './CodeInput';
import { useAlert } from '@/src/shared/ui/AlertProvider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;

/** Two steps: ask for a code by email, then enter the code with a new password. */
export function ForgotPasswordScreen() {
  const router = useRouter();
  const alert = useAlert();
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const codeInput = useRef<CodeInputHandle>(null);

  // One tick per second while the resend button is cooling down.
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const sendCode = async (resend = false) => {
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await requestPasswordReset(email);
      setWait(RESEND_SECONDS);
      setNotice(resend ? 'If that email has an account, a new code is on its way.' : '');
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (code.length !== CODE_LENGTH) return setError('Enter the 6-digit code from the email.');
    if (password.length < 8) return setError('Use at least 8 characters for the new password.');
    if (password !== confirm) return setError('The passwords do not match.');

    setBusy(true);
    setError('');
    try {
      await resetPassword(email, code, password);
      alert.success('Password updated', 'Log in with your new password.', () =>
        router.replace('/(auth)/login'),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setCode('');
      codeInput.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Image source={require('@/assets/images/ear-logo.png')} style={s.logo} resizeMode="contain" />

          {step === 'email' ? (
            <>
              <Text style={s.title}>Forgot password?</Text>
              <Text style={s.subtitle}>Enter your email and we will send you a 6-digit code.</Text>

              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError('');
                }}
                placeholder="you@example.com"
                placeholderTextColor={authColors.muted}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                autoFocus
                onSubmitEditing={() => sendCode()}
              />

              {!!error && <Text style={s.formError}>{error}</Text>}

              <Pressable
                style={[s.button, busy && s.buttonDisabled]}
                onPress={() => sendCode()}
                disabled={busy}
                accessibilityRole="button"
              >
                {busy ? (
                  <ActivityIndicator color={authColors.bg} />
                ) : (
                  <Text style={s.buttonText}>Send code</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.title}>Reset password</Text>
              <Text style={s.subtitle}>
                If {email.trim()} has an account, we sent it a 6-digit code. Enter it below with your new
                password.
              </Text>

              <CodeInput
                ref={codeInput}
                value={code}
                onChange={(digits) => {
                  setCode(digits);
                  setError('');
                }}
                error={!!error}
                disabled={busy}
                autoFocus
              />

              <Text style={s.label}>New password</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError('');
                }}
                placeholder="At least 8 characters"
                placeholderTextColor={authColors.muted}
                secureTextEntry
                autoComplete="new-password"
              />

              <Text style={s.label}>Confirm new password</Text>
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={(v) => {
                  setConfirm(v);
                  setError('');
                }}
                placeholder="Repeat the password"
                placeholderTextColor={authColors.muted}
                secureTextEntry
                autoComplete="new-password"
                onSubmitEditing={submit}
              />

              {!!error && <Text style={s.formError}>{error}</Text>}
              {!error && !!notice && <Text style={styles.notice}>{notice}</Text>}

              <Pressable
                style={[s.button, busy && s.buttonDisabled]}
                onPress={submit}
                disabled={busy}
                accessibilityRole="button"
              >
                {busy ? (
                  <ActivityIndicator color={authColors.bg} />
                ) : (
                  <Text style={s.buttonText}>Reset password</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => sendCode(true)}
                disabled={wait > 0 || busy}
                style={styles.link}
                accessibilityRole="button"
              >
                <Text style={[styles.linkText, (wait > 0 || busy) && { opacity: 0.5 }]}>
                  {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
                style={styles.link}
                accessibilityRole="button"
              >
                <Text style={[styles.linkText, { color: authColors.muted }]}>Use a different email</Text>
              </Pressable>
            </>
          )}

          <Pressable onPress={() => router.back()} style={styles.link} accessibilityRole="button">
            <Text style={[styles.linkText, { color: authColors.muted }]}>Back to log in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notice: { color: authColors.muted, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  link: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: authColors.accent, fontSize: 15, fontWeight: '600' },
});
