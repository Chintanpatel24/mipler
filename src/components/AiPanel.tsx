import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { sendAiMessage } from '../utils/aiApi';
import { v4 as uuidv4 } from 'uuid';

export const AiPanel: React.FC = () => {
  const { setAiPanelOpen, aiApiKey, aiProvider, aiChatHistory, addAiMessage, clearAiChat, setApiSettingsOpen } = useWorkspaceStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiChatHistory]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id: uuidv4(), role: 'user' as const, content: input.trim(), timestamp: new Date().toISOString() };
    addAiMessage(userMsg);
    setInput('');
    setLoading(true);
    try {
      const reply = await sendAiMessage(aiChatHistory, userMsg.content, aiApiKey, aiProvider);
      addAiMessage({ id: uuidv4(), role: 'assistant', content: reply, timestamp: new Date().toISOString() });
    } catch (e: any) {
      addAiMessage({ id: uuidv4(), role: 'assistant', content: `Error: ${e.message}`, timestamp: new Date().toISOString() });
    }
    setLoading(false);
  };

  const SUGGESTIONS = [
    'Analyze the domain example.com for OSINT',
    'Best tools for email investigation?',
    'How to map domain infrastructure?',
  ];

  return (
    <div style={{
      width: 340,
      height: '100%',
      background: '#161616',
      borderLeft: '1px solid #222',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid #222',
        background: '#1a1a1a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc', fontFamily: 'IBM Plex Sans, sans-serif' }}>
            AI Assistant
          </span>
          {!aiApiKey && (
            <span style={{ fontSize: 9, padding: '1px 5px', background: '#2a2000', color: '#886600', borderRadius: 3, fontFamily: 'IBM Plex Mono, monospace' }}>
              NO KEY
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button onClick={() => setApiSettingsOpen(true)} title="API Settings"
            style={{ padding: '3px 5px', color: '#444', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 3, lineHeight: 1 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#aaa')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#444')}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <circle cx="6" cy="6" r="2"/>
              <path d="M6 1v1.2M6 9.8V11M1 6h1.2M9.8 6H11M2.8 2.8l.85.85M8.35 8.35l.85.85M9.2 2.8l-.85.85M3.65 8.35l-.85.85"/>
            </svg>
          </button>
          <button onClick={clearAiChat} title="Clear chat"
            style={{ padding: '3px 5px', color: '#444', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 3 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#aaa')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#444')}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h7l-.7 5.5H2.7L2 3zM1 3h9M4 3V2h3v1"/>
            </svg>
          </button>
          <button onClick={() => setAiPanelOpen(false)}
            style={{ padding: '3px 5px', color: '#444', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 3 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ccc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#444')}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="8" y2="8"/><line x1="8" y1="1" x2="1" y2="8"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {aiChatHistory.length === 0 && (
          <div style={{ paddingTop: 20 }}>
            <p style={{ fontSize: 11, color: '#3a3a3a', marginBottom: 10, fontFamily: 'IBM Plex Sans', textAlign: 'center' }}>
              Ask about your investigation
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  style={{
                    padding: '6px 10px', background: '#1a1a1a', border: '1px solid #222',
                    borderRadius: 5, fontSize: 11, color: '#555', cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'IBM Plex Sans',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#333'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#555'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#222'; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {aiChatHistory.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '88%', padding: '7px 10px', borderRadius: 6, fontSize: 12,
              lineHeight: 1.55, fontFamily: 'IBM Plex Sans',
              background: msg.role === 'user' ? '#1c2a3a' : '#1a1a1a',
              border: `1px solid ${msg.role === 'user' ? '#1e3550' : '#252525'}`,
              color: '#c8c8c8',
            }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 12 }}>{msg.content}</pre>
              <p style={{ fontSize: 9, color: '#3a3a3a', marginTop: 4, fontFamily: 'IBM Plex Mono, monospace' }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
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

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #222' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={aiApiKey ? 'Ask anything...' : 'Set API key first'}
            disabled={!aiApiKey}
            style={{
              flex: 1, padding: '6px 10px', background: '#1a1a1a',
              border: '1px solid #252525', borderRadius: 5,
              fontSize: 12, color: '#ccc', outline: 'none',
              fontFamily: 'IBM Plex Sans', opacity: !aiApiKey ? 0.4 : 1,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#3a3a3a')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#252525')}
          />
          <button onClick={send} disabled={!input.trim() || loading || !aiApiKey}
            style={{
              padding: '6px 12px', background: '#0e639c', color: '#fff',
              border: 'none', borderRadius: 5, fontSize: 12,
              cursor: (!input.trim() || loading || !aiApiKey) ? 'default' : 'pointer',
              fontFamily: 'IBM Plex Sans',
              opacity: (!input.trim() || loading || !aiApiKey) ? 0.3 : 1,
            }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
