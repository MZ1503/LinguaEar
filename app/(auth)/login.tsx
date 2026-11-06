import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth';
import { authColors, authStyles as s } from '@/src/features/auth/authStyles';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(email, password, rememberMe);
      // The root layout's route guard moves us into the app.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Image source={require('@/assets/images/ear-logo.png')} style={s.logo} resizeMode="contain" />
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Log in to keep practising</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={authColors.muted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor={authColors.muted}
            secureTextEntry
            autoComplete="current-password"
            onSubmitEditing={submit}
          />

          <TouchableOpacity
            style={{ alignSelf: 'flex-end', marginTop: -8, marginBottom: 14 }}
            onPress={() => router.push({ pathname: '/forgot-password', params: { email: email.trim() } })}
            accessibilityRole="button">
            <Text style={s.footerLink}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
            onPress={() => setRememberMe((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberMe }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: rememberMe ? authColors.accent : authColors.border,
                backgroundColor: rememberMe ? authColors.accent : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              {rememberMe && <Text style={{ color: authColors.bg, fontWeight: 'bold', fontSize: 14 }}>✓</Text>}
            </View>
            <Text style={s.footerText}>Remember me</Text>
          </TouchableOpacity>

          {!!error && <Text style={s.formError}>{error}</Text>}

          <TouchableOpacity style={[s.button, busy && s.buttonDisabled]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color={authColors.bg} /> : <Text style={s.buttonText}>Log in</Text>}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>New here? </Text>
            <Link href="./register" style={s.footerLink}>
              Create an account
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
