import { StyleSheet } from 'react-native';

export const authColors = {
  bg: '#0b0f19',
  card: '#151b2b',
  border: '#252d42',
  accent: '#00d2ff',
  text: '#ffffff',
  muted: '#8b93a7',
  error: '#ff6b6b',
};

export const authStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: authColors.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 84, height: 84, alignSelf: 'center', marginBottom: 20 },
  title: { color: authColors.text, fontSize: 30, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: authColors.muted, fontSize: 15, textAlign: 'center', marginTop: 6, marginBottom: 28 },
  label: { color: authColors.muted, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: authColors.card,
    borderWidth: 1,
    borderColor: authColors.border,
    borderRadius: 14,
    color: authColors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  inputError: { borderColor: authColors.error },
  error: { color: authColors.error, fontSize: 13, marginTop: -8, marginBottom: 14 },
  formError: { color: authColors.error, fontSize: 14, textAlign: 'center', marginBottom: 14 },
  button: {
    backgroundColor: authColors.accent,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: authColors.bg, fontSize: 17, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: authColors.muted, fontSize: 15 },
  footerLink: { color: authColors.accent, fontSize: 15, fontWeight: '600' },
});
