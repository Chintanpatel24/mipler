import React from 'react';
import { Modal } from '../ui/Modal';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const ApiSettingsModal: React.FC = () => {
  const { apiSettingsOpen, setApiSettingsOpen, aiApiKey, setAiApiKey, aiProvider, setAiProvider } = useWorkspaceStore();

  return (
    <Modal open={apiSettingsOpen} onClose={() => setApiSettingsOpen(false)} title="AI Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div>
          <p style={{ fontSize: 10, color: '#555', marginBottom: 8, fontFamily: 'IBM Plex Mono', letterSpacing: '0.06em' }}>PROVIDER</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'ollama', label: 'Ollama', sub: 'Local / free' },
              { id: 'openai', label: 'OpenAI', sub: 'API key required' },
              { id: 'custom', label: 'Custom', sub: 'Any compatible API' },
            ].map(p => (
              <button key={p.id} onClick={() => setAiProvider(p.id)}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 5, textAlign: 'center',
                  border: `1px solid ${aiProvider === p.id ? '#3a3a3a' : '#222'}`,
                  background: aiProvider === p.id ? '#252525' : '#1a1a1a', cursor: 'pointer' }}>
                <div style={{ fontSize: 11, fontWeight: 500, fontFamily: 'IBM Plex Mono',
                  color: aiProvider === p.id ? '#ccc' : '#555', marginBottom: 2 }}>{p.label}</div>
                <div style={{ fontSize: 9, color: '#444', fontFamily: 'IBM Plex Sans' }}>{p.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {aiProvider !== 'ollama' && (
          <div>
            <p style={{ fontSize: 10, color: '#555', marginBottom: 6, fontFamily: 'IBM Plex Mono', letterSpacing: '0.06em' }}>API KEY</p>
            <input type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)} placeholder="sk-…"
              style={{ width: '100%', padding: '7px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a',
                borderRadius: 5, fontSize: 12, color: '#ccc', outline: 'none', fontFamily: 'IBM Plex Mono', boxSizing: 'border-box' as const }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
          </div>
        )}

        {aiProvider === 'ollama' && (
          <div style={{ background: '#0f1a0f', border: '1px solid #1a3a1a', borderRadius: 6, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: '#3a6a3a', fontFamily: 'IBM Plex Mono', marginBottom: 6 }}>OLLAMA QUICK START</p>
            <p style={{ fontSize: 11, color: '#2a5a2a', fontFamily: 'IBM Plex Mono', lineHeight: 1.7 }}>
              ollama serve<br />
              ollama pull llama3<br />
              <span style={{ color: '#1a4a1a' }}>OLLAMA_ORIGINS=* ollama serve  # for CORS</span>
            </p>
          </div>
        )}

        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, padding: '10px 12px' }}>
          {[
            'API key stored in memory only — never on any server',
            'Included in exports so you can restore it on import',
            'Wiped when you close the tab',
          ].map(s => (
            <div key={s} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#333', flexShrink: 0, marginTop: 6 }} />
              <span style={{ fontSize: 11, color: '#444', fontFamily: 'IBM Plex Sans' }}>{s}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setApiSettingsOpen(false)}
          style={{ padding: '8px', background: '#2a2a2a', border: 'none', borderRadius: 5,
            fontSize: 12, color: '#ccc', cursor: 'pointer', fontFamily: 'IBM Plex Sans' }}>
          Done
        </button>
      </div>
    </Modal>
  );
};
