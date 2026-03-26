import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const CustomUrlModal: React.FC = () => {
  const { customUrlModalOpen, setCustomUrlModalOpen, addCard } = useWorkspaceStore();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const handleAdd = () => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) finalUrl = 'https://' + finalUrl;
    addCard('custom-url', undefined, { url: finalUrl, title: title.trim() || 'Web Tool' });
    setUrl(''); setTitle(''); setCustomUrlModalOpen(false);
  };

  const inputStyle = {
    width: '100%', padding: '7px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 5, fontSize: 12, color: '#ccc', outline: 'none', fontFamily: 'IBM Plex Sans', boxSizing: 'border-box' as const,
  };

  return (
    <Modal open={customUrlModalOpen} onClose={() => setCustomUrlModalOpen(false)} title="Add URL Card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12, color: '#666', fontFamily: 'IBM Plex Sans' }}>
          Load any URL inside a sandboxed card on your canvas.
        </p>
        <div>
          <p style={{ fontSize: 11, color: '#555', marginBottom: 6, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em' }}>URL</p>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="https://example.com" style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#3a3a3a')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')} />
        </div>
        <div>
          <p style={{ fontSize: 11, color: '#555', marginBottom: 6, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em' }}>TITLE (OPTIONAL)</p>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="My Tool" style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#3a3a3a')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')} />
        </div>
        <p style={{ fontSize: 11, color: '#444', fontFamily: 'IBM Plex Sans' }}>
          Note: Some sites block iframe embedding.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setCustomUrlModalOpen(false)}
            style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 5, fontSize: 12, color: '#666', cursor: 'pointer', fontFamily: 'IBM Plex Sans' }}>
            Cancel
          </button>
          <button onClick={handleAdd} disabled={!url.trim()}
            style={{ padding: '7px 16px', background: '#0e639c', border: 'none', borderRadius: 5, fontSize: 12, color: '#fff', cursor: url.trim() ? 'pointer' : 'default', fontFamily: 'IBM Plex Sans', opacity: url.trim() ? 1 : 0.4 }}>
            Add to Canvas
          </button>
        </div>
      </div>
    </Modal>
  );
};
