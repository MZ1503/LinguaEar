import { Link } from 'expo-router';
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

import { useAuth } from '@/src/store/authStore';
import { authColors, authStyles as s } from '@/src/styles/authStyles';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      await login(email, password);
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
