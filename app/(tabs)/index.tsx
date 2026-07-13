import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAudioProcessor } from '../../src/hooks/useAudioProcessor';
import { AnalyticalView } from '../../src/components/AnalyticalView';

export default function LinguaEarScreen() {
  const router = useRouter();
  const {
    status,
    isRecording,
    heard,
    analysis,
    recordingRef,
    resetApp,
    startRecording,
    stopRecording
  } = useAudioProcessor();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LinguaEar</Text>
      <Text style={styles.subtitle}>Your AI German Companion</Text>

      <TouchableOpacity 
        style={[styles.button, isRecording && styles.buttonRecording]}
        onPress={isRecording ? () => recordingRef.current && stopRecording(recordingRef.current) : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '🔴 Listening (Tap to Stop)...' : status}
        </Text>
      </TouchableOpacity>

      {heard && (
        <View style={styles.card}>
          <View style={styles.cardHeader}> 
            <Text style={styles.label}>📝 System Alert:</Text>
            <TouchableOpacity onPress={resetApp}>
              <Text style={styles.resetButton}>🔄 Reset</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.content}>Analysis Completed</Text>
        </View>
      )}

      {analysis.explanation ? (
        <AnalyticalView analysis={analysis} styles={styles} />
      ) : null}

      <TouchableOpacity style={styles.privacyLink} onPress={() => router.push('/privacy')}>
        <Text style={styles.privacyText}>Privacy Policy & Impressum</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Global Styles remain here or can be moved to src/styles/
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0a0a0a', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888888', marginBottom: 40 },
  button: { backgroundColor: '#2563eb', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 50, marginBottom: 30, width: '90%', alignItems: 'center' },
  buttonRecording: { backgroundColor: '#dc2626' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  card: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, width: '100%', marginBottom: 16 },
  label: { color: '#888888', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  content: { color: '#ffffff', fontSize: 16, lineHeight: 24 },
  privacyLink: { marginTop: 40, padding: 10 },
  privacyText: { color: '#555555', fontSize: 12, textDecorationLine: 'underline' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resetButton: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
  secondaryButton: { backgroundColor: '#1e3a5f', paddingVertical: 14, borderRadius: 12, marginBottom: 12, alignItems: 'center', width: '100%' },
  quizButton: { backgroundColor: '#2d1b69', paddingVertical: 14, borderRadius: 12, marginBottom: 12, alignItems: 'center', width: '100%' },
  secondaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' }
});