/** One multiple-choice question. Field names match the API, so a saved quiz round-trips unchanged. */
export type QuizQuestion = {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
};

const MAX_QUESTIONS = 5;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Keeps only questions that can actually be answered (2-5 distinct options, a valid answer),
 * and shuffles the options so the model's habit of putting the answer first doesn't show.
 */
export function sanitizeQuiz(raw: unknown): QuizQuestion[] {
  if (!Array.isArray(raw)) return [];

  const result: QuizQuestion[] = [];
  for (const item of raw) {
    const question = typeof item?.question === 'string' ? item.question.trim() : '';
    const options: string[] = Array.isArray(item?.options)
      ? item.options
          .filter((o: unknown): o is string => typeof o === 'string' && !!o.trim())
          .map((o: string) => o.trim())
      : [];
    const index = item?.answer_index;

    if (!question || options.length < 2 || options.length > 5) continue;
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) continue;
    if (!Number.isInteger(index) || index < 0 || index >= item.options.length) continue;

    // `index` points into the original array; find the answer in the cleaned one.
    const answer = String(item.options[index]).trim();
    const shuffled = shuffle(options);
    const answerIndex = shuffled.indexOf(answer);
    if (answerIndex < 0) continue;

    result.push({
      question,
      options: shuffled,
      answer_index: answerIndex,
      explanation: typeof item?.explanation === 'string' ? item.explanation.trim() : '',
    });
    if (result.length === MAX_QUESTIONS) break;
  }
  return result;
}
