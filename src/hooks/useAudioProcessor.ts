import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  AudioModule,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { fetchGroqEvaluation } from '../services/groqService';

const LOADING_MESSAGES = [
  '🎤 Recording captured...',
  '📝 Transcribing with Whisper...',
  '🧠 Llama-3 evaluating speech...',
  '💡 Formulating corrections...',
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

  const [analysis, setAnalysis] = useState({
    score: 0,
    corrections: [] as string[],
    betterGermanPhrase: '',
    nextOfficerLine: '',
  });

  // expo-audio recorder hook
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function resetApp() {
    setHeard('');
    setAnalysis({ score: 0, corrections: [], betterGermanPhrase: '', nextOfficerLine: '' });
    setStatus('Speak English or German');
    setIsRecording(false);
  }

  async function startRecording() {
    if (isRecording || isProcessingRef.current) return;

    try {
      setStatus('🎤 Recording...');
      setIsRecording(true);

      // Permissions
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        throw new Error('Microphone permission denied');
      }

      // Audio mode (recording + silent mode playback)
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare and start recording
      await recorder.prepareToRecordAsync();
      recorder.record();

      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 10000);
    } catch (err) {
      console.error('Start recording failed:', err);
      Alert.alert('Error', 'Microphone access needed');
      setStatus('Speak English or German');
      setIsRecording(false);
      onTranscriptionError?.('Microphone access denied');
    }
  }

  async function stopRecording() {
    if (!isRecording) return;

    try {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStatus('🔄 Processing...');
      setIsRecording(false);

      await recorder.stop();
      const uri = recorder.uri;

      if (uri) {
        isProcessingRef.current = true;
        await processSpeechOnBackend(uri);
      } else {
        throw new Error('No recording URI');
      }
    } catch (err) {
      console.error('Stop recording failed:', err);
      setStatus('Speak English or German');
      onTranscriptionError?.('Failed to stop recording');
    } finally {
      isProcessingRef.current = false;
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
      if (!groqApiKey) throw new Error('Missing Groq API Key');

      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1] || 'm4a';

      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: `audio/${fileType}`,
        name: `recording.${fileType}`,
      } as any);

      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'de');

      const whisperResponse = await fetch(GROQ_WHISPER_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqApiKey}` },
        body: formData,
      });

      if (!whisperResponse.ok) {
        const errDetails = await whisperResponse.text();
        console.log('Whisper API Error:', errDetails);
        throw new Error('Whisper transcription failed');
      }

      const whisperData = await whisperResponse.json();
      const transcribedText = whisperData.text || '';
      if (!transcribedText) throw new Error('No transcription text returned');

      onTranscriptionSuccess?.(transcribedText);

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
      console.log('LLM Raw Response:', evaluationText);

      let evaluationJson: any = { score: 0, corrections: [], better_german_phrase: '', next_officer_line: '' };
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
        nextOfficerLine: evaluationJson.next_officer_line || '',
      });
      setStatus('Speak English or German');
    } catch (error) {
      clearInterval(interval);
      console.log('Detailed Audio Pipeline Failure:', error);
      setStatus('Error — try again');
      onTranscriptionError?.('Failed to process audio');
    }
  }

  return {
    status,
    isRecording,
    heard,
    analysis,
    resetApp,
    startRecording,
    stopRecording,
  };
}