import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

interface Message { role: 'user' | 'assistant' | 'system'; content: string; }

const PRESETS = [
  { label: 'Analyze domain', text: 'Analyze the domain example.com. What can you find about its infrastructure, ownership, and potential security concerns?' },
  { label: 'IP investigation', text: 'What information can you gather about IP 8.8.8.8? What organization owns it and what services does it host?' },
  { label: 'OSINT strategy', text: 'Give me a step-by-step OSINT investigation strategy for researching a company named "Acme Corp".' },
];

export const ApiWorkspace: React.FC = () => {
  const { setApiWorkspaceOpen, aiPanelOpen, setAiPanelOpen, aiApiKey, setAiApiKey, aiProvider, setAiProvider, llmBaseUrl, llmModel, setLlmBaseUrl, setLlmModel } = useWorkspaceStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [baseUrl, setBaseUrl] = useState(() => llmBaseUrl || 'http://localhost:11434');
  const [model, setModel] = useState(() => llmModel || 'llama3');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Fetch Ollama models when provider is ollama
  useEffect(() => {
    if (aiProvider !== 'ollama') return;
    fetch(`${baseUrl}/api/tags`)
      .then(r => r.json())
      .then(d => {
        const names = (d.models || []).map((m: any) => m.name);
        setOllamaModels(names);
        if (names.length && !names.includes(model)) setModel(names[0]);
      })
      .catch(() => setOllamaModels([]));
  }, [aiProvider, baseUrl]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      let reply = '';

      if (aiProvider === 'ollama') {
        // Ollama API
        const res = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: newMessages,
            stream: false,
          }),
        });
        if (!res.ok) throw new Error(`Ollama error ${res.status} — is Ollama running at ${baseUrl}?`);
        const data = await res.json();
        reply = data.message?.content || data.response || 'No response';

      } else {
        // Generic OpenAI-compatible API
        const endpoint = aiProvider === 'openai'
          ? 'https://api.openai.com/v1/chat/completions'
          : `${baseUrl}/v1/chat/completions`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(aiApiKey ? { Authorization: `Bearer ${aiApiKey}` } : {}),
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are an OSINT and cybersecurity investigation assistant. Be concise and actionable.' },
              ...newMessages,
            ],
            max_tokens: 2048,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as any)?.error?.message || `API error ${res.status}`);
        }
        const data = await res.json();
        reply = data.choices?.[0]?.message?.content || 'No response';
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
    }
    setLoading(false);
  };

  const isOllama = aiProvider === 'ollama';
  const canSend = input.trim() && !loading && (isOllama || aiApiKey);

  return (
    <div style={{ width: 480, height: '100%', background: '#161616', borderLeft: '1px solid #222', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

      {/* Header tabs */}
      <div style={{ display: 'flex', alignItems: 'center', height: 35, background: '#1a1a1a', borderBottom: '1px solid #222' }}>
        {(['chat', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '0 16px', height: '100%', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: activeTab === tab ? '#ccc' : '#555',
              background: activeTab === tab ? '#161616' : 'transparent',
              border: 'none', borderBottom: activeTab === tab ? '1px solid #e0e0e0' : '1px solid transparent',
              cursor: 'pointer' }}>
            {tab}
          </button>
        ))}

        {/* Provider badge */}
        <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, padding: '1px 6px', background: '#222', border: '1px solid #333', borderRadius: 3,
            color: isOllama ? '#7cc47c' : '#7ab3e8', fontFamily: 'IBM Plex Mono, monospace' }}>
            {isOllama ? 'OLLAMA' : aiProvider.toUpperCase()}
          </span>
          <span style={{ fontSize: 9, color: '#444', fontFamily: 'IBM Plex Mono, monospace' }}>{model}</span>
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={() => setAiPanelOpen(!aiPanelOpen)} title="Toggle AI Panel"
          style={{ padding: '0 8px', height: '100%', color: aiPanelOpen ? '#888' : '#444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: 'IBM Plex Mono' }}>
          AI
        </button>
        <button onClick={() => setApiWorkspaceOpen(false)}
          style={{ padding: '0 10px', height: '100%', color: '#444', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ccc')}
          onMouseLeave={e => (e.currentTarget.style.color = '#444')}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="8" y2="8"/><line x1="8" y1="1" x2="1" y2="8"/>
          </svg>
        </button>
      </div>

      {/* ── CHAT TAB ── */}
      {activeTab === 'chat' && (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ paddingTop: 16 }}>
                <p style={{ fontSize: 11, color: '#3a3a3a', marginBottom: 12, fontFamily: 'IBM Plex Sans', textAlign: 'center' }}>
                  {isOllama ? `Connected to Ollama — model: ${model}` : `Ask the LLM about your investigation`}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {PRESETS.map(p => (
                    <button key={p.label} onClick={() => setInput(p.text)}
                      style={{ padding: '6px 10px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 5,
                        fontSize: 11, color: '#555', cursor: 'pointer', textAlign: 'left', fontFamily: 'IBM Plex Sans' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#333'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#222'; }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                {!isOllama && !aiApiKey && (
                  <div style={{ marginTop: 16, padding: '10px 12px', background: '#1a1200', border: '1px solid #3a2a00', borderRadius: 6 }}>
                    <p style={{ fontSize: 11, color: '#886600', fontFamily: 'IBM Plex Sans', marginBottom: 4 }}>No API key set</p>
                    <button onClick={() => setActiveTab('settings')}
                      style={{ fontSize: 11, color: '#7ab3e8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Sans', padding: 0 }}>
                      Open Settings to add one
                    </button>
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '88%', padding: '8px 11px', borderRadius: 6, fontSize: 12,
                  lineHeight: 1.6, fontFamily: msg.role === 'assistant' ? 'IBM Plex Mono, monospace' : 'IBM Plex Sans',
                  background: msg.role === 'user' ? '#1c2a3a' : '#1a1a1a',
                  border: `1px solid ${msg.role === 'user' ? '#1e3550' : '#252525'}`,
                  color: msg.content.startsWith('Error:') ? '#f87171' : '#c8c8c8' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 12 }}>{msg.content}</pre>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex' }}>
                <div style={{ padding: '7px 10px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 6, fontSize: 11, color: '#444', fontFamily: 'IBM Plex Mono' }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid #222', display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={!isOllama && !aiApiKey ? 'Set API key in Settings…' : 'Ask anything… (Enter to send, Shift+Enter for newline)'}
              disabled={!isOllama && !aiApiKey}
              rows={2}
              style={{ flex: 1, padding: '7px 10px', background: '#1a1a1a', border: '1px solid #252525',
                borderRadius: 5, fontSize: 12, color: '#ccc', outline: 'none', fontFamily: 'IBM Plex Sans',
                resize: 'none', opacity: (!isOllama && !aiApiKey) ? 0.4 : 1, lineHeight: 1.5 }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
              onBlur={e => (e.currentTarget.style.borderColor = '#252525')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={sendMessage} disabled={!canSend}
                style={{ padding: '6px 14px', background: '#0e639c', color: '#fff', border: 'none', borderRadius: 5,
                  fontSize: 12, cursor: canSend ? 'pointer' : 'default', fontFamily: 'IBM Plex Sans',
                  opacity: canSend ? 1 : 0.3 }}>
                Send
              </button>
              <button onClick={() => setMessages([])}
                style={{ padding: '4px 0', background: 'none', border: 'none', fontSize: 10,
                  color: '#444', cursor: 'pointer', fontFamily: 'IBM Plex Mono', textAlign: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                onMouseLeave={e => (e.currentTarget.style.color = '#444')}>
                clear
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Provider selector */}
          <div>
            <p style={{ fontSize: 10, color: '#555', marginBottom: 8, fontFamily: 'IBM Plex Mono', letterSpacing: '0.06em' }}>PROVIDER</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'ollama', label: 'Ollama', desc: 'Local' },
                { id: 'openai', label: 'OpenAI', desc: 'API key' },
                { id: 'custom', label: 'Custom', desc: 'Any OpenAI-compatible' },
              ].map(p => (
                <button key={p.id} onClick={() => { setAiProvider(p.id); if (p.id === 'openai') { setBaseUrl('https://api.openai.com'); setModel('gpt-4o-mini'); } else if (p.id === 'ollama') { setBaseUrl('http://localhost:11434'); setModel('llama3'); } }}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 5, textAlign: 'center',
                    border: `1px solid ${aiProvider === p.id ? '#3a3a3a' : '#222'}`,
                    background: aiProvider === p.id ? '#252525' : '#1a1a1a',
                    cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: aiProvider === p.id ? '#ccc' : '#666', fontFamily: 'IBM Plex Mono', marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 9, color: '#444', fontFamily: 'IBM Plex Sans' }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Base URL */}
          <div>
            <p style={{ fontSize: 10, color: '#555', marginBottom: 6, fontFamily: 'IBM Plex Mono', letterSpacing: '0.06em' }}>
              {isOllama ? 'OLLAMA URL' : 'BASE URL'}
            </p>
            <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
              placeholder={isOllama ? 'http://localhost:11434' : 'https://api.openai.com'}
              style={{ width: '100%', padding: '7px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a',
                borderRadius: 5, fontSize: 12, color: '#ccc', outline: 'none', fontFamily: 'IBM Plex Mono', boxSizing: 'border-box' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
          </div>

          {/* Model */}
          <div>
            <p style={{ fontSize: 10, color: '#555', marginBottom: 6, fontFamily: 'IBM Plex Mono', letterSpacing: '0.06em' }}>MODEL</p>
            {isOllama && ollamaModels.length > 0 ? (
              <select value={model} onChange={e => setModel(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: 5, fontSize: 12, color: '#ccc', outline: 'none', fontFamily: 'IBM Plex Mono', boxSizing: 'border-box' }}>
                {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input value={model} onChange={e => setModel(e.target.value)}
                placeholder={isOllama ? 'llama3, mistral, codellama…' : 'gpt-4o-mini, gpt-4o…'}
                style={{ width: '100%', padding: '7px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: 5, fontSize: 12, color: '#ccc', outline: 'none', fontFamily: 'IBM Plex Mono', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
            )}
            {isOllama && ollamaModels.length === 0 && (
              <p style={{ fontSize: 10, color: '#555', marginTop: 5, fontFamily: 'IBM Plex Sans' }}>
                Could not fetch models — check that Ollama is running at {baseUrl}
              </p>
            )}
          </div>

          {/* API Key (not for Ollama) */}
          {!isOllama && (
            <div>
              <p style={{ fontSize: 10, color: '#555', marginBottom: 6, fontFamily: 'IBM Plex Mono', letterSpacing: '0.06em' }}>API KEY</p>
              <input type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)}
                placeholder="sk-…"
                style={{ width: '100%', padding: '7px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: 5, fontSize: 12, color: '#ccc', outline: 'none', fontFamily: 'IBM Plex Mono', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
            </div>
          )}

          {/* Info boxes */}
          {isOllama && (
            <div style={{ background: '#0f1a0f', border: '1px solid #1a3a1a', borderRadius: 6, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, color: '#4a8a4a', fontFamily: 'IBM Plex Mono', marginBottom: 8, fontWeight: 500 }}>OLLAMA SETUP</p>
              {[
                'Install from ollama.com',
                'Run: ollama pull llama3',
                'Start: ollama serve',
                'CORS: OLLAMA_ORIGINS=* ollama serve',
              ].map(s => (
                <div key={s} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: '#2a5a2a', fontSize: 10 }}>$</span>
                  <span style={{ fontSize: 10, color: '#3a6a3a', fontFamily: 'IBM Plex Mono' }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {!isOllama && (
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: '#555', fontFamily: 'IBM Plex Mono', marginBottom: 6 }}>COMPATIBLE PROVIDERS</p>
              {['OpenAI — api.openai.com', 'Groq — api.groq.com/openai', 'Together AI — api.together.xyz', 'LM Studio — localhost:1234', 'Anything with /v1/chat/completions'].map(s => (
                <div key={s} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#333', flexShrink: 0, marginTop: 6 }} />
                  <span style={{ fontSize: 10, color: '#555', fontFamily: 'IBM Plex Sans' }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => { setLlmBaseUrl(baseUrl); setLlmModel(model); setActiveTab('chat'); }}
            style={{ padding: '8px', background: '#1e3a5f', border: 'none', borderRadius: 5,
              fontSize: 12, color: '#7ab3e8', cursor: 'pointer', fontFamily: 'IBM Plex Sans' }}>
            Save & Go to Chat
          </button>
        </div>
      )}
    </div>
  );
};
