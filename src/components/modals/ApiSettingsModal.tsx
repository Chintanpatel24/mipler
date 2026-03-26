import React from 'react';
import { Modal } from '../ui/Modal';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const ApiSettingsModal: React.FC = () => {
  const { apiSettingsOpen, setApiSettingsOpen, aiApiKey, setAiApiKey, aiProvider, setAiProvider } = useWorkspaceStore();

  return (
    <Modal open={apiSettingsOpen} onClose={() => setApiSettingsOpen(false)} title="API Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, color: '#555', marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em' }}>PROVIDER</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ id: 'openai', label: 'OpenAI' }, { id: 'anthropic', label: 'Anthropic' }].map((p) => (
              <button
                key={p.id}
                onClick={() => setAiProvider(p.id)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 5,
                  border: `1px solid ${aiProvider === p.id ? '#3a3a3a' : '#2a2a2a'}`,
                  background: aiProvider === p.id ? '#2a2a2a' : '#1a1a1a',
                  fontSize: 12, color: aiProvider === p.id ? '#ccc' : '#555',
                  cursor: 'pointer', fontFamily: 'IBM Plex Sans',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 11, color: '#555', marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em' }}>API KEY</p>
          <input
            type="password"
            value={aiApiKey}
            onChange={(e) => setAiApiKey(e.target.value)}
            placeholder={aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
            style={{
              width: '100%', padding: '7px 10px', background: '#1a1a1a',
              border: '1px solid #2a2a2a', borderRadius: 5,
              fontSize: 12, color: '#ccc', outline: 'none', fontFamily: 'IBM Plex Mono, monospace',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#3a3a3a')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
          />
        </div>

        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, padding: '10px 12px' }}>
          <p style={{ fontSize: 11, color: '#555', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 6 }}>SECURITY NOTE</p>
          {[
            'API key is stored only in browser memory',
            'It is included in exports so you can restore it',
            'Key is sent directly to the AI provider, never to our servers',
            'Wiped completely when you close the tab',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#333', flexShrink: 0, marginTop: 5 }} />
              <span style={{ fontSize: 11, color: '#555', fontFamily: 'IBM Plex Sans' }}>{item}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setApiSettingsOpen(false)}
          style={{
            padding: '8px 16px', background: '#2a2a2a', color: '#ccc',
            border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer',
            fontFamily: 'IBM Plex Sans',
          }}
        >
          Done
        </button>
      </div>
    </Modal>
  );
};
