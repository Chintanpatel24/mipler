import React from 'react';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

const SERVICES = [
  { name: 'Google', url: 'https://images.google.com/' },
  { name: 'TinEye', url: 'https://tineye.com/' },
  { name: 'Yandex', url: 'https://yandex.com/images/' },
];

export const ReverseImageCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const cur = data.url || SERVICES[0].url;
  const tag = <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: '#666', background: '#222', padding: '1px 6px', borderRadius: 3 }}>REV-IMG</span>;

  return (
    <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor}
      onTitleChange={(t) => updateCard(id, { title: t })} headerExtra={tag}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {SERVICES.map((s) => (
          <button key={s.name} onClick={() => updateCard(id, { url: s.url })}
            style={{ padding: '3px 10px', fontSize: 10, borderRadius: 4, fontFamily: 'IBM Plex Sans', cursor: 'pointer', border: `1px solid ${cur === s.url ? '#3a3a3a' : '#2a2a2a'}`, background: cur === s.url ? '#2a2a2a' : '#1a1a1a', color: cur === s.url ? '#ccc' : '#555' }}>
            {s.name}
          </button>
        ))}
      </div>
      <iframe src={cur} title="Reverse Image Search"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        style={{ width: '100%', height: 260, borderRadius: 4, border: '1px solid #2a2a2a', background: '#fff' }} />
    </BaseCard>
  );
};
