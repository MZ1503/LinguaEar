import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';


const router = useRouter();
const apikey=process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export default function LinguaEar() {
  const [status, setStatus] = useState('Tap to Listen');
  const [heard, setHeard] = useState('');
  const [explanation, setExplanation] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);


  function resetApp() {
    setHeard('');
    setExplanation('');
    setStatus('Tap to Listen');
    setIsRecording(false);

  }

  async function startRecording() {
    try {
      setStatus('Listening...');
      setIsRecording(true);
      
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);

      // 10 seconds ke baad automatically stop
      setTimeout(() => stopRecording(recording), 10000);
      
    } catch (err) {
      Alert.alert('Error', 'Microphone access needed');
      setStatus('Tap to Listen');
      setIsRecording(false);
    }
  }

  async function stopRecording(rec) {
    try {
      setStatus('Processing...');
      await rec.stopAndUnloadAsync();
      
      const uri = rec.getURI();
      await sendToWhisper(uri);
      
    } catch (err) {
      setStatus('Tap to Listen');
      setIsRecording(false);
    }
  }

  async function sendToWhisper(uri) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apikey}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.text) {
        setHeard(data.text);
        await sendToGPT(data.text);
      } else {
        setStatus('Nothing heard — try again');
        setIsRecording(false);
      }
      
    } catch (err) {
      setStatus('Error — try again');
      setIsRecording(false);
    }
  }

  async function sendToGPT(text) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apikey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are LinguaEar, a German language learning assistant. 
            When given a German phrase you heard in conversation:
            1. Translate it to English
            2. Tone: 😊 Friendly / 😠 Aggressive / 😐 Neutral / 👔 Formal
            3. Break down key words and what they mean
            4. Give one tip about when Germans use this phrase
            Keep explanations short and friendly like a helpful friend.`
            
            },
            {
              role: 'user',
              content: `I just heard: ${text}`
            }
          ]
        })
      });

      const data = await response.json();
      setExplanation(data.choices[0].message.content);
      setStatus('Tap to Listen');
      setIsRecording(false);
      
    } catch (err) {
      setStatus('Error — try again');
      setIsRecording(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <Text style={styles.title}>🎤 LinguaEar</Text>
      <Text style={styles.subtitle}> Your AI German Companion </Text>

      <TouchableOpacity 
        style={[styles.button, isRecording && styles.buttonRecording]}
        onPress={startRecording}
        disabled={isRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '🔴 ' : '🎤 '}{status}
        </Text>
      </TouchableOpacity>

      {heard ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}> 
            <Text style={styles.label}>📝 You Heard:</Text>
          <TouchableOpacity onPress={resetApp}>
            <Text style={styles.resetButton}>🔄 Reset</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.content}>{heard}</Text>
      </View>
      ) : null}

      {explanation ? (
        <View style={styles.card}>
          <Text style={styles.label}>💡 LinguaEar Says:</Text>
          <Text style={styles.content}>{explanation}</Text>
        </View>
      ) : null}


<TouchableOpacity 
        style={styles.privacyLink}
        onPress={() => router.push('/privacy')}
      >
        <Text style={styles.privacyText}>Privacy Policy & Impressum</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 30,
  },
  buttonRecording: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 8,
  },
  content: {
    color: '#ffffff',
    fontSize: 16,
  },
  privacyLink: {
    marginTop: 20,
    padding: 10,
  },
  privacyText: {
    color: '#555555',
    fontSize: 12,
    textDecorationLine: 'underline',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resetButton: {
    color: '#2563eb',
    fontSize: 14,
  },





});