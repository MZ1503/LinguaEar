const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function fetchGroqEvaluation(systemPayload: string, userText: string): Promise<string> {
  if (!groqApiKey) {
    throw new Error("Missing Groq API Key configuration.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${groqApiKey}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPayload }, 
        { role: 'user', content: `I just said: ${userText}` }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
     throw new Error(`Groq API responded with status: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}