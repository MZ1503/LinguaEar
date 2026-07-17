import { useState, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { fetchGroqEvaluation } from '../services/groqService'; 

const LOADING_MESSAGES = [
  '🎤 Recording captured...', 
  '📝 Transcribing with Whisper...', 
  '🧠 Llama-3 evaluating speech...', 
  '💡 Formulating corrections...'
];

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export function useAudioProcessor(
  onTranscriptionSuccess?: (text: string) => void,
  onTranscriptionError?: (err: string) => void
) {
  const [status, setStatus] = useState('Speak English or German');
  const [isRecording, setIsRecording] = useState(false);
  const [heard, setHeard] = useState('');
  
  // Naye Game Mode Schema ke hisab se state update
  const [analysis, setAnalysis] = useState({
    score: 0,
    corrections: [] as string[],
    betterGermanPhrase: '',
    nextOfficerLine: ''
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  function resetApp() {
    setHeard('');
    setAnalysis({ score: 0, corrections: [], betterGermanPhrase: '', nextOfficerLine: '' });
    setStatus('Speak English or German');
    setIsRecording(false);
    recordingRef.current = null;
  }

  async function startRecording() {
    try {
      setStatus('🎤 Recording...');
      setIsRecording(true);
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = newRecording;

      timeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, 10000);
    } catch {
      Alert.alert('Error', 'Microphone access needed');
      setStatus('Speak English or German');
      setIsRecording(false);
      if (onTranscriptionError) onTranscriptionError('Microphone access denied');
    }
  }

  async function stopRecording(rec?: Audio.Recording) {
    const activeRec = rec || recordingRef.current;
    if (!activeRec) return;

    try {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStatus('🔄 Processing...');
      setIsRecording(false);
      
      await activeRec.stopAndUnloadAsync();
      const uri = activeRec.getURI();
      recordingRef.current = null;

      if (uri) {
        await processSpeechOnBackend(uri);
      }
    } catch {
      setStatus('Speak English or German');
      setIsRecording(false);
      if (onTranscriptionError) onTranscriptionError('Failed to stop recording');
    }
  }

  async function processSpeechOnBackend(uri: string) {
    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < LOADING_MESSAGES.length) {
        setStatus(LOADING_MESSAGES[messageIndex]);
        messageIndex++;
      }
    }, 2000);

    try {
      if (!groqApiKey) {
        throw new Error("Missing Groq API Key");
      }

      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1] || 'm4a';

      // Expo file path fix for React Native FormData compatibility
      formData.append('file', { 
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri, 
        type: `audio/${fileType}`, 
        name: `recording.${fileType}` 
      } as any);
      
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'de');

      const whisperResponse = await fetch(GROQ_WHISPER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        const errDetails = await whisperResponse.text();
        console.log("Whisper API Error:", errDetails);
        throw new Error("Whisper translation failed");
      }

      const whisperData = await whisperResponse.json();
      const transcribedText = whisperData.text || '';

      if (!transcribedText) {
        throw new Error("No transcription text returned");
      }

      if (onTranscriptionSuccess) {
        onTranscriptionSuccess(transcribedText);
      }

      // Exact Game Mode prompt used in python script
      const systemPayload = `
        You are the backend engine for LinguaEar, a gamified German learning app for immigrants. 
        Analyze the user's imperfect German response. Provide constructive feedback to reduce anxiety. 
        You MUST respond strictly in a valid JSON format with the following exact keys:
        {
          "score": an integer from 0 to 100,
          "corrections": ["clear feedback in English explaining errors", "pronunciation and vocabulary tips"],
          "better_german_phrase": "How a native speaker would professionally reply in German",
          "next_officer_line": "The next logical challenge the officer will say in German to continue the game"
        }
      `;

      const evaluationText = await fetchGroqEvaluation(systemPayload, transcribedText);
      let evaluationJson = { score: 0, corrections: [] as string[], better_german_phrase: '', next_officer_line: '' };

      try {
        evaluationJson = JSON.parse(evaluationText);
      } catch {
        evaluationJson.better_german_phrase = evaluationText;
      }

      clearInterval(interval);

      setHeard(transcribedText);
      setAnalysis({
        score: evaluationJson.score || 0,
        corrections: evaluationJson.corrections || [],
        betterGermanPhrase: evaluationJson.better_german_phrase || '',
        nextOfficerLine: evaluationJson.next_officer_line || ''
      });
      setStatus('Speak English or German');

    } catch (error) {
      clearInterval(interval);
      console.log("Detailed Audio Pipeline Failure:", error);
      setStatus('Error — try again');
      if (onTranscriptionError) onTranscriptionError('Failed to process audio');
    }
  }

  return {
    status,
    isRecording,
    heard,
    analysis,
    recordingRef,
    resetApp,
    startRecording,
    stopRecording
  };
}