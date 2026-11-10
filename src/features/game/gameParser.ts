import type { Breakdown } from './gameTypes';

/** Turns the model's tagged text reply into state updates. Pure, so it is easy to test. */
export function parseGameResponse(response: string) {
  const explanationLines: string[] = [];
  const breakdowns: Breakdown[] = [];
  let scoreDelta = 0;
  let aiPrompt: string | undefined;

  for (const line of response.split('\n')) {
    const trimmed = line.trim();
    if (/^SCORE:/i.test(trimmed)) {
      const parsed = parseInt(trimmed.replace(/^SCORE:/i, '').trim());
      if (!isNaN(parsed)) scoreDelta += parsed;
    } else if (/^(NEXT AI RESPONSE|AI RESPONSE):/i.test(trimmed)) {
      aiPrompt = trimmed.replace(/^(NEXT AI RESPONSE|AI RESPONSE):/i, '').trim();
    } else if (/^BREAKDOWN:/i.test(trimmed)) {
      const content = trimmed.replace(/^BREAKDOWN:/i, '').trim();
      if (content && !/none/i.test(content)) {
        const parts = content.split(':');
        if (parts.length >= 2) breakdowns.push({ word: parts[0].trim(), meaning: parts[1].trim() });
      }
    } else if (!/^(TONE|GRAMMAR|QUIZ|WORDS|SCORE|NEXT|AI RESPONSE|BREAKDOWN)/i.test(trimmed)) {
      const clean = trimmed.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      if (clean) explanationLines.push(clean);
    }
  }

  return { scoreDelta, aiPrompt, explanation: explanationLines.join('\n').trim(), breakdowns };
}
