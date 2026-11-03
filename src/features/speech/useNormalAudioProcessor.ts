import { useState, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

import { aiChat, aiTranscribe } from '@/src/features/ai';
import { sanitizeCompounds } from '@/src/shared/german/compounds';
import type { Compound } from '@/src/shared/german/compounds';
import { sanitizeQuiz } from '@/src/shared/german/quiz';
import type { QuizQuestion } from '@/src/shared/german/quiz';

interface GermanArticle {
  word: string;
  gender: 'der' | 'die' | 'das';
}

const LOADING_MESSAGES = [
  'Recording captured...',
  'Transcribing speech...',
  'Analyzing grammar...',
  'Creating quiz & breakdown...',
];

export function useNormalAudioProcessor(
  onTranscriptionSuccess?: (text: string) => void,
  onTranscriptionError?: (err: string) => void,
) {
  const [status, setStatus] = useState('Speak English or German');
  const [isRecording, setIsRecording] = useState(false);
  const [heard, setHeard] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [analysis, setAnalysis] = useState({
    explanation: '',
    tone: '',
    grammar: '',
    quiz: '',
    quizQuestions: [] as QuizQuestion[],
    articles: [] as GermanArticle[],
    compounds: [] as Compound[],
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
    setAnalysis({
      explanation: '',
      tone: '',
      grammar: '',
      quiz: '',
      quizQuestions: [],
      articles: [],
      compounds: [],
    });
    setStatus('Speak English or German');
    setIsRecording(false);
  }

  async function startRecording() {
    if (isRecording || isProcessingRef.current) return;

    try {
      setStatus('Recording…');
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
      setStatus('Processing…');
      setIsRecording(false);

      await recorder.stop();
      const uri = recorder.uri;

      if (uri) {
        isProcessingRef.current = true;
        setIsProcessing(true);
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
      setIsProcessing(false);
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
      // The backend holds the API key and enforces the daily limits.
      const transcribedText = await aiTranscribe(Platform.OS === 'ios' ? uri.replace('file://', '') : uri);
      if (!transcribedText) {
        throw new Error('No speech was detected. Try again.');
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
          "quiz": [
            {
              "question": "A multiple choice question about the user's sentence, written in English",
              "options": ["option A", "option B", "option C"],
              "answer_index": 0,
              "explanation": "One short sentence explaining why the answer is right"
            }
          ],
          "articles": [
            { "word": "Noun (e.g., Tisch)", "gender": "der" }
          ],
          "compounds": [
            {
              "word": "Handschuh",
              "parts": [
                { "text": "Hand", "meaning": "hand" },
                { "text": "Schuh", "meaning": "shoe" }
              ],
              "meaning": "glove"
            }
          ]
        }

        QUIZ RULES for "quiz":
        - Write exactly 3 questions about the user's sentence, each with 3 or 4 options and exactly one correct answer.
        - Mix the types: the article of a noun (options der/die/das), a fill-in-the-blank with a German word from the sentence, and the meaning of a word or phrase.
        - "answer_index" is the zero-based position of the correct option in "options". Double-check that it really points at the correct option.
        - Never give two options that are both correct. Keep options short.

        COMPOUND WORD RULES for "compounds":
        - Include every German compound word (a word built from two or more words) that appears in the user's sentence. Use [] if there are none.
        - Split into the smallest meaningful parts. The "text" of all parts joined together MUST spell the original word exactly, with no letters added or dropped.
        - A linking letter (Fugen-s, -n, -en, -e, -es) is its own part with an empty "meaning".
        - "meaning" of the whole word and of each part is a short English translation.
      `;

      const evaluationText = await aiChat(
        'analyze',
        [
          { role: 'system', content: systemPayload },
          { role: 'user', content: transcribedText },
        ],
        { json: true },
      );

      let evaluationJson = {
        explanation: '',
        tone: '',
        grammar: '',
        quiz: '' as unknown,
        articles: [] as GermanArticle[],
        compounds: [] as unknown[],
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
        // Older replies had a text quiz; the structured quiz is what the player uses.
        quiz: typeof evaluationJson.quiz === 'string' ? evaluationJson.quiz : '',
        quizQuestions: sanitizeQuiz(evaluationJson.quiz),
        articles: evaluationJson.articles || [],
        compounds: sanitizeCompounds(evaluationJson.compounds),
      });
      setStatus('Speak English or German');
    } catch (error) {
      clearInterval(interval);
      console.log('Audio pipeline failure:', error);
      const message = error instanceof Error ? error.message : 'Failed to process audio';
      setStatus(`Error: ${message}`);
      onTranscriptionError?.(message);
    }
  }

  return {
    status,
    isRecording,
    isProcessing,
    heard,
    analysis,
    resetApp,
    startRecording,
    stopRecording,
  };
}
