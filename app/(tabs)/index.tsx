import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';

const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export default function LinguaEar() {
  const router = useRouter();
  const recordingTimeoutRef = useRef<any>(null);

  // Core App States
  const [status, setStatus] = useState<string>('Speak English or German');
  const [heard, setHeard] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [tone, setTone] = useState<string>('');
  const [grammar, setGrammar] = useState<string>('');
  const [quiz, setQuiz] = useState<string>('');
  const [words, setWords] = useState<string>('');
  const [showGrammar, setShowGrammar] = useState<boolean>(false);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);

  // 🎮 Game & Layout Strategy States
  const [currentMode, setCurrentMode] = useState<string>('free'); // 'free' or 'cafe' or 'airport'
  const [score, setScore] = useState<number>(0);

  const loadingMessages = [
    '🎤 Heard you...',
    '📝 Transcribing...',
    '🧠 Analyzing grammar...',
    '💡 Almost ready...'
  ];

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    };
  }, []);

  function resetApp() {
    setHeard('');
    setExplanation('');
    setStatus(currentMode === 'free' ? 'Speak English or German' : `Level: ${currentMode.toUpperCase()} active!`);
    setIsRecording(false);
    setShowGrammar(false);
    setShowQuiz(false);
  }

  // Cross-Platform Audio Start
  async function startRecording() {
    try {
      setStatus('🎤 Recording...');
      setIsRecording(true);
      
      if (Platform.OS === 'web') {
        // Handle web browser streaming logic here if needed
        setStatus('Web Recording started...');
      } else {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        
        setRecording(newRecording);
        recordingTimeoutRef.current = setTimeout(() => stopRecording(newRecording), 10000);
      }
    } catch (err) {
      Alert.alert('Error', 'Microphone access needed');
      setStatus('Speak English or German');
      setIsRecording(false);
    }
  }

  // Cross-Platform Audio Stop
  async function stopRecording(activeRecording?: any) {
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);

    const currentRecording = activeRecording || recording;
    if (!currentRecording) {
      setIsRecording(false);
      return;
    }

    try {
      setStatus('⏳ Transcribing...');
      setIsRecording(false); 
      
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      setRecording(null);
      
      if (uri) await sendToGroqWhisper(uri);
    } catch (err) {
      setStatus('Error stopping audio');
    }
  }

  // Groq Whisper Transcription
  async function sendToGroqWhisper(uri: string) {
    try {
      const formData = new FormData();
      formData.append('file', { uri, type: 'audio/m4a', name: 'recording.m4a' } as any);
      formData.append('model', 'whisper-large-v3');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqApiKey}` },
        body: formData,
      });

      const data = await response.json();
      if (data.text) {
        setHeard(data.text);
        await sendToGemma(data.text);
      } else {
        setStatus('Nothing heard — try again');
      }
    } catch (err) {
      setStatus('Transcription Error');
    }
  }

  // Dual System Prompt Routing Strategy
  async function sendToGemma(text: string) {
    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < loadingMessages.length) {
        setStatus(loadingMessages[messageIndex]);
        messageIndex++;
      }
    }, 1500);

    // Dynamic Context Injection based on current mode selected by layout
    let dynamicSystemPrompt = '';
    if (currentMode === 'free') {
      dynamicSystemPrompt = `You are LinguaEar, a friendly German language teacher. Break down the user's sentence word by word, translation, sentence structure and grammar.`;
    } else {
      dynamicSystemPrompt = `You are a strict language game controller. Context scenario: ${currentMode}. Grade the user's response grammar accuracy and context fit. You MUST add a line anywhere at the end matching this strict token format: SCORE: [number between 10-100].`;
    }

    const fullSystemPrompt = `${dynamicSystemPrompt}
    Then add ONLY these tokens at the very end:
    TONE: [😊 Friendly / 😠 Aggressive / 😐 Neutral / 👔 Formal]
    GRAMMAR: [structure details]
    QUIZ: [quick check]
    WORDS: [vocab data]
    
    Keep it clear, short and mobile friendly structure.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemma2-9b-it',
          messages: [
            { role: 'system', content: fullSystemPrompt },
            { role: 'user', content: `I just heard: ${text}` }
          ]
        })
      });

      const data = await response.json();
      clearInterval(interval);
      
      if (data.choices && data.choices[0]) {
        parseResponse(data.choices[0].message.content);
      }
      setStatus(currentMode === 'free' ? 'Speak English or German' : `🏆 Game Round Cleared!`);
    } catch (err) {
      clearInterval(interval);
      setStatus('Processing Error');
    }
  }

  // Parser Layer supporting normal tokens + Game Scores
  function parseResponse(response: string) {
    const lines = response.split('\n');
    const explanationLines: string[] = [];
    
    lines.forEach(line => {
      if (line.startsWith('TONE:')) setTone(line.replace('TONE:', '').trim());
      else if (line.startsWith('GRAMMAR:')) setGrammar(line.replace('GRAMMAR:', '').trim());
      else if (line.startsWith('QUIZ:')) setQuiz(line.replace('QUIZ:', '').trim());
      else if (line.startsWith('WORDS:')) setWords(line.replace('WORDS:', '').trim());
      else if (line.startsWith('SCORE:')) {
        const parsedScore = parseInt(line.replace('SCORE:', '').trim());
        if (!isNaN(parsedScore)) setScore(prev => prev + parsedScore);
      }
      else if (!line.startsWith('TONE') && !line.startsWith('GRAMMAR') && !line.startsWith('QUIZ') && !line.startsWith('WORDS') && !line.startsWith('SCORE')) {
        const cleanLine = line.replace(/\*\*/g, '').replace(/\*/g, '').trim();
        if (cleanLine) explanationLines.push(cleanLine);
      }
    });
    setExplanation(explanationLines.join('\n').trim());
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LinguaEar</Text>
      <Text style={styles.subtitle}>Your AI German Companion</Text>
      
      {/* 🎮 Premium Mode Layout Switching Layer */}
      <View style={styles.tabWrapper}>
        {/* Normal Mode Button (Stays on this page) */}
        <TouchableOpacity 
          style={[styles.tabButton, styles.activeTab]} 
          onPress={() => { resetApp(); }}
        >
          <Text style={styles.tabText}>📝 Normal Mode</Text>
        </TouchableOpacity>
  
        {/* Game Mode Button (Instantly takes user to game screen) */}
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => { router.push('/(tabs)/game' as any); }}
        >
          <Text style={styles.tabText}>🎮 Game Level</Text>
        </TouchableOpacity>
      </View>
  
      {/* Big Blue Main Mic Button for Normal Translator */}
      <TouchableOpacity 
        style={[styles.button, isRecording && styles.buttonRecording]} 
        onPress={isRecording ? () => stopRecording() : startRecording}
      >
        <Text style={styles.buttonText}>{isRecording ? '🛑 Stop Recording...' : status}</Text>
      </TouchableOpacity>
  
      {/* Result Cards rendering dynamically */}
      {heard ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>📝 Output Heard:</Text>
            <TouchableOpacity onPress={resetApp}><Text style={styles.resetButton}>🔄 Reset</Text></TouchableOpacity>
          </View>
          <Text style={styles.content}>{heard}</Text>
        </View>
      ) : null}
  
      {explanation ? (
        <View style={{ width: '100%' }}>
          <View style={styles.card}>
            <Text style={styles.label}>💡 LinguaEar Analysis:</Text>
            <Text style={styles.content}>{explanation}</Text>
            <Text style={[styles.label, { marginTop: 12 }]}>😊 Tone Detected:</Text>
            <Text style={styles.content}>{tone}</Text>
          </View>
  
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowGrammar(!showGrammar)}>
            <Text style={styles.secondaryButtonText}>📚 {showGrammar ? 'Hide Grammar' : 'Learn More'}</Text>
          </TouchableOpacity>
          {showGrammar && (
            <View style={styles.card}><Text style={styles.content}>{grammar}</Text></View>
          )}
  
          <TouchableOpacity style={styles.quizButton} onPress={() => setShowQuiz(!showQuiz)}>
            <Text style={styles.secondaryButtonText}>❓ {showQuiz ? 'Hide Quiz' : 'Quiz Me!'}</Text>
          </TouchableOpacity>
          {showQuiz && (
            <View style={styles.card}><Text style={styles.content}>{quiz}</Text></View>
          )}
        </View>
      ) : null}
    </ScrollView>
  );

}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0a0a0a', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#888888', marginBottom: 25 },
  tabWrapper: { flexDirection: 'row', backgroundColor: '#161616', borderRadius: 25, padding: 4, marginBottom: 20, width: '90%' },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  activeTab: { backgroundColor: '#2563eb' },
  tabText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  scoreBanner: { backgroundColor: '#1e1b4b', padding: 12, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 15 },
  scoreText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 16 },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: { backgroundColor: '#1a1a1a', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  chipSelected: { backgroundColor: '#4f46e5' },
  chipTxt: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  button: { backgroundColor: '#2563eb', paddingVertical: 18, borderRadius: 50, marginBottom: 25, width: '85%', alignItems: 'center' },
  buttonRecording: { backgroundColor: '#dc2626' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  card: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, width: '100%', marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#888888', fontSize: 13 },
  resetButton: { color: '#2563eb' },
  content: { color: '#ffffff', fontSize: 15, lineHeight: 22 },
  secondaryButton: { backgroundColor: '#1e3a5f', paddingVertical: 12, borderRadius: 25, marginBottom: 10, alignItems: 'center' },
  quizButton: { backgroundColor: '#2d1b69', paddingVertical: 12, borderRadius: 25, marginBottom: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});