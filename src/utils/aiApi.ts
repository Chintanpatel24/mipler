import type { AiMessage } from '../types';

export async function sendAiMessage(
  history: AiMessage[],
  newMessage: string,
  apiKey: string,
  provider: string,
  baseUrl?: string,
  model?: string,
): Promise<string> {
  const msgs = history.map(m => ({ role: m.role, content: m.content }));
  msgs.push({ role: 'user', content: newMessage });

  if (provider === 'ollama') {
    const url = (baseUrl || 'http://localhost:11434') + '/api/chat';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || 'llama3', messages: msgs, stream: false }),
    });
    if (!res.ok) throw new Error(`Ollama error ${res.status} — is Ollama running?`);
    const data = await res.json();
    return data.message?.content || data.response || 'No response';
  }

  if (!apiKey) throw new Error('No API key. Open AI settings to add one.');

  const endpoint = provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : (baseUrl || 'https://api.openai.com') + '/v1/chat/completions';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an OSINT and cybersecurity investigation assistant. Be concise.' },
        ...msgs,
      ],
      max_tokens: 1024,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response';
}
