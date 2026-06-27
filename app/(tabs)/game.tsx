import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

interface Scenario {
  id: string;
  title: string;
  aiStart: string;
  context: string;
}

// Game Scenarios Configuration Array
const SCENARIOS: Scenario[] = [
  { id: 'cafe', title: '☕ Cafe Order', aiStart: 'Hallo! Was möchten Sie trinken?', context: 'You are a waiter at a German cafe. The user wants to order something.' },
  { id: 'airport', title: '✈️ Airport Check-in', aiStart: 'Guten Tag. Wohin fliegen Sie heute?', context: 'You are an airport check-in agent. Ask the user for their passport or destination.' },
  { id: 'taxi', title: '🚕 Taxi Ride', aiStart: 'Hallo, wohin soll es gehen?', context: 'You are a taxi driver in Berlin. Ask the user where they want to go.' }
];

export default function LinguaEarGame() {
  const router = useRouter();
  const recordingTimeoutRef = useRef<any>(null);

  // TypeScript Optimized States
  const [currentScenario, setCurrentScenario] = useState<Scenario>(SCENARIOS[0]);
  const [aiPrompt, setAiPrompt] = useState<string>(SCENARIOS[0].aiStart);
  const [status, setStatus] = useState<string>('Your turn to speak!');
  const [heard, setHeard] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [score, setScore] = useState<number>(0); 
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    };
  }, []);

  // Change Scenario Game Level Engine
  const switchScenario = (scenario: Scenario) => {
    setCurrentScenario(scenario);
    setAiPrompt(scenario.aiStart);
    setHeard('');
    setFeedback('');
    setStatus('New Level: Speak now!');
  };

  async function startRecording() {
    try {
      setStatus('🎤 Recording your reply...');
      setIsRecording(true);
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);

      recordingTimeoutRef.current = setTimeout(() => stopRecording(newRecording), 10000);
    } catch (err) {
      Alert.alert('Error', 'Microphone access needed');
      setIsRecording(false);
    }
  }

  async function stopRecording(activeRecording?: any) {
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    const currentRecording = activeRecording || recording;
    if (!currentRecording) {
      setIsRecording(false);
      return;
    }

    try {
      setStatus('⏳ Groq processing audio...');
      setIsRecording(false);
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      setRecording(null);

      if (uri) await sendToGroqWhisper(uri);
    } catch (err) {
      setStatus('Try again!');
    }
  }

  // 1. STT Layer (Groq Whisper Integration)
  async function sendToGroqWhisper(uri: string) {
    try {
      const formData = new FormData();
      formData.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);
      formData.append('model', 'whisper-large-v3'); 

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqApiKey}` },
        body: formData,
      });

      const data = await response.json();
      if (data.text) {
        setHeard(data.text);
        await getGameFeedback(data.text);
      }
    } catch (error) {
      setStatus('Audio Error');
    }
  }

  // 2. Dynamic LLM Evaluation (Groq Gemma 2 System)
  async function getGameFeedback(userText: string) {
    try {
      setStatus('🧠 AI Evaluation...');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqApiKey}` },
        body: JSON.stringify({
          model: 'gemma2-9b-it',
          messages: [
            {
              role: 'system',
              content: `You are a game controller for a German learning app. Context: ${currentScenario.context}. AI said previously: "${aiPrompt}". Evaluate the user's response for grammar and context validity. Give a score from 10 to 100. format your output exactly like this:
              Grammar Check: [Short review]
              Score: [Number]
              Next AI Response: [Your next natural continuation in German]`
            },
            { role: 'user', content: userText }
          ],
        }),
      });

      const aiData = await response.json();
      const aiResponse = aiData.choices[0].message.content;

      setFeedback(aiResponse);
      const scoreMatch = aiResponse.match(/Score:\s*(\d+)/);
      if (scoreMatch) {
        const roundScore = parseInt(scoreMatch[1]);
        if (!isNaN(roundScore)) setScore(prev => prev + roundScore);
      }

      const nextPromptMatch = aiResponse.match(/Next AI Response:\s*(.*)/);
      if (nextPromptMatch) setAiPrompt(nextPromptMatch[1]);

      setStatus('Your turn again!');
    } catch (error) {
      setStatus('Analysis Error');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏆 Total Score: {score}</Text>
      
      {/* Dynamic Scenario Chips */}
      <View style={styles.badgeContainer}>
        {SCENARIOS.map(s => (
          <TouchableOpacity key={s.id} style={[styles.chip, currentScenario.id === s.id && styles.activeChip]} onPress={() => switchScenario(s)}>
            <Text style={styles.chipText}>{s.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🤖 AI Companion Says:</Text>
        <Text style={styles.promptText}>{aiPrompt}</Text>
      </View>

      {heard !== '' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✍️ You Said:</Text>
          <Text style={styles.text}>{heard}</Text>
        </View>
      )}

      {feedback !== '' && (
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}

      <Text style={styles.status}>{status}</Text>

      <TouchableOpacity style={[styles.micButton, isRecording && styles.recordingButton]} onPress={isRecording ? () => stopRecording(recording) : startRecording}>
        <Text style={styles.buttonText}>{isRecording ? '🛑 STOP' : '🎤 REPLY IN GERMAN'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#121212', padding: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', marginBottom: 20 },
  badgeContainer: { flexDirection: 'row', marginBottom: 20 },
  chip: { padding: 10, backgroundColor: '#222', borderRadius: 20, marginHorizontal: 5 },
  activeChip: { backgroundColor: '#007AFF' },
  chipText: { color: '#fff', fontWeight: 'bold' },
  card: { width: '100%', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, marginBottom: 15 },
  feedbackCard: { width: '100%', backgroundColor: '#2A2A2A', padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#4CD964', marginBottom: 15 },
  cardTitle: { color: '#8E8E93', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  promptText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  text: { color: '#fff', fontSize: 16 },
  feedbackText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  status: { color: '#007AFF', marginVertical: 15, fontWeight: '600' },
  micButton: { width: '100%', padding: 18, backgroundColor: '#007AFF', borderRadius: 30, alignItems: 'center' },
  recordingButton: { backgroundColor: '#FF3B30' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});