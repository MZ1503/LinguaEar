import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { styles } from '../../src/constants/style';
import { useNormalAudioProcessor } from '../../src/hooks/useNormalAudioProcessor';

// TypeScript Interface for Article Badge
interface GermanArticle {
  word: string;
  gender: 'der' | 'die' | 'das';
}

// Helper to determine article colors dynamically
const getArticleColor = (gender: string) => {
  switch (gender.toLowerCase()) {
    case 'der': return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }; // Blue (Masculine)
    case 'die': return { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' }; // Pink/Red (Feminine)
    case 'das': return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }; // Green (Neuter)
    default: return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
  }
};

export default function LinguaEarScreen() {
  const router = useRouter();
  
  const {
    status,
    isRecording,
    heard,
    analysis, 
    resetApp,
    startRecording,
    stopRecording
  } = useNormalAudioProcessor(); 

  // Toggle states for Accordions
  const [showGrammar, setShowGrammar] = useState<boolean>(false);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);

  // Safely extracting properties from hook
  const explanation = analysis?.explanation || '';
  const tone = analysis?.tone || '';
  const grammar = analysis?.grammar || '';
  const quiz = analysis?.quiz || '';
  
  // Safely extract articles (as any type cast keeps TS happy if hook type isn't fully updated yet)
  const articles: GermanArticle[] = (analysis as any)?.articles || [];

  const handleReset = () => {
    resetApp();
    setShowGrammar(false);
    setShowQuiz(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <Text style={styles.title}>LinguaEar</Text>
      <Text style={styles.subtitle}>Your AI German Companion</Text>
  
      {/* Big Clean Mic Button */}
      <TouchableOpacity 
        style={[styles.button, isRecording && styles.buttonRecording]}
        onPress={() => {
          if (isRecording) {
            stopRecording(); // Empty parenthesis prevents the event object mismatch error!
          } else {
            startRecording();
          }
        }}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '🛑 Tap to Stop Recording' : status}
        </Text>
      </TouchableOpacity>
  
      {/* 1. YOU ATTEMPTED CARD (Green Border) */}
      {heard ? (
        <View style={[styles.card, styles.attemptedCard]}>
          <View style={styles.cardHeader}> 
            <Text style={[styles.label, { color: '#10B981' }]}>YOU ATTEMPTED:</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetButton}>🔄 Reset</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.content}>{heard}</Text>
        </View>
      ) : null}
  
      {/* 2. EXPLANATION CARD (Blue Border with Dynamic Article Boxes) */}
      {explanation ? (
        <View style={{ width: '100%' }}>
          
          <View style={[styles.card, styles.explanationCard]}>
            <Text style={[styles.label, { color: '#3B82F6' }]}>LINGUAEAR ANALYSIS:</Text>
            <Text style={styles.content}>{explanation}</Text>
            
            {tone ? (
              <View style={styles.toneBadge}>
                <Text style={styles.toneText}>Tone: {tone}</Text>
              </View>
            ) : null}

            {/* --- NEW: DYNAMIC ARTICLES BOXES SECTION --- */}
            {articles.length > 0 && (
              <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 }}>
                  Nouns & Articles:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {articles.map((item, idx) => {
                    const colors = getArticleColor(item.gender);
                    return (
                      <View 
                        key={idx} 
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                          borderWidth: 1,
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 10,
                          flexDirection: 'row',
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{ fontWeight: '800', color: colors.text, textTransform: 'uppercase', fontSize: 11, marginRight: 5 }}>
                          {item.gender}
                        </Text>
                        <Text style={{ color: '#111827', fontWeight: '600', fontSize: 13 }}>
                          {item.word}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
  
          {/* 3. GRAMMAR TOGGLE BUTTON & CARD */}
          {grammar ? (
            <View style={{ width: '100%' }}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => setShowGrammar(!showGrammar)}
              >
                <Text style={styles.secondaryButtonText}>
                  📚 {showGrammar ? 'Hide Grammar' : 'Show Grammar Structure'}
                </Text>
              </TouchableOpacity>
      
              {showGrammar && (
                <View style={[styles.card, styles.grammarCard]}>
                  <Text style={[styles.label, { color: '#6366F1' }]}>🏗️ GRAMMAR RULE:</Text>
                  <Text style={styles.content}>{grammar}</Text>
                </View>
              )}
            </View>
          ) : null}
  
          {/* 4. QUIZ TOGGLE BUTTON & CARD */}
          {quiz ? (
            <View style={{ width: '100%' }}>
              <TouchableOpacity 
                style={styles.quizButton}
                onPress={() => setShowQuiz(!showQuiz)}
              >
                <Text style={styles.secondaryButtonText}>
                  ❓ {showQuiz ? 'Hide Quiz' : 'Quiz Me!'}
                </Text>
              </TouchableOpacity>
      
              {showQuiz && (
                <View style={[styles.card, styles.quizCard]}>
                  <Text style={[styles.label, { color: '#8B5CF6' }]}>❓ QUICK QUIZ CHALLENGE:</Text>
                  <Text style={styles.content}>{quiz}</Text>
                </View>
              )}
            </View>
          ) : null}
  
        </View>
      ) : null}
  
      {/* Privacy Link */}
      <TouchableOpacity 
        style={styles.privacyLink}
        onPress={() => router.push('/privacy')}
      >
        <Text style={styles.privacyText}>Privacy Policy & Impressum</Text>
      </TouchableOpacity>
  
    </ScrollView>
  );
}