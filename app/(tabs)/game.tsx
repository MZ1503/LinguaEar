import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useGermanSpeechRecognition } from '../../src/hooks/useGermanSpeechRecognition';
import { GERMAN_TEACHER_PROMPTS, OUTPUT_TOKENS_INSTRUCTION, LOADING_MESSAGES } from '../../src/constants/immigrationData';
import { styles } from '../../src/styles/gameStyles';

const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export default function GameModeHubScreen() {
  const [currentMode, setCurrentMode] = useState<string | null>(null); // 'immigration', 'cafe', or 'taxi'
  const [status, setStatus] = useState<string>('Select a level to start roleplaying!');
  const [score, setScore] = useState<number>(0);
  const [heard, setHeard] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Hardware voice engine connection
  const { startListening, stopListening } = useGermanSpeechRecognition(
    (text) => { setHeard(text); sendToGemma(text); },
    (err) => { setStatus(`Error: ${err}`); setIsRecording(false); }
  );

  async function toggleGameMicrophone() {
    if (!currentMode) return;
    try {
      if (isRecording) {
        setStatus('⏳ Transcribing your speech...');
        setIsRecording(false);
        if (Platform.OS !== 'web') await stopListening();
      } else {
        setStatus('🎤 Listening... Speak German!');
        setIsRecording(true);
        if (Platform.OS === 'web') {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.lang = 'de-DE';
            rec.onresult = (e: any) => { const text = e.results.transcript; setHeard(text); sendToGemma(text); };
            rec.start();
          } else { setStatus('Web audio not supported'); }
        } else { await startListening(); }
      }
    } catch { setIsRecording(false); }
  }

  async function sendToGemma(text: string) {
    if (!currentMode) return;
    let msgIdx = 0;
    const interval = setInterval(() => { if (msgIdx < LOADING_MESSAGES.length) { setStatus(LOADING_MESSAGES[msgIdx]); msgIdx++; } }, 1500);

    const levelPersona = GERMAN_TEACHER_PROMPTS[currentMode];
    const systemPayload = `${levelPersona}\n\n${OUTPUT_TOKENS_INSTRUCTION}`;

    try {
      // 🔑 CORRECT ENDPOINT UPDATED HERE:
      const response = await fetch('https://groq.com', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2-9b-it',
          messages: [{ role: 'system', content: systemPayload }, { role: 'user', content: `I just said: ${text}` }]
        })
      });

      const data = await response.json();
      clearInterval(interval);
      if (data.choices?.[0]?.message?.content) parseGameResponse(data.choices[0].message.content);
      setStatus(`Playing Level: ${currentMode.toUpperCase()}`);
    } catch { clearInterval(interval); setStatus('System Processing Error'); }
  }

  function parseGameResponse(response: string) {
    const lines = response.split('\n');
    const explanationLines: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^SCORE:/i.test(trimmed)) {
        const parsedScore = parseInt(trimmed.replace(/^SCORE:/i, '').trim());
        if (!isNaN(parsedScore)) setScore(prev => prev + parsedScore);
      } else if (/^(NEXT AI RESPONSE|AI RESPONSE):/i.test(trimmed)) {
        setAiPrompt(trimmed.replace(/^(NEXT AI RESPONSE|AI RESPONSE):/i, '').trim());
      } else if (!/^(TONE|GRAMMAR|QUIZ|WORDS|SCORE|NEXT)/i.test(trimmed)) {
        const cleanLine = trimmed.replace(/\*\*/g, '').replace(/\*/g, '').trim();
        if (cleanLine) explanationLines.push(cleanLine);
      }
    });
    setExplanation(explanationLines.join('\n').trim());
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LinguaEar 🎮</Text>
      <Text style={styles.subtitle}>Immigrant Game Mode Hub</Text>

      {!currentMode ? (
        <View style={{ width: '100%', gap: 15, marginTop: 10 }}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => { setCurrentMode('immigration'); setStatus('Level: Immigration active!'); setAiPrompt('Guten Tag. Zeigen Sie mir bitte Ihren Reisepass.'); }}>
            <Text style={styles.secondaryButtonText}>🏢 Immigration Office (Ausländerbehörde)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quizButton} onPress={() => { setCurrentMode('cafe'); setStatus('Level: Cafe active!'); setAiPrompt('Hallo! Was darf ich Ihnen heute bringen?'); }}>
            <Text style={styles.secondaryButtonText}>☕ Traditional German Café</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: '#15803d' }]} onPress={() => { setCurrentMode('taxi'); setStatus('Level: Taxi active!'); setAiPrompt('Moin! Wohin soll es denn gehen?'); }}>
            <Text style={styles.secondaryButtonText}>🚖 Taxi Ride Survival</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={styles.scoreBanner}><Text style={styles.scoreText}>🔥 Score: {score} XP</Text></View>
          <Text style={styles.subtitle}>{status}</Text>

          {aiPrompt && <View style={[styles.card, { borderLeftColor: '#4f46e5', borderLeftWidth: 5 }]}><Text style={styles.label}>Officer/Staff Prompt:</Text><Text style={styles.content}>{aiPrompt}</Text></View>}
          {heard && <View style={[styles.card, { borderLeftColor: '#10b981', borderLeftWidth: 5 }]}><Text style={styles.label}>You Attempted:</Text><Text style={styles.content}>{heard}</Text></View>}
          {explanation && <View style={[styles.card, { borderLeftColor: '#f59e0b', borderLeftWidth: 5 }]}><Text style={styles.label}>Feedback Analysis:</Text><Text style={styles.content}>{explanation}</Text></View>}

          <TouchableOpacity style={[styles.button, isRecording && styles.buttonRecording]} onPress={toggleGameMicrophone}>
            <Text style={styles.buttonText}>{isRecording ? '🛑 Stop Recording' : '🎤 Respond in German'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setCurrentMode(null); setAiPrompt(''); setHeard(''); setExplanation(''); setStatus('Select a level to start roleplaying!'); }}>
            <Text style={[styles.resetButton, { marginTop: 10, fontWeight: 'bold' }]}>⬅️ Back to Level Selection</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}