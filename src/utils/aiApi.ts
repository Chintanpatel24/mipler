import type { AiMessage } from '../types';

export async function sendAiMessage(
  messages: AiMessage[],
  userMessage: string,
  apiKey: string,
  provider: string
): Promise<string> {
  if (!apiKey) throw new Error('No API key configured. Go to ⚙ API Settings.');

  const systemPrompt = `You are an OSINT research assistant embedded in Mipler, an investigation wall tool. Help the user with:
- Analyzing domains, IPs, emails, usernames
- Suggesting OSINT techniques and tools
- Interpreting WHOIS/DNS data
- Providing investigation guidance
Be concise, factual, and security-aware. Never fabricate data.`;

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: apiMessages, max_tokens: 2048 }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response';
  }

  if (provider === 'anthropic') {
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
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })).concat([{ role: 'user', content: userMessage }]),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic API error: ${res.status}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || 'No response';
  }

  // Generic OpenAI-compatible endpoint
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: apiMessages, max_tokens: 2048 }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response';
}