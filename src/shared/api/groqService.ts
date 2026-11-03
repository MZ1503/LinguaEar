const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';

// Fallback model used when the configured model is unavailable
const FALLBACK_MODEL = 'openai/gpt-oss-20b';

// Cache for the available models list
let cachedModels: Set<string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the list of currently available models from Groq.
 * Returns the cached list on failure, or null if nothing is cached.
 */
async function getAvailableModels(): Promise<Set<string> | null> {
  if (!groqApiKey) return null;

  const now = Date.now();
  if (cachedModels && now - cacheTimestamp < CACHE_TTL) {
    return cachedModels;
  }

  try {
    const resp = await fetch(GROQ_MODELS_URL, {
      headers: { Authorization: `Bearer ${groqApiKey}` },
    });

    if (!resp.ok) {
      console.warn(`Failed to fetch Groq model list (${resp.status})`);
      // Reset TTL so we retry on the next call instead of hammering the API
      cacheTimestamp = now;
      return cachedModels;
    }

    const data = await resp.json();
    const ids = new Set<string>(
      (data?.data || [])
        .map((m: any) => m?.id)
        .filter((id: unknown): id is string => typeof id === 'string')
    );

    cachedModels = ids;
    cacheTimestamp = now;
    return ids;
  } catch (e) {
    console.warn('Error fetching Groq model list:', e);
    cacheTimestamp = now;
    return cachedModels;
  }
}

/**
 * Decides which model to use:
 * 1. Configured model if it is available
 * 2. Otherwise FALLBACK_MODEL
 * 3. Otherwise the first available model
 * 4. If the list could not be fetched, try the configured model (best effort)
 */
function pickModel(configuredModel: string, available: Set<string> | null): string {
  // No list available — try the configured model anyway
  if (!available || available.size === 0) {
    return configuredModel;
  }

  if (available.has(configuredModel)) {
    return configuredModel;
  }

  console.warn(
    `Configured model "${configuredModel}" is unavailable. Falling back to "${FALLBACK_MODEL}".`
  );

  if (available.has(FALLBACK_MODEL)) {
    return FALLBACK_MODEL;
  }

  const firstAvailable = available.values().next().value;
  if (typeof firstAvailable === 'string') {
    console.warn(`Fallback "${FALLBACK_MODEL}" also unavailable. Using "${firstAvailable}".`);
    return firstAvailable;
  }

  // Set has entries but no valid string was found — try the configured model
  return configuredModel;
}

/**
 * Extracts a readable error message from a failed response.
 * Reads the body only once to avoid the json()/text() conflict.
 */
async function extractErrorBody(response: Response): Promise<string> {
  try {
    const raw = await response.text();
    if (!raw) return '';
    try {
      const parsed = JSON.parse(raw);
      return parsed?.error?.message || raw;
    } catch {
      return raw;
    }
  } catch {
    return '';
  }
}

/**
 * Main entry point: sends an evaluation request to Groq.
 */
export async function fetchGroqEvaluation(
  systemPayload: string,
  userText: string
): Promise<string> {
  if (!groqApiKey) {
    throw new Error('Missing Groq API Key configuration.');
  }

  const configuredModel = process.env.EXPO_PUBLIC_GROQ_MODEL || FALLBACK_MODEL;
  const available = await getAvailableModels();
  const modelToUse = pickModel(configuredModel, available);

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: 'system', content: systemPayload },
        { role: 'user', content: `I just said: ${userText}` },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await extractErrorBody(response);
    throw new Error(
      `Groq API ${response.status}: ${errorBody || response.statusText}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq returned empty content.');
  }

  return content;
}