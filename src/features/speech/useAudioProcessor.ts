import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  AudioModule,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { aiTranscribe } from '@/src/features/ai';

export function useAudioProcessor(
  onTranscriptionSuccess?: (text: string) => void,
  onTranscriptionError?: (err: string) => void,
) {
  const [status, setStatus] = useState('Speak English or German');
  const [isRecording, setIsRecording] = useState(false);
  const [heard, setHeard] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
    setStatus('Speak English or German');
    setIsRecording(false);
  }

  async function startRecording() {
    if (isRecording || isProcessingRef.current) return;

    try {
      setStatus('Recording…');
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

  /** Turns the recording into text; the game engine then produces the reply for it. */
  async function processSpeechOnBackend(uri: string) {
    try {
      // German only: the game is played in German, and pinning the language improves accuracy.
      const text = await aiTranscribe(Platform.OS === 'ios' ? uri.replace('file://', '') : uri, 'de');
      if (!text) throw new Error('No speech was detected. Try again.');

      setHeard(text);
      setStatus('Speak English or German');
      onTranscriptionSuccess?.(text);
    } catch (error) {
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
    resetApp,
    startRecording,
    stopRecording,
  };
}
