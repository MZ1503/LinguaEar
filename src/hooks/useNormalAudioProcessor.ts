import { useState, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';

interface GermanArticle {
    word: string;
    gender: 'der' | 'die' | 'das';
  }

const LOADING_MESSAGES = [
  '🎤 Recording captured...', 
  '📝 Transcribing speech...', 
  '🧠 Analyzing grammar...', 
  '💡 Creating quiz & breakdown...'
];

// OpenAI Configs
const OPENAI_WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const openAiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY; 

export function useNormalAudioProcessor(
  onTranscriptionSuccess?: (text: string) => void,
  onTranscriptionError?: (err: string) => void
) {
  const [status, setStatus] = useState('Speak English or German');
  const [isRecording, setIsRecording] = useState(false);
  const [heard, setHeard] = useState('');
  
  // Normal Mode State Structure
  const [analysis, setAnalysis] = useState({
    explanation: '',
    tone: '',
    grammar: '',
    quiz: '',
    articles: [] as GermanArticle[]
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  function resetApp() {
    setHeard('');
    setAnalysis({ explanation: '', tone: '', grammar: '', quiz: '',articles: [] });
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
      if (!openAiApiKey) {
        throw new Error("Missing OpenAI API Key");
      }

      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1] || 'm4a';

      formData.append('file', { 
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri, 
        type: `audio/${fileType}`, 
        name: `recording.${fileType}` 
      } as any);
      
      formData.append('model', 'whisper-1');

      // 1. Transcription using OpenAI Whisper
      const whisperResponse = await fetch(OPENAI_WHISPER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiApiKey}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
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

      // 2. Normal Mode prompt to OpenAI (GPT-4o-mini)
      const systemPayload = `
        You are LinguaEar, an expert German language tutor. 
        Analyze the user's German sentence and provide a helpful, word-by-word analysis.
        Be sure to highlight the correct German articles (der/die/das) clearly!
        
        
        You MUST respond strictly in a valid JSON format with the following exact keys:
        {
          "explanation": "Break down the sentence word-by-word. Explain spelling, word order, and articles (der/die/das) gently.",
          "tone": "Briefly describe the tone (e.g., Friendly, Formal, Direct)",
          "grammar": "Explain the key grammatical rule used here (e.g., Akkusativ case, Verb position) in 2-3 sentences.",
          "quiz": "Provide 1 small multiple choice question or fill-in-the-blank question based on this sentence to test the user."
          "articles": [
      { "word": "Noun (e.g., Tisch)", "gender": "der" }
    ]
        }
      `;

      const gptResponse = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' }, // Ensures strict JSON output
          messages: [
            { role: 'system', content: systemPayload },
            { role: 'user', content: transcribedText }
          ]
        })
      });

      if (!gptResponse.ok) {
        throw new Error("GPT analysis failed");
      }

      const gptData = await gptResponse.json();
      const evaluationText = gptData.choices[0].message.content;
      
      let evaluationJson = { explanation: '', tone: '', grammar: '', quiz: '', articles: [] as GermanArticle[] };
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
        articles: evaluationJson.articles || []
      });
      setStatus('Speak English or German');

    } catch (error) {
      clearInterval(interval);
      console.log("Detailed OpenAI Audio Pipeline Failure:", error);
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