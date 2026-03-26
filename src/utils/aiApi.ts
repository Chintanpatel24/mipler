import type { AiMessage } from '../types';

export async function sendAiMessage(
  history: AiMessage[],
  newMessage: string,
  apiKey: string,
  provider: string
): Promise<string> {
  if (!apiKey) throw new Error('No API key configured. Open API Settings to add one.');

  if (provider === 'anthropic') {
    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: newMessage },
    ];
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: 'You are an OSINT investigation assistant. Help analyze domains, IPs, people, and digital footprints. Be concise and actionable.',
        messages,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `Anthropic API error ${res.status}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || 'No response';
  }

  // OpenAI
  const messages = [
    { role: 'system', content: 'You are an OSINT investigation assistant. Help analyze domains, IPs, people, and digital footprints. Be concise and actionable.' },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: newMessage },
  ];
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 1024 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `OpenAI API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response';
}
