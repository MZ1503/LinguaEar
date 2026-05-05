import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const router = useRouter();
const apikey=process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export default function LinguaEar() {
  const [status, setStatus] = useState('Speak English or German');
  const [heard, setHeard] = useState('');
  const [explanation, setExplanation] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [translation, setTranslation] = useState('');
  const [tone, setTone] = useState('');
  const [grammar, setGrammar] = useState('');
  const [quiz, setQuiz] = useState('');
  const [words, setWords] = useState('');
  const [showGrammar, setShowGrammar] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const loadingMessages = [
    '🎤 Heard you...',
    '📝 Transcribing...',
    '🧠 Analyzing grammar...',
    '💡 Almost ready...'
  ];


  function resetApp() {
    setHeard('');
    setExplanation('');
    setStatus('Speak English or German');
    setIsRecording(false);

  }

  async function startRecording() {
    try {
      setStatus('🎤 Recording...');
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
      
      await rec.stopAndUnloadAsync();
      
      const uri = rec.getURI();
      await sendToWhisper(uri);
      
    } catch (err) {
      setStatus('Speak English or German');
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
        setStatus(loadingMessages[0]);
        await sendToGPT(data.text);
      } 
      
      else {
        setStatus('Nothing heard — try again');
        setIsRecording(false);
      }
      
    } catch (err) {
      setStatus('Error — try again');
      setIsRecording(false);
    }
  }

  async function sendToGPT(text) {

    let messageIndex = 0;

    const interval = setInterval(() => {
      if (messageIndex < loadingMessages.length) {
        setStatus(loadingMessages[messageIndex]);
        messageIndex++;
      }
    }, 2000);

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
              content: `You are LinguaEar, a friendly German language teacher.

                        When given German OR English input, break down EVERY word:

                        1. 📝 Natural translation

                        2. 🔤 WORD BY WORD:
                              For each word explain:
- Nouns: 🔵 DER / 🔴 DIE / 🟢 DAS + meaning
- Pronouns: meaning + case (Nominativ/Akkusativ/Dativ)
- Verbs: meaning + type (Main verb/Helping verb/Modal)
- Adjectives: meaning + what it describes
- Prepositions: meaning + case it takes
- Articles: der/die/das/ein/eine
                         
                        3. 🏗️ SENTENCE STRUCTURE:
Show word positions:
[Subject] [Verb] [Object]
Rule: Verb ALWAYS in 2nd position!

📖 GRAMMAR RULE:
Which case is used and why
(Nominativ/Akkusativ/Dativ/Genitiv)


                        4. 🔄 ALTERNATIVE WAY:
                              Show another way to say the same thing in German

                        5. 💡 One usage tip

                        Then add ONLY these lines at the very end:
                        TONE: [😊 Friendly / 😠 Aggressive / 😐 Neutral / 👔 Formal]
                        GRAMMAR: [structure in 2 lines]
                        QUIZ: [similar but different question]
                        WORDS: german=english=article

                        IMPORTANT: Do NOT mention tone anywhere else except the TONE: line at the end!

                        Keep it SHORT and FRIENDLY! 🎤`
            
            },
            {
              role: 'user',
              content: `I just heard: ${text}`
            }
          ]
        })
      });

      const data = await response.json();
      clearInterval(interval);
      parseResponse(data.choices[0].message.content);
      setStatus('Speak English or German');
      setIsRecording(false);

         
      
    } catch (err) {
      clearInterval(interval)
      setStatus('Error — try again');
      setIsRecording(false);
    }
  }

  function parseResponse(response) {
    const lines = response.split('\n');
    const explanationLines: string[] = [];
    
    lines.forEach(line => {
      if (line.startsWith('TONE:')) 
        setTone(line.replace('TONE:', '').trim());
      else if (line.startsWith('GRAMMAR:')) 
        setGrammar(line.replace('GRAMMAR:', '').trim());
      else if (line.startsWith('QUIZ:')) 
        setQuiz(line.replace('QUIZ:', '').trim());
      else if (line.startsWith('WORDS:')) 
        setWords(line.replace('WORDS:', '').trim());
      else if (!line.startsWith('TONE') && 
               !line.startsWith('GRAMMAR') && 
               !line.startsWith('QUIZ') && 
               !line.startsWith('WORDS') &&
               !line.includes('Tone:') &&
               !line.includes('😊 Tone')) {
        
        // Clean markdown
        const cleanLine = line
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/###/g, '')
          .replace(/##/g, '')
          .trim();
        
        if (cleanLine) {
          explanationLines.push(cleanLine);
        }
      }
    });
    
    setExplanation(explanationLines.join('\n').trim());
  }


  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <Text style={styles.title}>LinguaEar</Text>
      <Text style={styles.subtitle}> Your AI German Companion </Text>

      <TouchableOpacity 
        style={[styles.button, isRecording && styles.buttonRecording]}
        onPress={startRecording}
        disabled={isRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '🔴 Listening...' : status}
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
  <View>
    <View style={styles.card}>
      <Text style={styles.label}>💡 LinguaEar Says:</Text>
      <Text style={styles.content}>{explanation}</Text>
      <Text style={styles.label}>😊 Tone:</Text>
      <Text style={styles.content}>{tone}</Text>
    </View>

    <TouchableOpacity 
      style={styles.secondaryButton}
      onPress={() => setShowGrammar(!showGrammar)}
    >
      <Text style={styles.secondaryButtonText}>
        📚 {showGrammar ? 'Hide Grammar' : 'Learn More'}
      </Text>
    </TouchableOpacity>

    {showGrammar && (
      <View style={styles.card}>
        <Text style={styles.label}>🏗️ Grammar:</Text>
        <Text style={styles.content}>{grammar}</Text>
      </View>
    )}

    <TouchableOpacity 
      style={styles.quizButton}
      onPress={() => setShowQuiz(!showQuiz)}
    >
      <Text style={styles.secondaryButtonText}>
        ❓ {showQuiz ? 'Hide Quiz' : 'Quiz Me!'}
      </Text>
    </TouchableOpacity>

    {showQuiz && (
      <View style={styles.card}>
        <Text style={styles.label}>❓ Quick Quiz:</Text>
        <Text style={styles.content}>{quiz}</Text>
      </View>
    )}
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

  secondaryButton: {
    backgroundColor: '#1e3a5f',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 10,
    alignItems: 'center',
  },
  quizButton: {
    backgroundColor: '#2d1b69',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  }


});