import { File } from 'expo-file-system';

import { authedFetch } from '@/src/features/auth';

export type AiKind = 'analyze' | 'game' | 'scan';

/** An AI call that was refused or failed, with a message that is safe to show the user. */
export class AiError extends Error {
  constructor(
    message: string,
    /** "quota" and "rate" are our own limits; "upstream" is the provider failing. */
    public code: 'quota' | 'rate' | 'upstream' | 'other',
    public status: number,
  ) {
    super(message);
  }
}

const RETRIES = 2;
const AI_TIMEOUT_MS = 60_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_BASE = 'https://api.groq.com/openai/v1';

async function groqChatFallback(
  messages: ChatMessage[],
  options: { json?: boolean; temperature?: number } = {},
): Promise<string> {
  if (!GROQ_KEY) throw new AiError('No Groq API key available for fallback.', 'other', 0);
  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages,
    temperature: options.temperature ?? 0.3,
  };
  if (options.json) body.response_format = { type: 'json_object' };

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    const msg = typeof errBody?.error?.message === 'string' ? errBody.error.message : 'Groq chat failed.';
    throw new AiError(msg, 'upstream', res.status);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content)
    throw new AiError('Groq returned an empty answer.', 'upstream', 200);
  return content;
}

async function groqTranscribeFallback(uri: string, language?: 'de' | 'en'): Promise<string> {
  if (!GROQ_KEY) throw new AiError('No Groq API key available for fallback.', 'other', 0);
  const form = new FormData();
  form.append('file', { uri, name: 'recording.m4a', type: 'audio/m4a' } as unknown as Blob);
  form.append('model', 'whisper-large-v3-turbo');
  if (language) form.append('language', language);

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = typeof body?.error?.message === 'string' ? body.error.message : 'Groq transcription failed.';
    throw new AiError(msg, 'upstream', res.status);
  }
  const data = await res.json();
  return typeof data?.text === 'string' ? data.text : '';
}

async function toError(res: Response): Promise<AiError> {
  const body = await res.json().catch(() => null);
  const detail = body?.detail;
  if (detail && typeof detail === 'object') {
    const code =
      detail.code === 'quota' || detail.code === 'rate' || detail.code === 'upstream' ? detail.code : 'other';
    return new AiError(String(detail.message ?? 'Something went wrong.'), code, res.status);
  }
  if (res.status === 503) return new AiError('AI features are not available right now.', 'other', 503);
  if (res.status === 413)
    return new AiError(typeof detail === 'string' ? detail : 'That is too large to send.', 'other', 413);
  return new AiError(typeof detail === 'string' ? detail : 'Something went wrong.', 'other', res.status);
}

/** Sends a request; a failing AI provider (502) is retried, but the user's own limits never are. */
async function send(path: string, init: RequestInit): Promise<Response> {
  // AI answers and uploads can legitimately take a while.
  const options = { ...init, timeoutMs: AI_TIMEOUT_MS };
  let res = await authedFetch(path, options);
  for (let attempt = 0; attempt < RETRIES && res.status === 502; attempt++) {
    await sleep(700 * (attempt + 1));
    res = await authedFetch(path, options);
  }
  if (!res.ok) throw await toError(res);
  return res;
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[];
};

/** Runs a prompt through the backend, which holds the API key and counts it against today's limit. */
export async function aiChat(
  kind: AiKind,
  messages: ChatMessage[],
  options: { json?: boolean; temperature?: number } = {},
): Promise<string> {
  try {
    const res = await send(`/ai/chat/${kind}`, {
      method: 'POST',
      body: JSON.stringify({ messages, json_mode: !!options.json, temperature: options.temperature ?? 0.3 }),
    });
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content)
      throw new AiError('The AI returned an empty answer.', 'upstream', 200);
    return content;
  } catch (err) {
    if (GROQ_KEY) {
      console.warn('Backend aiChat failed, falling back to Groq directly:', err);
      return groqChatFallback(messages, options);
    }
    throw err;
  }
}

/** Turns a recording into text. `language` pins Whisper to German or English; leave it out to auto-detect. */
export async function aiTranscribe(uri: string, language?: 'de' | 'en'): Promise<string> {
  const form = new FormData();
  // Expo's fetch only understands text, Blobs and objects with bytes(). The old React Native style
  // { uri, type, name } object is rejected ("Unsupported FormDataPart"), so the recording is passed as a File.
  // Its name (recording-....m4a) is sent as the filename, which is how the server tells the audio format.
  form.append('file', new File(uri) as unknown as Blob);
  if (language) form.append('language', language);

  try {
    const res = await send('/ai/transcribe', { method: 'POST', body: form });
    const data = await res.json();
    return typeof data?.text === 'string' ? data.text : '';
  } catch (err) {
    // The Metro terminal then shows which file was being sent, which is what a failed upload hinges on.
    console.warn('Recording upload failed. File:', uri, '| error:', err);
    if (GROQ_KEY) {
      console.warn('Backend transcribe failed, falling back to Groq Whisper directly.');
      return groqTranscribeFallback(uri, language);
    }
    throw err;
  }
}
