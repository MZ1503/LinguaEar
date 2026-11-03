import { useState, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

interface GermanArticle {
  word: string;
  gender: 'der' | 'die' | 'das';
}

const LOADING_MESSAGES = [
  '🎤 Recording captured...',
  '📝 Transcribing speech...',
  '🧠 Analyzing grammar...',
  '💡 Creating quiz & breakdown...',
];

const OPENAI_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const OPENAI_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const openAiApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export function useNormalAudioProcessor(
  onTranscriptionSuccess?: (text: string) => void,
  onTranscriptionError?: (err: string) => void
) {
  const [status, setStatus] = useState('Speak English or German');
  const [isRecording, setIsRecording] = useState(false);
  const [heard, setHeard] = useState('');

  const [analysis, setAnalysis] = useState({
    explanation: '',
    tone: '',
    grammar: '',
    quiz: '',
    articles: [] as GermanArticle[],
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
    setAnalysis({ explanation: '', tone: '', grammar: '', quiz: '', articles: [] });
    setStatus('Speak English or German');
    setIsRecording(false);
  }

  async function startRecording() {
    if (isRecording || isProcessingRef.current) return;

    try {
      setStatus('🎤 Recording...');
      setIsRecording(true);

      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        throw new Error('Microphone permission denied');
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();

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
      if (!openAiApiKey) {
        throw new Error('Missing Groq API Key');
      }

      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1] || 'm4a';

      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: `audio/${fileType}`,
        name: `recording.${fileType}`,
      } as any);

      formData.append('model', 'whisper-large-v3');

      const whisperResponse = await fetch(OPENAI_WHISPER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        throw new Error('Whisper transcription failed');
      }

      const whisperData = await whisperResponse.json();
      const transcribedText = whisperData.text || '';

      if (!transcribedText) {
        throw new Error('No transcription text returned');
      }

      onTranscriptionSuccess?.(transcribedText);

      const systemPayload = `
        You are LinguaEar, an expert German language tutor.
        Analyze the user's German sentence and provide a helpful, word-by-word analysis.
        Be sure to highlight the correct German articles (der/die/das) clearly!
        
        IMPORTANT LANGUAGE RULES:
        - Write ALL explanations, grammar notes, tone descriptions, and quiz questions in ENGLISH.
        - Only the German words/phrases being taught (e.g., nouns, articles, example sentences) should remain in German.
        - Never write the explanation itself in German.

        Be sure to highlight the correct German articles (der/die/das) clearly!

        You MUST respond strictly in a valid JSON format with the following exact keys:
        {
          "explanation": "Break down the sentence word-by-word. Explain spelling, word order, and articles (der/die/das) gently.",
          "tone": "Briefly describe the tone (e.g., Friendly, Formal, Direct)",
          "grammar": "Explain the key grammatical rule used here (e.g., Akkusativ case, Verb position) in 2-3 sentences.",
          "quiz": "Provide 1 small multiple choice question or fill-in-the-blank question based on this sentence to test the user.",
          "articles": [
            { "word": "Noun (e.g., Tisch)", "gender": "der" }
          ]
        }
      `;

      const gptResponse = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: process.env.EXPO_PUBLIC_GROQ_MODEL,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPayload },
            { role: 'user', content: transcribedText },
          ],
        }),
      });

      if (!gptResponse.ok) {
        throw new Error('Groq analysis failed');
      }

      const gptData = await gptResponse.json();
      const evaluationText = gptData.choices[0].message.content;

      let evaluationJson = {
        explanation: '',
        tone: '',
        grammar: '',
        quiz: '',
        articles: [] as GermanArticle[],
      };
      try {
        evaluationJson = JSON.parse(evaluationText);
      } catch {
        evaluationJson.explanation = evaluationText;
      }

      clearInterval(interval);

      setHeard(transcribedText);
      setAnalysis({
        explanation: evaluationJson.explanation || '',
        tone: evaluationJson.tone || '',
        grammar: evaluationJson.grammar || '',
        quiz: evaluationJson.quiz || '',
        articles: evaluationJson.articles || [],
      });
      setStatus('Speak English or German');
    } catch (error) {
      clearInterval(interval);
      console.log('Detailed Groq Audio Pipeline Failure:', error);
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