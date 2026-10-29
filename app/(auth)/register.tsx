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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = { name?: string; email?: string; password?: string; confirm?: string };

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Enter your name.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address.';
    if (password.length < 8) e.password = 'Use at least 8 characters.';
    if (confirm !== password) e.confirm = 'Passwords do not match.';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    setFormError('');
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      await register(name, email, password);
      // The root layout's route guard sends new users to onboarding.
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    key: keyof Errors,
    props: React.ComponentProps<typeof TextInput> = {},
  ) => (
    <>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, errors[key] && s.inputError]}
        value={value}
        onChangeText={set}
        placeholderTextColor={authColors.muted}
        {...props}
      />
      {!!errors[key] && <Text style={s.error}>{errors[key]}</Text>}
    </>
  );

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Image source={require('@/assets/images/ear-logo.png')} style={s.logo} resizeMode="contain" />
          <Text style={s.title}>Create your account</Text>
          <Text style={s.subtitle}>Train your ear for real conversations</Text>

          {field('Name', name, setName, 'name', { placeholder: 'Your name', autoComplete: 'name' })}
          {field('Email', email, setEmail, 'email', {
            placeholder: 'you@example.com',
            autoCapitalize: 'none',
            autoComplete: 'email',
            keyboardType: 'email-address',
          })}
          {field('Password', password, setPassword, 'password', {
            placeholder: 'At least 8 characters',
            secureTextEntry: true,
            autoComplete: 'new-password',
          })}
          {field('Confirm password', confirm, setConfirm, 'confirm', {
            placeholder: 'Repeat your password',
            secureTextEntry: true,
            onSubmitEditing: submit,
          })}

          {!!formError && <Text style={s.formError}>{formError}</Text>}

          <TouchableOpacity style={[s.button, busy && s.buttonDisabled]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color={authColors.bg} /> : <Text style={s.buttonText}>Sign up</Text>}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <Link href="./login" style={s.footerLink}>
              Log in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
