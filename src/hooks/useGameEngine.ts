import { useState } from 'react';

import { GERMAN_TEACHER_PROMPTS, OUTPUT_TOKENS_INSTRUCTION, LOADING_MESSAGES } from '../../src/constants/immigrationData';
import { fetchGroqEvaluation } from '../../src/services/groqService';

export function useGameEngine() {
  const [currentMode, setCurrentMode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Select a level to start roleplaying!');
  const [score, setScore] = useState<number>(0);
  const [heard, setHeard] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  
 
  const [breakdowns, setBreakdowns] = useState<{ word: string; meaning: string }[]>([]);

  function parseGameResponse(response: string) {
    const lines = response.split('\n');
    const explanationLines: string[] = [];
    const newBreakdowns: { word: string; meaning: string }[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^SCORE:/i.test(trimmed)) {
        const parsedScore = parseInt(trimmed.replace(/^SCORE:/i, '').trim());
        if (!isNaN(parsedScore)) setScore(prev => prev + parsedScore);
      } else if (/^(NEXT AI RESPONSE|AI RESPONSE):/i.test(trimmed)) {
        setAiPrompt(trimmed.replace(/^(NEXT AI RESPONSE|AI RESPONSE):/i, '').trim());
      } 
     
      else if (/^BREAKDOWN:/i.test(trimmed)) {
        const contentWithoutPrefix = trimmed.replace(/^BREAKDOWN:/i, '').trim();
        if (contentWithoutPrefix && !/none/i.test(contentWithoutPrefix)) {
          const parts = contentWithoutPrefix.split(':');
          if (parts.length >= 2) {
            newBreakdowns.push({ word: parts[0].trim(), meaning: parts[1].trim() });
          }
        }
      } else if (!/^(TONE|GRAMMAR|QUIZ|WORDS|SCORE|NEXT|AI RESPONSE|BREAKDOWN)/i.test(trimmed)) {
        const cleanLine = trimmed.replace(/\*\*/g, '').replace(/\*/g, '').trim();
        if (cleanLine) explanationLines.push(cleanLine);
      }
    });
    
    setExplanation(explanationLines.join('\n').trim());
    setBreakdowns(newBreakdowns);
  }

  async function processUserSpeech(text: string) {
    if (!currentMode) return;
    setHeard(text);
    
    let msgIdx = 0;
    const interval = setInterval(() => { 
      if (msgIdx < LOADING_MESSAGES.length) { 
        setStatus(LOADING_MESSAGES[msgIdx]); 
        msgIdx++; 
      } 
    }, 1200);

    try {
      const levelPersona = GERMAN_TEACHER_PROMPTS[currentMode];
      const systemPayload = `${levelPersona}\n\n${OUTPUT_TOKENS_INSTRUCTION}`;

      const aiResponse = await fetchGroqEvaluation(systemPayload, text);
      clearInterval(interval);
      
      parseGameResponse(aiResponse);
      setStatus(`Playing Level: ${currentMode.toUpperCase()}`);
    } catch (err) {
      clearInterval(interval);
      setStatus('System Processing Error');
      console.error(err);
    }
  }

  function resetGame() {
    setCurrentMode(null);
    setAiPrompt('');
    setHeard('');
    setExplanation('');
    setBreakdowns([]);
    setStatus('Select a level to start role playing!');
  }

  return {
    currentMode, setCurrentMode,
    status, setStatus,
    score, setScore,
    heard, explanation, aiPrompt, setAiPrompt,
    breakdowns, 
    processUserSpeech, resetGame
  };
}