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
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  let res = await authedFetch(path, init);
  for (let attempt = 0; attempt < RETRIES && res.status === 502; attempt++) {
    await sleep(700 * (attempt + 1));
    res = await authedFetch(path, init);
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
  const res = await send(`/ai/chat/${kind}`, {
    method: 'POST',
    body: JSON.stringify({ messages, json_mode: !!options.json, temperature: options.temperature ?? 0.3 }),
  });
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content)
    throw new AiError('The AI returned an empty answer.', 'upstream', 200);
  return content;
}

/** Turns a recording into text. `language` pins Whisper to German or English; leave it out to auto-detect. */
export async function aiTranscribe(uri: string, language?: 'de' | 'en'): Promise<string> {
  const extension = uri.split('.').pop() || 'm4a';
  const form = new FormData();
  form.append('file', { uri, type: `audio/${extension}`, name: `recording.${extension}` } as any);
  if (language) form.append('language', language);

  const res = await send('/ai/transcribe', { method: 'POST', body: form });
  const data = await res.json();
  return typeof data?.text === 'string' ? data.text : '';
}
