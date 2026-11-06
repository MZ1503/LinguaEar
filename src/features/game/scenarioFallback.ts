import type { GameLevel, GameScenario } from './gameTypes';

/** Used when the server can't be reached, so the game is never empty. The server's list replaces it. */
export const FALLBACK_LEVELS: GameLevel[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    cefr: 'A1-A2',
    description: 'Short, simple sentences and a slow pace, with hints when you get stuck.',
    rules:
      'LEVEL: BEGINNER (A1-A2). Use very short, simple sentences (at most 8 words), the present tense and common words. Speak slowly. If the user seems stuck, ask again more simply. Judge the answer against a beginner.',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    cefr: 'B1',
    description: 'Natural everyday German with follow-up questions and a few complications.',
    rules:
      'LEVEL: INTERMEDIATE (B1). Speak naturally at an everyday pace with past tenses and connectors. Ask a follow-up question. Only point out clear mistakes.',
  },
  {
    id: 'professional',
    label: 'Professional',
    cefr: 'B2-C1',
    description: 'Formal, precise German with idioms, official wording and real-world pushback.',
    rules:
      'LEVEL: PROFESSIONAL (B2-C1). Use formal, precise German (Sie form), subordinate clauses and idioms. Be realistic and demanding. Judge strictly for grammar, politeness and word choice.',
  },
];

const make = (
  id: number,
  slug: string,
  title: string,
  description: string,
  category: string,
  icon: string,
  tint: string,
  persona: string,
  opening: string,
): GameScenario => ({
  id,
  slug,
  title,
  description,
  category,
  icon,
  tint,
  persona,
  openings: { beginner: opening, intermediate: opening, professional: opening },
  key_phrases: [],
  sort_order: id,
});

export const FALLBACK_SCENARIOS: GameScenario[] = [
  make(
    -1,
    'immigration',
    'Immigration Office',
    'Ausländerbehörde: residence permit and documents',
    'Official',
    'business-outline',
    '#6366F1',
    'You are a helpful German official at the Ausländerbehörde. Test the user\'s German for a visa renewal scenario. Speak politely but in official German.',
    'Guten Tag. Zeigen Sie mir bitte Ihren Reisepass.',
  ),
  make(
    -2,
    'cafe',
    'German Café',
    'Order coffee and cake like a local',
    'Daily life',
    'cafe-outline',
    '#F59E0B',
    'You are a friendly waiter at a traditional German café in Berlin. Talk to the customer in everyday German.',
    'Hallo! Was darf ich Ihnen heute bringen?',
  ),
  make(
    -3,
    'taxi',
    'Taxi Ride',
    'Give directions and agree on the fare',
    'Travel',
    'car-outline',
    '#10B981',
    'You are a talkative taxi driver in Frankfurt. Chat with the passenger casually in German.',
    'Moin! Wohin soll es denn gehen?',
  ),
];
