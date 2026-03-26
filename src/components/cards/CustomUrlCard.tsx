import React, { useState } from 'react';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const CustomUrlCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const [urlInput, setUrlInput] = useState(data.url || '');
  const [loaded, setLoaded] = useState(data.url || '');
  const isLight = data.cardColor === '#ffffff' || data.cardColor === '#f5f5f0';
  const inputBg = isLight ? '#f0f0f0' : '#161616';
  const inputColor = isLight ? '#1a1a1a' : '#ccc';
  const inputBorder = isLight ? '#ddd' : '#2a2a2a';

  const load = () => {
    let u = urlInput.trim();
    if (u && !u.startsWith('http')) u = 'https://' + u;
    setLoaded(u);
    updateCard(id, { url: u });
  };

  const tag = <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: '#666', background: '#222', padding: '1px 6px', borderRadius: 3 }}>URL</span>;

  return (
    <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor}
      onTitleChange={(t) => updateCard(id, { title: t })} headerExtra={tag}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="https://..."
          style={{ flex: 1, padding: '5px 8px', background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 4, color: inputColor, fontSize: 11, outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }} />
        <button onClick={load}
          style={{ padding: '5px 10px', background: '#1e3a5f', color: '#7ab3e8', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: 'IBM Plex Sans' }}>
          Load
        </button>
      </div>
      {loaded
        ? <iframe src={loaded} title={data.title} sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ width: '100%', height: 260, borderRadius: 4, border: '1px solid #2a2a2a', background: '#fff' }} />
        : <div style={{ padding: '28px 0', border: '1px dashed #2a2a2a', borderRadius: 4, textAlign: 'center', fontSize: 11, color: '#444', fontFamily: 'IBM Plex Sans' }}>
            Enter a URL above
          </div>
      }
    </BaseCard>
  );
};
