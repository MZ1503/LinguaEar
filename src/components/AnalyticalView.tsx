import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AnalysisData {
  explanation: string;
  tone: string;
  grammar: string;
  quiz: string;
  words: string;
}

interface AnalyticalViewProps {
  analysis: AnalysisData;
  styles: any; // Passing shared styles object
}

export function AnalyticalView({ analysis, styles }: AnalyticalViewProps) {
  const [showGrammar, setShowGrammar] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  return (
    <View style={{ width: '100%' }}>
      <View style={styles.card}>
        <Text style={styles.label}>💡 LinguaEar Says:</Text>
        <Text style={styles.content}>{analysis.explanation}</Text>
        {analysis.tone && (
          <>
            <Text style={[styles.label, { marginTop: 12 }]}>😊 Detected Tone:</Text>
            <Text style={styles.content}>{analysis.tone}</Text>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowGrammar(!showGrammar)}>
        <Text style={styles.secondaryButtonText}>
          {showGrammar ? '📚 Hide Grammar' : '📚 Deep Dive Grammar'}
        </Text>
      </TouchableOpacity>

      {showGrammar && analysis.grammar && (
        <View style={styles.card}>
          <Text style={styles.label}>🏗️ Grammar Breakdown:</Text>
          <Text style={styles.content}>{analysis.grammar}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.quizButton} onPress={() => setShowQuiz(!showQuiz)}>
        <Text style={styles.secondaryButtonText}>
          {showQuiz ? '❓ Hide Quiz' : '❓ Challenge Me (Quiz)!'}
        </Text>
      </TouchableOpacity>

      {showQuiz && analysis.quiz && (
        <View style={styles.card}>
          <Text style={styles.label}>❓ Quick Quiz:</Text>
          <Text style={styles.content}>{analysis.quiz}</Text>
        </View>
      )}
    </View>
  );
}