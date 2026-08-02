import { useState, useRef, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Platform } from 'react-native';


import { useGameEngine } from '../../src/hooks/useGameEngine';
import { useAudioProcessor } from '../../src/hooks/useAudioProcessor';


import { styles } from '../../src/styles/gameStyles';

export default function GameMode() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  const game = useGameEngine();
  

  const { startRecording, stopRecording } = useAudioProcessor(
    (text: string) => { game.processUserSpeech(text); },
    (err: string) => { game.setStatus(`Error: ${err}`); setIsRecording(false); }
  );

  async function toggleGameMicrophone() {
    if (!game.currentMode) return;
    try {
      if (isRecording) {
        game.setStatus('⏳ Transcribing your speech...');
        setIsRecording(false);
        if (Platform.OS !== 'web') await stopRecording();
      } else {
        game.setStatus('🎤 Listening... Speak German!');
        setIsRecording(true);
        if (Platform.OS === 'web') {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.lang = 'de-DE';
            rec.onresult = (e: any) => { game.processUserSpeech(e.results[0][0].transcript); };
            rec.start();
          } else { game.setStatus('Web audio not supported'); }
        } else { await startRecording(); }
      }
    } catch { setIsRecording(false); }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LinguaEar 🎲</Text>
      <Text style={styles.subtitle}>Immigrant Game Mode Hub</Text>

      {!game.currentMode ? (
        <View style={{ width: '100%', gap: 15, marginTop: 10 }}>
          <TouchableOpacity style={styles.levelCard} onPress={() => { game.setCurrentMode('immigration'); game.setStatus('Level: Immigration active!'); game.setAiPrompt('Guten Tag. Zeigen Sie mir bitte Ihren Reisepass.'); }}>
            <Text style={styles.cardTitle}>🏢 Immigration Office (Ausländerbehörde)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.levelCard} onPress={() => { game.setCurrentMode('cafe'); game.setStatus('Level: Cafe active!'); game.setAiPrompt('Hallo! Was darf ich Ihnen heute bringen?'); }}>
            <Text style={styles.cardTitle}>☕ Traditional German Café</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.levelCard} onPress={() => { game.setCurrentMode('taxi'); game.setStatus('Level: Taxi active!'); game.setAiPrompt('Moin! Wohin soll es denn gehen?'); }}>
            <Text style={styles.cardTitle}>🚖 Taxi Ride Survival</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={styles.scoreBanner}><Text style={styles.scoreText}>🔥 Score: {Math.min(game.score, 100)} XP</Text></View>
          <Text style={styles.subtitle}>{game.status}</Text>

          {game.aiPrompt && <View style={[styles.card, { borderLeftColor: '#4f46e5', borderLeftWidth: 5 }]}><Text style={styles.label}>Officer/Staff Prompt:</Text><Text style={styles.content}>{game.aiPrompt}</Text></View>}
          {game.heard && <View style={[styles.card, { borderLeftColor: '#10b981', borderLeftWidth: 5 }]}><Text style={styles.label}>You Attempted:</Text><Text style={styles.content}>{game.heard}</Text></View>}
          {game.explanation && <View style={[styles.card, { borderLeftColor: '#f59e0b', borderLeftWidth: 5 }]}><Text style={styles.label}>Feedback Analysis:</Text><Text style={styles.content}>{game.explanation}</Text></View>}

          <TouchableOpacity style={[styles.button, isRecording && styles.buttonRecording]} onPress={toggleGameMicrophone}>
            <Text style={styles.buttonText}>{isRecording ? '🛑 Stop Recording' : '🎤 Respond in German'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={game.resetGame}>
            <Text style={[styles.resetButton, { marginTop: 10, fontWeight: 'bold' }]}>⬅️ Back to Level Selection</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}